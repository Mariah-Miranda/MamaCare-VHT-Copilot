import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import db from './db.js'
import { assessMaternalHealth } from './assessment.js'

const app = express()
const port = process.env.PORT || 8787
const jwtSecret = process.env.JWT_SECRET || 'development-only-change-me'
const __dirname = path.dirname(fileURLToPath(import.meta.url))

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

app.post('/api/assess', auth(), async (req, res) => {
  res.json({ assessment: assessMaternalHealth(req.body), engine: 'local-rules-v1' })
})

app.post('/api/visits', auth(), async (req, res) => {
  const body = req.body
  const assessment = body.assessment || assessMaternalHealth(body)
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
