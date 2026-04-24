# Next In Line

> A lightweight autonomous hiring pipeline for small teams. Capacity-aware, traceable, and self-moving.

---

## Overview

Small engineering teams often manage hiring through spreadsheets, emails, and manual follow-ups. Once reviewer capacity is full, applicants are delayed, lost, or manually tracked.

**Next In Line** is a lightweight internal hiring pipeline that automatically manages applicant movement through a bounded queue.

When capacity is full:

* new applicants are waitlisted instead of rejected
* exiting applicants free slots automatically
* next candidates promote automatically
* inactivity triggers decay and requeue
* every transition is logged and reconstructable

Built for real operational constraints, not demo-only CRUD flows.

---

## Problem Solved

This system replaces spreadsheet-based hiring workflows with:

* active review capacity control
* automatic waitlist movement
* inactivity handling
* applicant transparency
* deterministic ordering under concurrency
* full audit history

---

## Core Features

### Capacity-Aware Admissions

Each job opening defines active review capacity.

Applicants are automatically assigned to:

* `ACTIVE`
* `WAITLIST`

based on slot availability.

---

### Automatic Promotion Engine

When an active applicant exits for any reason:

* the next waitlisted applicant is promoted automatically

No manual intervention required.

---

### Inactivity Decay Mechanism

Promoted applicants enter `PENDING_ACK`.

If they do not acknowledge within the defined window:

* they decay back into the waitlist
* receive a queue penalty (`priority_score`)
* next candidate is promoted automatically

This creates a self-healing pipeline.

---

### Full Event Traceability

Every transition is stored in the `events` table:

* APPLIED
* PROMOTED
* EXITED
* DECAYED

This enables complete lifecycle reconstruction.

---

### Applicant Transparency

Applicants can check:

* current status
* queue position
* transition history

---

## Pipeline States

| State       | Meaning                     |
| ----------- | --------------------------- |
| ACTIVE      | Under active review         |
| WAITLIST    | Waiting for slot            |
| PENDING_ACK | Promoted, awaiting response |
| EXITED      | Removed from pipeline       |

---

## Tech Stack

### Frontend

* React
* Vite
* Tailwind CSS
* Axios
* Framer Motion

### Backend

* Node.js
* Express.js

### Database

* PostgreSQL

---

## System Architecture

Frontend Dashboard → REST API → Queue Engine → PostgreSQL

Layers:

1. API Layer
2. Service Logic Layer
3. Transaction Layer
4. Dashboard Layer

---

## Queue Ordering Logic

Waitlist ordering uses:

1. `priority_score` (lower is better)
2. `applied_at` (earlier first)

This ensures fairness and deterministic behavior.

---

## Concurrency Handling

Critical transitions use database row locking:

`SELECT ... FOR UPDATE`

Used during:

* applications
* promotions
* exits
* decay cascades

This prevents:

* double allocation of final slot
* race conditions
* inconsistent promotions

### Simultaneous Last Slot Scenario

If two applications arrive at the same time for the final available slot:

* one transaction acquires the lock first
* that applicant receives the final `ACTIVE` slot
* the second request waits briefly, rechecks state, and is placed into `WAITLIST`

This guarantees correctness under concurrent submissions.

---

## API Endpoints

### Jobs

* `POST /jobs`

### Applications

* `POST /applications/apply`
* `POST /applications/exit`
* `POST /applications/decay`

### Read APIs

* `GET /applications`
* `GET /applications/events`
* `GET /applications/:id/status`
* `GET /applications/:id/history`

---

## Frontend Dashboard

Included dashboard visualizes:

* applicants grouped by state
* event timeline
* applicant history
* live backend-connected data

The frontend is intentionally lightweight because the challenge is backend-heavy by design.

---

## Local Setup

## Requirements

* Node.js
* npm
* PostgreSQL

---

## 1. Clone Repository

```bash id="f1"
git clone <repo-url>
cd Next-in-Line
```

---

## 2. Backend Setup

```bash id="f2"
cd backend
npm install
```

Create database:

```sql id="f3"
CREATE DATABASE pipeline_db;
```

Apply schema:

```bash id="f4"
psql -U <username> -d pipeline_db -f src/db/schema.sql
```

Start backend:

```bash id="f5"
npm start
```

Runs on:

```text id="f6"
http://localhost:5050
```

---

## 3. Frontend Setup

```bash id="f7"
cd ../frontend
npm install
npm run dev
```

Open:

```text id="f8"
http://localhost:5173
```

---

## Tests

Run backend test suite:

```bash id="f9"
cd backend
npm test
```

Current test coverage includes:

* job creation
* capacity boundaries
* apply logic
* promotion logic
* decay handling
* invalid requests
* repeated exits
* history/status behavior

---

## Quick Demo Actions (Optional)

With backend running on `http://localhost:5050`, these commands let you simulate queue movement and watch the dashboard update.

### Add Applicant

```bash
curl -X POST http://localhost:5050/applications/apply \
-H "Content-Type: application/json" \
-d '{"job_id":1,"applicant_name":"DemoUser"}'
```

### Exit Applicant

```bash
curl -X POST http://localhost:5050/applications/exit \
-H "Content-Type: application/json" \
-d '{"application_id":1}'
```

### Trigger Decay

```bash
curl -X POST http://localhost:5050/applications/decay \
-H "Content-Type: application/json" \
-d '{"application_id":2}'
```

After running any command, refresh the frontend dashboard to view updated pipeline state.
---

## Engineering Highlights

* Deterministic queue behavior
* Capacity-aware applicant flow
* Automatic promotion logic
* Inactivity recovery mechanism
* Full audit trail of transitions
* Explicit concurrency control
* Clean REST API design
* Functional local frontend + backend stack

---

## Design Tradeoffs

* Single-node PostgreSQL simplicity over distributed complexity
* Explicit rule engine over generic workflow abstractions
* Minimal frontend with backend correctness prioritized

---

## Future Improvements

* automatic scheduled acknowledgment expiry
* recruiter authentication
* email / SMS notifications
* multi-job support
* analytics dashboard
* OpenAPI / Swagger docs
* Docker deployment

---

## Built For

Small teams needing ATS-like control without ATS-like cost.

