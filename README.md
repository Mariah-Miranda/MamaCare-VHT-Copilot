# MamaCare VHT Copilot

MamaCare is a mobile-first maternal healthcare workspace for Uganda’s Village Health Teams. It combines a calm field workflow with structured AI decision support, referral prioritisation, voice notes and ANC card scanning review.

## Run locally

```bash
npm install
copy .env.example .env
npm run dev
```

The Vite client runs at `http://localhost:5173` and the Express API runs at `http://localhost:8787`.

For a production-style local run:

```bash
npm run build
npm start
```

The Express server will serve the built client and API from `http://localhost:8787`.

Demo sign-in: `sarah.namusoke@mamacare.org` / `mamacare-demo`.

## Environment

Copy `.env.example` to `.env`. `OPENAI_API_KEY` is required for live AI assessment, voice transcription and ANC-card extraction. Add a strong `JWT_SECRET` before deployment. The app uses `gpt-5.6-terra` for assessment, translation and ANC-card vision. Audio uses the specialized `gpt-4o-transcribe` model; these can be changed with `OPENAI_MODEL`, `OPENAI_TRANSCRIBE_MODEL` and `OPENAI_VISION_MODEL`.

## Project structure

- `src/` — React/Vite client, routes, reusable UI, seeded prototype data and Axios service layer.
- `server/` — Express REST API, JWT authentication, bcrypt password hashing, SQLite schema and OpenAI assessment service.
- `server/db.js` — relational tables for users, mothers, visits, AI assessments and referral history.

The AI response is deliberately structured rather than a generic chat response. It returns risk classification, possible conditions, danger signs, immediate actions, referral guidance, counseling, follow-up and confidence, while keeping clinical judgment with the supervising health worker. Voice recordings are captured in the browser and sent to the authenticated `/api/ai/transcribe` endpoint. ANC card photos are sent to `/api/ai/anc-scan` for structured vision extraction and confidence review. The OpenAI key is never sent to the browser.

## English / Luganda mode

Use the `EN / LG` switch in the top navigation. Choosing Luganda sends the interface catalog to `/api/ai/translate-catalog`, caches the translated labels for the session, and applies them across the workspace. The voice modal has its own output-language selector; audio is transcribed by OpenAI and translated into the selected English or Luganda output before the nurse reviews it.
