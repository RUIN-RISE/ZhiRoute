# 职通车 Threat Model

## Scope

- In scope:
  - FastAPI backend in `main.py`
  - Resume ingestion and parsing flow
  - AI Talent Radar external-data pipeline
  - React frontend in `temp_frontend/src`
  - Cloud sync and private resume flows
- Out of scope:
  - Third-party cloud server internals at `CLOUD_STORAGE_API`
  - External model providers and external public APIs
  - Local dev/test helper scripts not used in runtime

## Assumptions

- The product is internet-facing.
- Guest users can access a subset of functionality.
- The cloud storage/auth service is operated separately from this repo.
- Resume files and JD text can contain sensitive hiring data.
- Multi-tenant isolation matters because account-scoped history and private resumes exist.

## Components

- **Frontend**: React SPA served from `temp_frontend/dist`
- **Backend API**: FastAPI app in `main.py`
- **LLM Layer**: provider routing in `services/llm.py`
- **Radar Services**: GitHub / Hugging Face / arXiv analyzers in `services/`
- **Local Cache**: SQLite in `jobos.db`
- **Cloud Sync**: remote auth/storage API

## Trust Boundaries

- Browser ↔ FastAPI
- FastAPI ↔ cloud auth/storage service
- FastAPI ↔ external public APIs
- FastAPI ↔ external LLM providers
- FastAPI ↔ local SQLite / local filesystem

## Assets

- Private resumes and uploaded files
- Account-scoped history and workspace snapshots
- Session identifiers and account bindings
- API keys for LLM and GitHub integrations
- JD content and interview outputs
- Availability of parsing / ranking / radar analysis

## Entry Points

- `POST /api/login`
- `POST /api/upload_resumes`
- `POST /api/upload_private_resume`
- `POST /api/fetch_private_resumes`
- `POST /api/analyze/ai-radar`
- `POST /api/analyze/ai-radar-questions`
- `POST /api/chat`
- `POST /api/parse_jd`

## Threats

### 1. Session spoofing / state pollution

- **Asset**: account-scoped state, history, private file access
- **Path**: attacker supplies forged or colliding `X-Session-ID`
- **Likelihood**: Medium
- **Impact**: High
- **Priority**: High
- **Notes**: This repo now validates session-id shape, but still relies on client-supplied session identifiers without signed server-issued tokens.

### 2. Malicious file upload / archive abuse

- **Asset**: backend availability, parser stability, local filesystem resources
- **Path**: oversized PDFs, ZIP bombs, too many archive members
- **Likelihood**: Medium
- **Impact**: High
- **Priority**: High
- **Notes**: This repo now enforces file extension, upload size, ZIP entry count, and total extracted-size limits, reducing but not eliminating parser risk.

### 3. Sensitive data leakage over misconfigured cloud endpoint

- **Asset**: resumes, history, workspace snapshots
- **Path**: environment missing, app falls back to hardcoded cloud endpoint
- **Likelihood**: Medium
- **Impact**: High
- **Priority**: High
- **Notes**: Production should require explicit HTTPS configuration and fail closed.

### 4. External dependency abuse / cost amplification

- **Asset**: service availability, API quotas, model spend
- **Path**: repeated radar analysis, repeated LLM generation, repeated upload processing
- **Likelihood**: High
- **Impact**: Medium
- **Priority**: High
- **Notes**: This repo still needs rate limiting and quota controls.

### 5. Cross-tenant data exposure via cloud service coupling

- **Asset**: private resumes and history records
- **Path**: weak binding between local session/account state and remote cloud checks
- **Likelihood**: Medium
- **Impact**: High
- **Priority**: High
- **Notes**: Must be verified end-to-end with the remote service implementation.

## Existing Mitigations

- Restricted CORS allowlist in `main.py`
- Session-id format validation in `main.py`
- File-type and size validation in `main.py`
- ZIP member-count and extracted-size validation in `main.py`
- Radar degraded results no longer cached in `services/radar_service.py`
- Frontend no longer auto-guesses public identities for AI Radar

## Recommended Next Moves

1. Replace client-chosen session identifiers with server-issued signed session tokens.
2. Require explicit production cloud endpoint configuration and reject insecure defaults.
3. Add per-session / per-account rate limiting for upload, chat, radar, and question-generation endpoints.
4. Add structured audit logs for private resume operations and cloud sync writes.
5. Add parser timeouts / sandboxing strategy for hostile document inputs.
