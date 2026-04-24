# Next In Line

> Autonomous hiring pipeline for small teams — capacity-aware, traceable, and self-moving.

---

## Overview

Small teams often manage hiring through spreadsheets, emails, and manual follow-ups. Once active review capacity is full, new applicants get lost, delayed, or manually tracked.

**Next In Line** is a lightweight internal hiring pipeline that automatically manages applicant flow using explicit queue logic.

When active capacity is full:

* new applicants are **waitlisted**, not rejected
* when someone exits, the next candidate is **promoted automatically**
* inactivity during promotion triggers **decay + requeue**
* every state transition is **logged and reconstructable**

Built for real operational constraints, not demo-only CRUD flows.

---

## Core Problem Solved

Traditional lightweight hiring workflows fail because they lack:

* bounded reviewer capacity
* automatic queue movement
* inactivity handling
* auditability
* deterministic ordering under concurrency

This project solves all five.

---

## Key Features

### Capacity-Aware Admissions

Each job opening defines how many applicants can be actively reviewed at once.

Applications are assigned to:

* `ACTIVE`
* `WAITLIST`

based on available capacity.

---

### Automatic Promotion Engine

When an active applicant exits for any reason, the next waitlisted candidate is promoted automatically.

No spreadsheet edits. No manual chasing.

---

### Inactivity Decay Mechanism

When a promoted applicant enters `PENDING_ACK`, they must acknowledge within the defined window.

If they do not:

* they are not removed
* they decay back into the waitlist
* their priority worsens
* the next candidate promotes automatically

This creates a self-healing pipeline.

---

### Full Event Audit Trail

Every transition is stored in an append-only event log:

* applied
* promoted
* exited
* decayed

This enables full lifecycle reconstruction.

---

### Applicant Transparency

Applicants can check:

* current status
* queue position
* transition history

---

## Pipeline States

| State       | Meaning                           |
| ----------- | --------------------------------- |
| ACTIVE      | Under active review               |
| WAITLIST    | Waiting for capacity              |
| PENDING_ACK | Promoted, awaiting acknowledgment |
| EXITED      | Removed from active pipeline      |

---

## System Architecture

Frontend:

* React + Vite
* Tailwind CSS dashboard

Backend:

* Node.js
* Express

Database:

* PostgreSQL

Design Layers:

1. API Layer — request validation and transport
2. Service Layer — queue rules and transitions
3. Persistence Layer — transactional DB + event logs
4. UI Layer — pipeline visibility dashboard

---

## Queue Ordering Logic

Waitlist order is deterministic:

1. `priority_score` (lower is better)
2. `applied_at` timestamp (earlier first)

This ensures fairness and replayability.

---

## Concurrency Strategy

Critical operations use transactional locking:

`SELECT ... FOR UPDATE`

Used during:

* application submission
* promotions
* exits
* decay cascades

This prevents:

* double allocation of final slot
* race conditions
* inconsistent promotions

---

## API Endpoints

### Jobs

* `POST /jobs`

### Applications

* `POST /applications/apply`
* `POST /applications/exit`
* `POST /applications/decay`

### Read APIs

* `GET /applications/:id/status`
* `GET /applications/:id/history`

---

## Frontend Dashboard

The included dashboard visualizes:

* applicant pipeline by state
* event timeline
* applicant history
* live backend-connected data

---

## Local Setup

## Requirements

* Node.js
* npm
* PostgreSQL

---

## 1. Clone Repository

```bash
git clone <repo-url>
cd Next-in-Line
```

---

## 2. Backend Setup

```bash
cd backend
npm install
```

Create database:

```sql
CREATE DATABASE pipeline_db;
```

Apply schema:

```bash
psql -U <username> -d pipeline_db -f src/db/schema.sql
```

Start backend:

```bash
npm start
```

Expected:

* `http://localhost:5050/`
* `http://localhost:5050/test-db`

---

## 3. Frontend Setup

```bash
cd ../frontend
npm install
npm run dev
```

Open:

```text
http://localhost:5173
```

---

## Tests

Backend flow tests included:

```bash
cd backend
npm test
```

Covers:

* job creation
* capacity boundaries
* apply logic
* automatic promotion
* decay logic
* invalid inputs
* repeated exits
* history/status behavior

---

## Design Tradeoffs

* Single-node DB simplicity over distributed complexity
* Explicit rule engine over generic workflow abstraction
* Minimal UI with strong backend correctness focus

---

## Future Improvements

* automatic scheduled acknowledgment expiry
* email / SMS notifications
* authentication and recruiter accounts
* multi-job dashboards
* analytics for funnel conversion
* OpenAPI / Swagger docs
* containerized deployment

---

## Why This Submission Stands Out

This is not a CRUD applicant tracker.

It is a deterministic queue engine with:

* capacity-aware admissions
* automatic state transitions
* inactivity recovery logic
* audit-grade traceability
* real backend correctness tests

---

## Built For

Small teams who need ATS-like control without ATS-like cost.
