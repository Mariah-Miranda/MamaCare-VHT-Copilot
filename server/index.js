import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import OpenAI, { toFile } from 'openai'
import multer from 'multer'
import path from 'node:path'
import { createHash } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import db from './db.js'

const app = express()
const port = process.env.PORT || 8787
const jwtSecret = process.env.JWT_SECRET || 'development-only-change-me'
const openai = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 12 * 1024 * 1024 } })

app.use(cors())
app.use(express.json({ limit: '8mb' }))

function tokenFor(user) { return jwt.sign({ id: user.id, role: user.role, village: user.village }, jwtSecret, { expiresIn: '8h' }) }
function publicUser(user) { return { id: user.id, name: user.name, email: user.email, role: user.role, village: user.village } }
function auth(requiredRole) {
  return (req, res, next) => {
    const header = req.headers.authorization || ''
    try {
      req.user = jwt.verify(header.replace('Bearer ', ''), jwtSecret)
      if (requiredRole && req.user.role !== requiredRole) return res.status(403).json({ error: 'Supervisor access required.' })
      next()
    } catch { res.status(401).json({ error: 'Please sign in again.' }) }
  }
}

function demoAssessment(context) {
  const dangerSigns = Array.isArray(context.dangerSigns) ? context.dangerSigns : []
  const bp = String(context.vitals?.bloodPressure || '')
  const [systolic, diastolic] = bp.split('/').map(Number)
  const urgent = systolic >= 140 && diastolic >= 90 || dangerSigns.some((sign) => ['Severe headache', 'Blurred vision', 'Vaginal bleeding', 'Convulsions', 'Loss of consciousness'].includes(sign))
  return {
    riskLevel: urgent ? 'High' : dangerSigns.length ? 'Moderate' : 'Low',
    possibleConditions: urgent ? ['Possible gestational hypertension'] : dangerSigns.length ? ['Needs closer observation'] : ['No immediate concerns identified'],
    dangerSignsIdentified: dangerSigns,
    explanation: urgent ? 'The recorded findings include a safety concern that warrants prompt clinical review.' : 'The available information does not indicate an immediate emergency, while routine monitoring remains important.',
    immediateActions: urgent ? ['Refer immediately to the nearest Health Centre IV or hospital.', 'Repeat measurements if safe to do so.', 'Contact the supervising midwife.'] : ['Continue routine ANC monitoring.', 'Reinforce medication, nutrition and return precautions.'],
    referralRecommendation: urgent ? 'Immediate' : 'Routine follow-up',
    counselingTips: ['Report severe headache, blurred vision or vaginal bleeding immediately.', 'Keep the next ANC appointment.'],
    followUpPlan: urgent ? 'Same day clinical review' : 'Next scheduled ANC visit',
    visitSummary: urgent ? 'Safety-first referral recommended based on the combined visit findings.' : 'Stable visit based on the information recorded.',
    confidence: urgent ? 0.94 : 0.88,
  }
}

const assessmentSchema = {
  name: 'maternal_health_assessment',
  strict: true,
  schema: {
    type: 'object',
    additionalProperties: false,
    properties: {
      riskLevel: { type: 'string', enum: ['Low', 'Moderate', 'High'] },
      possibleConditions: { type: 'array', items: { type: 'string' } },
      dangerSignsIdentified: { type: 'array', items: { type: 'string' } },
      explanation: { type: 'string' },
      immediateActions: { type: 'array', items: { type: 'string' } },
      referralRecommendation: { type: 'string' },
      counselingTips: { type: 'array', items: { type: 'string' } },
      followUpPlan: { type: 'string' },
      visitSummary: { type: 'string' },
      confidence: { type: 'number', minimum: 0, maximum: 1 },
    },
    required: ['riskLevel', 'possibleConditions', 'dangerSignsIdentified', 'explanation', 'immediateActions', 'referralRecommendation', 'counselingTips', 'followUpPlan', 'visitSummary', 'confidence'],
  },
}

async function assessWithAI(context) {
  if (!openai) return demoAssessment(context)
  const completion = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL || 'gpt-5.6-terra',
    temperature: 0.1,
    response_format: { type: 'json_schema', json_schema: assessmentSchema },
    messages: [
      { role: 'system', content: 'You are an experienced maternal healthcare clinical decision support assistant for Uganda’s Village Health Teams. Follow WHO maternal health guidelines and Uganda Ministry of Health antenatal care recommendations where applicable. Never diagnose with certainty. Always prioritize patient safety. Clearly identify danger signs requiring urgent referral.' },
      { role: 'user', content: JSON.stringify(context) },
    ],
  })
  return JSON.parse(completion.choices[0].message.content)
}

function requireOpenAI(res) {
  if (openai) return true
  res.status(503).json({ error: 'OpenAI is not configured. Add OPENAI_API_KEY to .env and restart the server.' })
  return false
}

function aiFailureMessage(error, fallback) {
  if (error?.status === 401 || error?.code === 'invalid_api_key') return 'The OpenAI API key is invalid. Replace OPENAI_API_KEY in .env and restart the server.'
  if (error?.status === 429 || error?.code === 'insufficient_quota') return 'The OpenAI API quota is exhausted. Add billing/credits to the API project or use a key with available quota, then restart the server.'
  return fallback
}

async function transcribeAudio(file) {
  const audioFile = await toFile(file.buffer, file.originalname || 'mamacare-voice.webm', { type: file.mimetype || 'audio/webm' })
  const result = await openai.audio.transcriptions.create({
    file: audioFile,
    model: process.env.OPENAI_TRANSCRIBE_MODEL || 'gpt-4o-transcribe',
    prompt: 'Maternal healthcare visit in Uganda. Preserve names, numbers, blood pressure, gestational age, symptoms, English and Luganda words where possible.',
  })
  return result.text
}

function parseJson(text) {
  const jsonText = String(text || '').match(/\{[\s\S]*\}/)?.[0] || '{}'
  return JSON.parse(jsonText)
}

const translationPromptVersion = 'v1'
const pendingTranslations = new Map()

function translationCacheKey(type, source, targetLanguage) {
  return createHash('sha256').update(JSON.stringify([translationPromptVersion, type, targetLanguage.trim().toLowerCase(), source])).digest('hex')
}

async function cachedTranslation(type, source, targetLanguage, translate) {
  const cacheKey = translationCacheKey(type, source, targetLanguage)
  const cached = db.prepare('SELECT translated_text FROM translation_cache WHERE cache_key = ?').get(cacheKey)
  if (cached) return cached.translated_text
  if (pendingTranslations.has(cacheKey)) return pendingTranslations.get(cacheKey)

  const pending = translate().then((translatedText) => {
    db.prepare('INSERT OR IGNORE INTO translation_cache (cache_key, translation_type, target_language, source_text, translated_text) VALUES (?, ?, ?, ?, ?)').run(cacheKey, type, targetLanguage, source, translatedText)
    return translatedText
  }).finally(() => pendingTranslations.delete(cacheKey))
  pendingTranslations.set(cacheKey, pending)
  return pending
}

async function translateCatalogWithAI(catalog, targetLanguage) {
  const source = JSON.stringify(catalog)
  const translatedText = await cachedTranslation('catalog', source, targetLanguage, async () => {
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-5.6-terra',
      temperature: 0.1,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: `You translate UI copy for a maternal healthcare application from English to ${targetLanguage}. Return one valid JSON object with exactly the same keys. Translate values naturally for Uganda VHTs. Preserve placeholders such as {firstName}, {count}, acronyms, numbers, and medical units. Do not translate names or product names.` },
        { role: 'user', content: source },
      ],
    })
    return completion.choices[0].message.content?.trim() || '{}'
  })
  const translated = parseJson(translatedText)
  return Object.fromEntries(Object.entries(catalog).map(([key, value]) => [key, translated[key] || value]))
}

app.get('/api/health', (_req, res) => res.json({ ok: true, service: 'MamaCare VHT Copilot' }))

app.post('/api/auth/register', async (req, res) => {
  const { name, email, password, role = 'VHT', village = '' } = req.body
  if (!name || !email || !password) return res.status(400).json({ error: 'Name, email and password are required.' })
  try {
    const passwordHash = await bcrypt.hash(password, 12)
    const result = db.prepare('INSERT INTO users (name, email, password_hash, role, village) VALUES (?, ?, ?, ?, ?)').run(name, email.toLowerCase(), passwordHash, role, village)
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid)
    res.status(201).json({ user: publicUser(user), token: tokenFor(user) })
  } catch { res.status(409).json({ error: 'An account with this email already exists.' }) }
})

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email?.toLowerCase())
  if (!user || !(await bcrypt.compare(password || '', user.password_hash))) return res.status(401).json({ error: 'Invalid email or password.' })
  res.json({ user: publicUser(user), token: tokenFor(user) })
})

app.get('/api/auth/me', auth(), (req, res) => res.json({ user: publicUser(db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id)) }))

app.get('/api/mothers', auth(), (req, res) => {
  const query = req.user.role === 'Supervisor' ? 'SELECT * FROM mothers ORDER BY created_at DESC' : 'SELECT * FROM mothers WHERE assigned_vht_id = ? ORDER BY created_at DESC'
  res.json({ mothers: req.user.role === 'Supervisor' ? db.prepare(query).all() : db.prepare(query).all(req.user.id) })
})

app.post('/api/mothers', auth(), (req, res) => {
  const body = req.body
  const result = db.prepare(`INSERT INTO mothers (full_name, age, village, phone, weeks_pregnant, gravida, parity, emergency_contact, medical_history, allergies, blood_group, expected_delivery_date, previous_complications, emergency_notes, assigned_vht_id) VALUES (@fullName, @age, @village, @phone, @weeksPregnant, @gravida, @parity, @emergencyContact, @medicalHistory, @allergies, @bloodGroup, @expectedDeliveryDate, @previousComplications, @emergencyNotes, @assignedVhtId)`).run({ ...body, assignedVhtId: req.user.id })
  res.status(201).json({ mother: db.prepare('SELECT * FROM mothers WHERE id = ?').get(result.lastInsertRowid) })
})

app.get('/api/visits', auth(), (req, res) => {
  const query = req.user.role === 'Supervisor' ? 'SELECT v.*, m.full_name AS mother_name FROM visits v JOIN mothers m ON m.id = v.mother_id ORDER BY v.visit_date DESC' : 'SELECT v.*, m.full_name AS mother_name FROM visits v JOIN mothers m ON m.id = v.mother_id WHERE m.assigned_vht_id = ? ORDER BY v.visit_date DESC'
  res.json({ visits: req.user.role === 'Supervisor' ? db.prepare(query).all() : db.prepare(query).all(req.user.id) })
})

app.post('/api/ai/assess', auth(), async (req, res) => {
  try { res.json({ assessment: await assessWithAI(req.body) }) } catch (error) { res.status(502).json({ error: 'The assessment service is temporarily unavailable.', detail: error.message }) }
})

app.post('/api/ai/transcribe', auth(), upload.single('audio'), async (req, res) => {
  if (!requireOpenAI(res)) return
  if (!req.file) return res.status(400).json({ error: 'An audio recording is required.' })
  try {
    const transcript = await transcribeAudio(req.file)
    res.json({ transcript, model: process.env.OPENAI_TRANSCRIBE_MODEL || 'gpt-4o-transcribe' })
  } catch (error) { res.status(error?.status === 429 ? 429 : 502).json({ error: aiFailureMessage(error, 'Audio transcription failed. Please record a shorter, clearer note and try again.') }) }
})

app.post('/api/ai/translate-catalog', auth(), async (req, res) => {
  if (!requireOpenAI(res)) return
  const { catalog, targetLanguage = 'Luganda' } = req.body || {}
  if (!catalog || typeof catalog !== 'object') return res.status(400).json({ error: 'A translation catalog is required.' })
  try { res.json({ translations: await translateCatalogWithAI(catalog, targetLanguage), targetLanguage }) } catch (error) { res.status(error?.status === 429 ? 429 : 502).json({ error: aiFailureMessage(error, 'Interface translation failed. Please try again.') }) }
})

app.post('/api/visits', auth(), async (req, res) => {
  const body = req.body
  const assessment = body.assessment || await assessWithAI(body)
  const insertVisit = db.prepare(`INSERT INTO visits (mother_id, recorded_by, blood_pressure, weight, temperature, pulse_rate, fetal_movement, gestational_age, symptoms, urine_protein, blood_sugar, notes, danger_signs, risk_level, referral_status) VALUES (@motherId, @recordedBy, @bloodPressure, @weight, @temperature, @pulseRate, @fetalMovement, @gestationalAge, @symptoms, @urineProtein, @bloodSugar, @notes, @dangerSigns, @riskLevel, @referralStatus)`)
  const insertAssessment = db.prepare(`INSERT INTO ai_assessments (risk_level, possible_conditions, danger_signs, immediate_actions, referral_recommendation, counseling_tips, follow_up_plan, visit_summary, confidence, raw_response) VALUES (@riskLevel, @possibleConditions, @dangerSigns, @immediateActions, @referralRecommendation, @counselingTips, @followUpPlan, @visitSummary, @confidence, @rawResponse)`)
  const transaction = db.transaction(() => {
    const visit = insertVisit.run({ ...body, recordedBy: req.user.id, dangerSigns: JSON.stringify(body.dangerSigns || []), riskLevel: assessment.riskLevel, referralStatus: assessment.referralRecommendation === 'Immediate' ? 'Referred' : 'Routine' })
    const ai = insertAssessment.run({ riskLevel: assessment.riskLevel, possibleConditions: JSON.stringify(assessment.possibleConditions), dangerSigns: JSON.stringify(assessment.dangerSignsIdentified), immediateActions: JSON.stringify(assessment.immediateActions), referralRecommendation: assessment.referralRecommendation, counselingTips: JSON.stringify(assessment.counselingTips), followUpPlan: assessment.followUpPlan, visitSummary: assessment.visitSummary, confidence: assessment.confidence, rawResponse: JSON.stringify(assessment) })
    db.prepare('UPDATE visits SET ai_assessment_id = ? WHERE id = ?').run(ai.lastInsertRowid, visit.lastInsertRowid)
    if (assessment.referralRecommendation === 'Immediate') db.prepare('INSERT INTO referral_history (mother_id, visit_id, facility, urgency) VALUES (?, ?, ?, ?)').run(body.motherId, visit.lastInsertRowid, 'Nearest Health Centre IV / hospital', assessment.followUpPlan)
    return db.prepare('SELECT * FROM visits WHERE id = ?').get(visit.lastInsertRowid)
  })()
  res.status(201).json({ visit: transaction, assessment })
})

app.get('/api/reports/summary', auth('Supervisor'), (_req, res) => {
  res.json({ totalMothers: db.prepare('SELECT COUNT(*) AS count FROM mothers').get().count, totalVisits: db.prepare('SELECT COUNT(*) AS count FROM visits').get().count, highRisk: db.prepare("SELECT COUNT(DISTINCT mother_id) AS count FROM visits WHERE risk_level = 'High'").get().count, referrals: db.prepare('SELECT COUNT(*) AS count FROM referral_history').get().count })
})

app.use(express.static(path.join(__dirname, '../dist')))
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) return next()
  res.sendFile(path.join(__dirname, '../dist/index.html'))
})

app.listen(port, () => console.log(`MamaCare API listening on http://localhost:${port}`))
