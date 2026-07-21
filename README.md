# MamaCare VHT Copilot

> Helping Uganda's Village Health Teams provide better and safer antenatal care with AI-assisted pregnancy monitoring, voice documentation, translation, ANC card scanning, and timely referrals.

## Project overview

MamaCare VHT Copilot is a mobile-first maternal healthcare web application for Uganda's Village Health Teams (VHTs). It helps health workers register pregnant women, follow them throughout pregnancy, document antenatal visits, identify danger signs early, and connect high-risk women to professional care before complications become life-threatening.

The application turns pregnancy records, symptoms, vital signs, danger signs, voice observations, and ANC card images into structured information that is easier for a VHT or supervising health worker to review and act on.

MamaCare is a clinical decision-support tool. It does not diagnose patients or replace a qualified healthcare professional.

## The problem

Many community health workers still depend on paper ANC cards, handwritten notes, and limited access to clinical support. Important information can be difficult to organize across visits, warning signs may be missed, and referrals may happen too late.

MamaCare provides one secure workspace where health workers can maintain pregnancy records, receive safety-first AI guidance, and track visits and referrals.

## Main features

### Secure accounts and workspaces

- New users create a VHT or Supervisor account before accessing the application.
- Passwords are hashed with bcrypt.
- Authentication uses JSON Web Tokens with an eight-hour lifetime.
- Saved sessions are checked against the backend when the application starts.
- VHTs only retrieve mothers assigned to their own account; Supervisors can access reporting across the workspace.

### Dashboard

- Displays the current care-list totals and high-risk counts.
- Provides empty-state guidance for a newly created workspace.
- Links directly to mother registration, visit recording, visit history, and the AI Assistant.

### Mother registration and pregnancy records

- Records the mother's identity, age, phone number, village, and emergency contact.
- Stores gestational age, gravida, parity, blood group, and expected delivery date.
- Captures medical history, allergies, and previous pregnancy complications.
- Provides a profile and visit timeline for every registered mother.

### Antenatal visit workflow

- Records blood pressure, weight, temperature, pulse, fetal movement, gestational age, urine protein, blood sugar, symptoms, and additional notes.
- Lets the VHT select urgent danger signs such as severe headache, blurred vision, vaginal bleeding, convulsions, reduced fetal movement, severe abdominal pain, or loss of consciousness.
- Saves the visit, AI assessment, risk level, and referral status as linked database records.

### AI decision support

- Combines the mother's record, current vital signs, symptoms, observations, and danger signs.
- Returns a structured risk classification: Low, Moderate, or High.
- Identifies possible conditions and recorded danger signs.
- Provides immediate actions, referral guidance, counselling tips, a follow-up plan, a visit summary, and a confidence value.
- Automatically records an urgent referral when the structured recommendation is `Immediate`.
- Keeps the final decision with the VHT and supervising healthcare professional.

### Voice observations

- Records natural spoken observations in the browser.
- Uses `gpt-4o-transcribe` to convert audio into reviewable text.
- Preserves important maternal-health terms, names, numbers, blood-pressure readings, and gestational age where possible.
- Can translate the transcript into English or Luganda before it is added to the visit.

### ANC card image scanning

- Accepts a photo uploaded from the device or captured with its camera.
- Uses GPT-5.6 vision capabilities to extract visible ANC card information.
- Extracts fields such as the mother's name, age, gestational age, expected delivery date, ANC number, facility, and blood group.
- Returns field-level and overall confidence values.
- Uses `null` for missing or unreadable information instead of inventing data.
- Requires the health worker to review extracted details before using them.

### English and Luganda support

- Translates interface content between English and Luganda.
- Translates voice transcripts into the selected output language.
- Preserves names, numbers, placeholders, acronyms, and medical units.
- Caches the translated interface catalog in the browser for the current user experience.

### Visit history and reports

- Provides searchable visit history with vital signs, risk levels, and referral status.
- Gives Supervisors a summary of registered mothers, visits, high-risk pregnancies, and referrals.
- Generates reports from real database records rather than seeded demonstration data.

## How OpenAI powers MamaCare

MamaCare uses the official OpenAI Node.js SDK from the Express backend. The API key remains on the server and is never exposed to the browser.

### GPT-5.6

The project configures `gpt-5.6-terra` as its default GPT-5.6 model through `OPENAI_MODEL` and `OPENAI_VISION_MODEL`. It is used for:

1. **Pregnancy risk assessment:** Converts symptoms, vital signs, pregnancy context, notes, and danger signs into a structured JSON assessment.
2. **ANC card understanding:** Uses image input to read visible information from photographed antenatal cards and return structured fields with confidence scores.
3. **English/Luganda translation:** Translates interface content and clinical notes while preserving medical measurements and formatting.
4. **AI Assistant:** Answers contextual questions about a registered mother's pregnancy record and presents safety-first next steps.

The maternal-health system instruction is defined in `server/index.js`. It instructs the model to prioritize safety, avoid diagnosing with certainty, identify urgent danger signs, and return a predictable JSON structure for the application.

### GPT-4o Transcribe

`gpt-4o-transcribe` converts field voice recordings into text. The transcription prompt provides maternal-health context and asks the model to preserve names, numbers, blood pressure, gestational age, symptoms, and English or Luganda words where possible.

### Structured and reviewable AI output

AI results are deliberately structured instead of being displayed as unrestricted chat. This makes each assessment easier to review, save, and use in referral workflows. All AI guidance is labelled as decision support and must be confirmed by a supervising health worker.

## How Codex was used

OpenAI Codex was used as the software-development collaborator for MamaCare. Codex helped:

- Analyze and understand the existing React and Express codebase.
- Build and refine the mobile-first user experience.
- Implement account creation, login, token validation, protected routes, and logout behavior.
- Remove prototype data and connect screens to authenticated API records.
- Connect mother registration, visits, profiles, reports, and the AI Assistant to the Express and SQLite backend.
- Implement and refine the OpenAI model calls, system instructions, structured responses, voice uploads, image uploads, and translation workflows.
- Diagnose bugs, update project documentation, and run production builds to verify changes.

Codex accelerated implementation and debugging, while product decisions, maternal-health goals, and final review remained human-led. Learn more from the [official Codex documentation](https://developers.openai.com/codex/).

## Technology stack

| Layer | Technology |
| --- | --- |
| Frontend | React 18, Vite 6, React Router, Axios |
| Styling and UI | Tailwind CSS, custom CSS, Lucide React, Framer Motion |
| Backend | Node.js, Express |
| Database | SQLite with `better-sqlite3` |
| Authentication | JWT and bcrypt |
| File uploads | Multer with in-memory upload handling |
| AI | OpenAI Node.js SDK, GPT-5.6, GPT-4o Transcribe |

## Application architecture

```text
Browser (React/Vite)
        |
        | Authenticated REST requests
        v
Express API (Node.js)
   |                |
   |                +--> OpenAI API
   |                     - assessments
   |                     - translation
   |                     - transcription
   |                     - ANC card vision
   v
SQLite database
   - users
   - mothers
   - visits
   - AI assessments
   - referral history
```

## Project structure

```text
MAMA CARE/
├── src/
│   ├── components/       Reusable UI, layout, voice and scanner tools
│   ├── lib/api.js        Authenticated frontend API client
│   ├── pages/            Login, dashboard, mothers, visits, AI and reports
│   ├── App.jsx           Session validation and application routes
│   ├── i18n.jsx          English/Luganda interface translation
│   └── styles.css        Application styling
├── server/
│   ├── db.js             SQLite schema and database connection
│   └── index.js          REST API, authentication and OpenAI integration
├── .env.example          Environment-variable template
├── package.json          Dependencies and scripts
└── vite.config.js        Vite configuration
```

## Local setup

### Requirements

- Node.js 18 or newer
- npm
- An OpenAI API key for live AI assessment, transcription, translation, and image scanning

### 1. Install dependencies

```bash
npm install
```

### 2. Create the environment file

On Windows Command Prompt:

```bat
copy .env.example .env
```

On PowerShell, macOS, or Linux:

```bash
cp .env.example .env
```

### 3. Configure `.env`

```env
PORT=8787
JWT_SECRET=replace-with-a-long-random-secret
OPENAI_API_KEY=your-openai-api-key
OPENAI_MODEL=gpt-5.6-terra
OPENAI_TRANSCRIBE_MODEL=gpt-4o-transcribe
OPENAI_VISION_MODEL=gpt-5.6-terra
VITE_API_URL=http://localhost:8787/api
```

Do not commit `.env`. It is already excluded by `.gitignore`.

### 4. Start the development application

```bash
npm run dev
```

This starts both services:

- Web application: `http://localhost:5173`
- Express API: `http://localhost:8787`
- API health check: `http://localhost:8787/api/health`

Open the web application URL, create an account, and then register the first mother in the workspace.

### Port conflicts

If port `5173` is already being used, Vite normally prints the next available URL in the terminal. To choose a client port explicitly, run the frontend and backend separately:

```bash
npm run dev:server
npm run dev:client -- --port 5174
```

Then open `http://localhost:5174`.

If port `8787` is occupied, change `PORT` and `VITE_API_URL` together in `.env`, for example:

```env
PORT=8788
VITE_API_URL=http://localhost:8788/api
```

Restart both services after changing environment variables.

## Production-style local run

Build the React application:

```bash
npm run build
```

Start the Express server:

```bash
npm start
```

The Express server serves both the built application and API from `http://localhost:8787` unless `PORT` is changed.

## Available scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Run the Vite client and Express API together |
| `npm run dev:client` | Run only the Vite development client |
| `npm run dev:server` | Run only the Express API with file watching |
| `npm run build` | Create the production frontend build |
| `npm run preview` | Preview the Vite production build |
| `npm start` | Run Express and serve the built frontend |

## API overview

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `POST` | `/api/auth/register` | Create an account |
| `POST` | `/api/auth/login` | Sign in and receive a JWT |
| `GET` | `/api/auth/me` | Validate the current session |
| `GET` | `/api/mothers` | Retrieve authorized mother records |
| `POST` | `/api/mothers` | Register a mother |
| `GET` | `/api/visits` | Retrieve authorized visit records |
| `POST` | `/api/visits` | Save a visit and AI assessment |
| `POST` | `/api/ai/assess` | Generate structured decision support |
| `POST` | `/api/ai/transcribe` | Transcribe and optionally translate audio |
| `POST` | `/api/ai/anc-scan` | Extract structured data from an ANC card image |
| `POST` | `/api/ai/translate` | Translate a text value |
| `POST` | `/api/ai/translate-catalog` | Translate the interface catalog |
| `GET` | `/api/reports/summary` | Retrieve Supervisor reporting totals |

Except for the health check, application endpoints require a valid bearer token. The reports endpoint additionally requires the `Supervisor` role.

## Data and security notes

- The OpenAI API key is only initialized on the backend.
- Passwords are stored as bcrypt hashes, not plain text.
- JWTs expire after eight hours.
- Uploaded audio and images are held in memory for request processing and are not written to an upload directory.
- Upload size is limited to 12 MB.
- SQLite files and local environment files are excluded from Git.
- Production deployments must use a strong `JWT_SECRET`, HTTPS, appropriate database backups, access controls, and applicable health-data governance.

## Responsible AI

MamaCare is designed around human review:

- The AI is instructed not to diagnose with certainty.
- Safety and urgent danger signs are prioritized.
- Missing ANC card values remain empty rather than being guessed.
- Voice transcripts and image extractions must be reviewed before use.
- Clinical decisions and referrals remain the responsibility of trained health workers.

## Future roadmap

- Pilot the application with VHTs and maternal-health professionals in Uganda.
- Validate workflows against locally approved antenatal-care and referral protocols.
- Add offline-first data capture and later synchronization for low-connectivity areas.
- Expand support for additional Ugandan languages.
- Add appointment reminders and referral follow-up notifications.
- Integrate with health facilities and approved national health-information systems.
- Strengthen audit logging, consent workflows, and production-grade health-data protection.

## OpenAI resources

- [OpenAI API documentation](https://developers.openai.com/api/)
- [OpenAI Codex documentation](https://developers.openai.com/codex/)
