# NepNLP — backend (Java / Spring Boot)

The API tier. Validates input, calls the Python ML service, stores every request/result in
MongoDB, and serves the React frontend.

## API

Base path `/api` (Swagger UI at <http://localhost:8080/swagger-ui.html>):

| Method | Path | Body | Returns |
|--------|------|------|---------|
| POST | `/api/news` | `{text}` | topic label + scores |
| POST | `/api/sentiment` | `{text}` | polarity label + scores |
| POST | `/api/spellcheck` | `{text}` | per-token suggestions |
| POST | `/api/translate` | `{text,source,target}` | translation |
| GET | `/api/ml-info` | – | tool tiers / readiness |
| GET | `/api/history?tool=&limit=` | – | recent analyses from MongoDB |
| POST | `/api/feedback` | `{recordId,correctLabel,modelWasCorrect}` | updated record |

## Run

### With Docker (recommended — no local Maven needed)

From the repo root: `docker compose up --build` (starts Mongo + ML service + this API).

### Locally with Maven

Requires a running MongoDB and the ML service (or point the env vars elsewhere):

```bash
cd backend
mvn spring-boot:run
# configure if needed:
#   SPRING_DATA_MONGODB_URI=mongodb://localhost:27017/nepnlp
#   NEPNLP_ML_BASE_URL=http://localhost:8000
```

> No Maven installed? Either use the Docker path above, or install it
> (`winget install Apache.Maven` / `choco install maven` / `scoop install maven`).

The API is resilient: if MongoDB is down it still returns NLP results (it just skips the
history write and logs a warning), so you can develop the API + ML service without Mongo.

## Test

```bash
mvn test
```

Integration tests use **embedded MongoDB** (Flapdoodle), so they need no running database.

## Structure

```
com.nepnlp
├── NepnlpApplication         entrypoint
├── config/                   RestClient (ML) + CORS
├── client/MlServiceClient    typed calls to the Python ML service
├── dto/                      request/response records (JSON contract)
├── model/AnalysisRecord      MongoDB document
├── repository/               Spring Data Mongo repository
├── service/NlpService        orchestration + best-effort persistence
└── controller/               REST endpoints + error handling
```
