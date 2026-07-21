# MamaCare VHT Copilot

> Helping Uganda's Village Health Teams provide safer antenatal care with structured pregnancy monitoring, local risk rules, Luganda support, and timely referrals.

## Project overview

MamaCare VHT Copilot is a mobile-first maternal healthcare web application for Uganda's Village Health Teams (VHTs). It helps health workers register pregnant women, follow them throughout pregnancy, document antenatal visits, identify danger signs early, and connect high-risk women to professional care before complications become life-threatening.

The application turns pregnancy records, symptoms, vital signs, and danger signs into structured information that is easier for a VHT or supervising health worker to review and act on.

MamaCare is a clinical decision-support tool. It does not diagnose patients or replace a qualified healthcare professional.

## The problem

Many community health workers still depend on paper ANC cards, handwritten notes, and limited access to clinical support. Important information can be difficult to organize across visits, warning signs may be missed, and referrals may happen too late.

MamaCare provides one secure workspace where health workers can maintain pregnancy records, receive safety-first rule-based guidance, and track visits and referrals.

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
- Links directly to mother registration, visit recording, visit history, and the decision-support assistant.

### Mother registration and pregnancy records

- Records the mother's identity, age, phone number, village, and emergency contact.
- Stores gestational age, gravida, parity, blood group, and expected delivery date.
- Captures medical history, allergies, and previous pregnancy complications.
- Provides a profile and visit timeline for every registered mother.

### Antenatal visit workflow

- Records blood pressure, weight, temperature, pulse, fetal movement, gestational age, urine protein, blood sugar, symptoms, and additional notes.
- Lets the VHT select urgent danger signs such as severe headache, blurred vision, vaginal bleeding, convulsions, reduced fetal movement, severe abdominal pain, or loss of consciousness.
- Saves the visit, structured assessment, risk level, and referral status as linked database records.

### Local maternal-health decision support

- Combines the mother's record, current vital signs, symptoms, observations, and danger signs using deterministic rules in the Express backend.
- Returns a structured risk classification: Low, Moderate, or High.
- Identifies possible conditions and recorded danger signs.
- Provides immediate actions, referral guidance, counselling tips, a follow-up plan, a visit summary, and a confidence value.
- Automatically records an urgent referral when the structured recommendation is `Immediate`.
- Keeps the final decision with the VHT and supervising healthcare professional.

### English and Luganda support

- Switches interface content between the bundled English and Luganda catalogs.
- Works immediately without a network request, API key, model call, or translation credits.
- Falls back to English for any interface key that does not yet have a Luganda entry.

### Visit history and reports

- Provides searchable visit history with vital signs, risk levels, and referral status.
- Gives Supervisors a summary of registered mothers, visits, high-risk pregnancies, and referrals.
- Generates reports from real database records rather than seeded demonstration data.

## How Codex and GPT-5.6 were used

MamaCare was built with OpenAI Codex and GPT-5.6 as required by the hackathon. They were used during development to analyze the codebase, design the maternal-health workflow, implement features, debug failures, improve safety wording, and document the project.

The deployed application does **not** call the OpenAI API. It requires no OpenAI API key or credits. Runtime maternal-health assessment is handled by transparent local rules in `server/assessment.js`, and interface language switching uses catalogs bundled in `src/i18n.jsx`.

### Local assessment behavior

- Evaluates blood-pressure thresholds, temperature, pulse, fetal movement, urine protein, blood sugar, selected danger signs, and recognized danger-sign phrases.
- Returns the same predictable assessment structure used by visits and the decision-support assistant.
- Prioritizes same-day clinical review when urgent rules are triggered.
- Does not diagnose or replace a qualified health professional.

### Structured and reviewable output

Assessment results are deliberately structured instead of being displayed as unrestricted chat. This makes each result easier to validate, review, save, and use in referral workflows. All guidance is labelled as decision support and must be confirmed by a supervising health worker.

## How Codex was used

OpenAI Codex was used as the software-development collaborator for MamaCare. Codex helped:

- Analyze and understand the existing React and Express codebase.
- Build and refine the mobile-first user experience.
- Implement account creation, login, token validation, protected routes, and logout behavior.
- Remove prototype data and connect screens to authenticated API records.
- Connect mother registration, visits, profiles, reports, and the decision-support assistant to the Express and SQLite backend.
- Convert the assessment design into a transparent local rule engine and bundle the Luganda interface catalog for zero-credit runtime operation.
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
| Decision support | Local deterministic maternal-health rule engine |
| Development tools | OpenAI Codex and GPT-5.6 |

## Application architecture

```text
Browser (React/Vite)
        |
        | Authenticated REST requests
        v
Express API (Node.js)
   |-- local maternal-health rules
   v
SQLite database
   - users
   - mothers
   - visits
   - structured assessments
   - referral history
```

## Project structure

```text
MAMA CARE/
├── src/
│   ├── components/       Reusable UI and layout
│   ├── lib/api.js        Authenticated frontend API client
│   ├── pages/            Login, dashboard, mothers, visits, AI and reports
│   ├── App.jsx           Session validation and application routes
│   ├── i18n.jsx          English/Luganda interface translation
│   └── styles.css        Application styling
├── server/
│   ├── db.js             SQLite schema and database connection
│   ├── assessment.js     Local maternal-health decision rules
│   └── index.js          REST API and authentication
├── .env.example          Environment-variable template
├── package.json          Dependencies and scripts
└── vite.config.js        Vite configuration
```

## Local setup

### Requirements

- Node.js 18 or newer
- npm
- No OpenAI API key or API credits are required

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
| `POST` | `/api/visits` | Save a visit and structured assessment |
| `POST` | `/api/assess` | Evaluate the local maternal-health rules |
| `GET` | `/api/reports/summary` | Retrieve Supervisor reporting totals |

Except for the health check, application endpoints require a valid bearer token. The reports endpoint additionally requires the `Supervisor` role.

## Data and security notes

- No patient information is sent to OpenAI or another model provider at runtime.
- Passwords are stored as bcrypt hashes, not plain text.
- JWTs expire after eight hours.
- SQLite files and local environment files are excluded from Git.
- Production deployments must use a strong `JWT_SECRET`, HTTPS, appropriate database backups, access controls, and applicable health-data governance.

## Responsible decision support

MamaCare is designed around human review:

- The local rule engine does not diagnose conditions with certainty.
- Safety and urgent danger signs are prioritized.
- Clinical decisions and referrals remain the responsibility of trained health workers.

## Future roadmap

- Pilot the application with VHTs and maternal-health professionals in Uganda.
- Validate workflows against locally approved antenatal-care and referral protocols.
- Add offline-first data capture and later synchronization for low-connectivity areas.
- Expand support for additional Ugandan languages.
- Add appointment reminders and referral follow-up notifications.
- Integrate with health facilities and approved national health-information systems.
- Strengthen audit logging, consent workflows, and production-grade health-data protection.

## Development resources

- [OpenAI Codex documentation](https://developers.openai.com/codex/)
