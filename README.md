# Next In Line

## 1. Problem Overview
Small teams need a lightweight hiring pipeline that enforces active review limits without manual spreadsheet operations. This project manages applications with a bounded active set and an automatically managed waitlist.

## 2. System Design Approach
The system is designed as a backend-first pipeline engine with explicit transition rules:
- Express API layer for request handling
- Service layer for transition logic and invariants
- PostgreSQL for transactional consistency and reconstruction-ready persistence

## Design Philosophy
This system is built as a deterministic pipeline engine rather than a traditional queue-based CRUD system.

All transitions are explicit, reproducible, and traceable, ensuring consistent behavior under concurrent conditions.

## 3. Core Concepts
### State Transitions
Applications move through explicit states (`ACTIVE`, `WAITLIST`, `PENDING_ACK`, `EXITED`) via controlled transition handlers.

### Queue System
Admission is capacity-aware. Overflow is queued as `WAITLIST` rather than rejected.

### Concurrency Handling
Critical transitions execute in database transactions with row-level locks to avoid race conditions.

### Event Logging
Every transition emits an event record, enabling state audit and replay-style reconstruction.

## 4. Key Features
- Capacity-based admission into `ACTIVE` or `WAITLIST`
- Automatic promotion when an active applicant exits
- Inactivity decay with penalized requeue and cascade promotion
- Dynamic queue position derived from ordering rules instead of static stored position

## 5. Concurrency Strategy
`SELECT ... FOR UPDATE` is used to lock critical rows during admission and transition workflows.

This guarantees atomicity for read-modify-write steps:
- lock capacity source (`jobs` row)
- compute active count / next candidate
- apply transition
- log event
- commit as one unit

Result: simultaneous requests cannot over-allocate active capacity or produce inconsistent promotion order.

## 6. Fairness & Determinism
Waitlist ordering is deterministic:
- Primary key: `priority_score` (lower is better)
- Secondary key: `applied_at` (earlier is better)

Decay increases `priority_score`, preventing inactive applicants from retaining unfair priority while preserving deterministic replay behavior.

## 7. Event Logging & Traceability
Transitions are persisted in an `events` stream with event type, metadata, and timestamp.

Operationally, this supports:
- full lifecycle visibility per application
- auditability of promotion and decay decisions
- history endpoints for explainability

## 8. API Endpoints
### API Endpoints
- `POST /jobs`
- `POST /applications/apply`
- `POST /applications/exit`
- `POST /applications/decay`
- `GET /applications/:id/status`
- `GET /applications/:id/history`

`GET /applications/:id/history` returns all events for the application, exposing the full transition chain in an event-driven model.

## 9. Setup Instructions
1. Clone the repository.
2. Install backend dependencies:
   - `cd backend`
   - `npm install`
3. Create PostgreSQL database (example: `pipeline_db`).
4. Configure DB credentials in `backend/src/db/index.js` (or migrate to env-based config).
5. Apply schema in `backend/src/db/schema.sql`.
6. Start server:
   - `npm start`
7. Verify:
   - `GET /` returns `API running`
   - `GET /test-db` validates DB connectivity

## 10. Tradeoffs & Future Improvements
Tradeoffs:
- Simplicity over distributed scalability (single DB-backed service)
- Explicit service logic over generic workflow abstraction
- Minimal frontend; backend is source of truth

Future improvements:
- Add acknowledgment timeout scheduler for automatic decay triggering
- Add OpenAPI/Swagger contract and request/response schemas
- Add idempotency keys for submission endpoints
- Add pagination/filtering for event history
- Add integration and concurrency stress tests
- Move DB credentials to environment-only configuration
