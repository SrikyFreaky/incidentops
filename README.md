# IncidentOps

A small incident management tool for teams to track outages in real time.

## What it does

- Teams create incidents when something breaks
- Responders claim roles and post updates to a timeline as things happen
- Everyone watching sees updates live, no refreshing
- Incidents get resolved and follow-up actions get tracked

## Why

Most incident tools are either too heavy (PagerDuty, big Slack integrations) or
just a spreadsheet. This is a smaller, focused version that only does the
timeline + roles + live updates part.

## Stack

- React + Vite + TypeScript (frontend)
- Node.js + Express + Prisma (backend API)
- PostgreSQL (database)

## Status

Core workflow is working end to end locally: sign up, create a team, report
an incident, change its status, see it persist across a refresh. Not
deployed yet.

## Running locally

Requires a local PostgreSQL instance.

### 1. Database

Create a database and a role for the app to use, then create a second
database for Prisma's shadow database (used only for generating migrations):

```sql
CREATE ROLE incidentops_app WITH LOGIN PASSWORD 'choose-a-password';
CREATE DATABASE incidentops OWNER incidentops_app;
CREATE DATABASE incidentops_shadow OWNER postgres;
```

### 2. Server

```
cd server
npm install
cp .env.example .env   # fill in DATABASE_URL, SHADOW_DATABASE_URL, SESSION_SECRET
npx prisma migrate deploy
npm run seed            # creates a demo user + team + sample incident
npm run dev              # http://localhost:4000
```

Demo login after seeding: `demo@example.com` / `demo password 123`.

### 3. Client

```
cd client
npm install
cp .env.example .env    # defaults to http://localhost:4000, change if needed
npm run dev              # http://localhost:5173
```

### Running tests

The server has its own test database — see `server/.env.example` for the
shape, point `DATABASE_URL` in `server/.env.test` at a separate database
before running:

```
cd server
npm test
```
