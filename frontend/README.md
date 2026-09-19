# NepNLP: frontend (React + Vite)

The UI. One tab per tool (news, sentiment, spell-check, translation), each with example
Nepali text so anyone can try it without a Nepali keyboard.

## Run (dev)

```bash
cd frontend
npm install
npm run dev        # http://localhost:5173
```

Vite proxies `/api` to the Java backend (default `http://localhost:8080`). Point it elsewhere
with `VITE_API_URL`:

```bash
VITE_API_URL=http://localhost:8080 npm run dev
```

## Build (production)

```bash
npm run build      # outputs static files to dist/
npm run preview    # serve the build locally on :4173
```

In Docker, nginx serves `dist/` and proxies `/api` to the `backend` container (see
`nginx.conf`), so the browser talks to a single origin — no CORS.

## Structure

```
src/
  App.jsx            tab shell + ML status footer
  api.js             fetch helpers (relative /api)
  data/examples.js   one-click Nepali sample texts
  components/
    InputPanel.jsx   shared textarea + examples + run button
    ScoreBars.jsx    probability bars
    NewsTool.jsx  SentimentTool.jsx  SpellTool.jsx  TranslateTool.jsx
  styles.css
```
