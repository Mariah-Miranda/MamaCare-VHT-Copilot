import Database from 'better-sqlite3'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const db = new Database(path.join(__dirname, 'mamacare.sqlite'))
db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('VHT', 'Supervisor')),
    village TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS mothers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    full_name TEXT NOT NULL,
    age INTEGER NOT NULL,
    village TEXT NOT NULL,
    phone TEXT,
    weeks_pregnant INTEGER,
    gravida INTEGER,
    parity INTEGER,
    emergency_contact TEXT,
    medical_history TEXT,
    allergies TEXT,
    blood_group TEXT,
    expected_delivery_date TEXT,
    previous_complications TEXT,
    emergency_notes TEXT,
    assigned_vht_id INTEGER REFERENCES users(id),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS visits (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    mother_id INTEGER NOT NULL REFERENCES mothers(id),
    recorded_by INTEGER REFERENCES users(id),
    visit_date TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    blood_pressure TEXT,
    weight REAL,
    temperature REAL,
    pulse_rate INTEGER,
    fetal_movement TEXT,
    gestational_age INTEGER,
    symptoms TEXT,
    urine_protein TEXT,
    blood_sugar REAL,
    notes TEXT,
    danger_signs TEXT,
    ai_assessment_id INTEGER REFERENCES ai_assessments(id),
    risk_level TEXT,
    referral_status TEXT DEFAULT 'Routine',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS ai_assessments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    visit_id INTEGER,
    risk_level TEXT NOT NULL,
    possible_conditions TEXT,
    danger_signs TEXT,
    immediate_actions TEXT,
    referral_recommendation TEXT,
    counseling_tips TEXT,
    follow_up_plan TEXT,
    visit_summary TEXT,
    confidence REAL,
    raw_response TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS referral_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    mother_id INTEGER NOT NULL REFERENCES mothers(id),
    visit_id INTEGER REFERENCES visits(id),
    facility TEXT,
    urgency TEXT,
    notes TEXT,
    referred_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS translation_cache (
    cache_key TEXT PRIMARY KEY,
    translation_type TEXT NOT NULL,
    target_language TEXT NOT NULL,
    source_text TEXT NOT NULL,
    translated_text TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
`)

export default db
