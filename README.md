# Next In Line

> Autonomous hiring pipeline for small teams — capacity-aware, traceable, and self-moving.

---

## Overview

Small engineering teams often manage hiring pipelines manually using spreadsheets, emails, and follow-ups. Once reviewer capacity is full, applicants get delayed or lost.

**Next In Line** is a lightweight hiring pipeline system that automatically manages applicant movement through a bounded queue.

When capacity is full:

* new applicants are waitlisted instead of rejected
* exiting applicants free slots automatically
* next candidates promote automatically
* inactivity triggers decay + requeue
* every transition is fully logged

---

## Problem Solved

This system replaces spreadsheet-based hiring workflows with:

* active review capacity control
* automatic waitlist movement
* inactivity handling
* audit logs
* deterministic queue ordering

---

## Core Features

### Capacity-Aware Admissions

Each job opening defines an active capacity.

Applicants are automatically assigned to:

* `ACTIVE`
* `WAITLIST`

depending on slot availability.

---

### Automatic Promotion

When an active applicant exits:

* the next waitlisted applicant is promoted automatically

No manual intervention required.

---

### Inactivity Decay

Promoted applicants enter `PENDING_ACK`.

If they do not acknowledge:

* they decay back into waitlist
* receive queue penalty
* next candidate promotes automatically

---

### Full Event Traceability

Every transition is logged in the `events` table:

* APPLIED
* PROMOTED
* EXITED
* DECAYED

This enables complete pipeline reconstruction.

---

### Applicant Transparency

Applicants can query:

* current status
* queue position
* lifecycle history

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

## Architecture

Frontend Dashboard → REST API → Queue Logic Engine → PostgreSQL

Layers:

1. API Layer
2. Service Logic Layer
3. Transactional Persistence Layer
4. Visual Dashboard Layer

---

## Queue Ordering Logic

Waitlist order uses:

1. `priority_score` (lower is better)
2. `applied_at` timestamp (earlier first)

This ensures fairness and deterministic replay behavior.

---

## Concurrency Strategy

Critical operations use transactional locking:

`SELECT ... FOR UPDATE`

Used during:

* applications
* exits
* promotions
* decay cascades

This prevents:

* double allocation
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

* `GET /applications`
* `GET /applications/events`
* `GET /applications/:id/status`
* `GET /applications/:id/history`

---

## Frontend Dashboard

Live dashboard visualizes:

* pipeline by state
* applicants list
* recent event timeline
* applicant history

Connected to real backend APIs.

---

## Local Setup

## Requirements

* Node.js
* npm
* PostgreSQL

---

## 1. Clone Repository

```bash id="r100"
git clone <repo-url>
cd Next-in-Line
```

---

## 2. Backend Setup

```bash id="r101"
cd backend
npm install
```

Create DB:

```sql id="r102"
CREATE DATABASE pipeline_db;
```

Apply schema:

```bash id="r103"
psql -U <username> -d pipeline_db -f src/db/schema.sql
```

Start backend:

```bash id="r104"
npm start
```

Runs on:

```text id="r105"
http://localhost:5050
```

---

## 3. Frontend Setup

```bash id="r106"
cd ../frontend
npm install
npm run dev
```

Open:

```text id="r107"
http://localhost:5173
```

---

## Tests

Run backend test suite:

```bash id="r108"
cd backend
npm test
```

Covers:

* job creation
* capacity limits
* apply logic
* promotion logic
* decay handling
* invalid requests
* repeated exits
* history/status correctness

---

## Design Tradeoffs

* Single-node simplicity over distributed complexity
* Explicit rule engine over generic workflow abstraction
* Minimal UI with strong backend correctness focus

---

## Future Improvements

* automatic scheduled acknowledgment expiry
* recruiter authentication
* email / SMS notifications
* multi-job support
* analytics dashboard
* OpenAPI docs
* Docker deployment

---

## Why This Submission Stands Out

This is not a CRUD tracker.

It is a deterministic hiring queue engine with:

* bounded capacity control
* self-moving pipeline transitions
* inactivity recovery logic
* audit-grade event history
* tested backend flows

---

## Built For

Small teams needing ATS-like control without ATS-like cost.
