# Barangay Gomez · Complaint & Concern Management System

Now backed by a real **Node.js + Express + SQLite** server instead of browser
`localStorage`. Data lives in `server/barangay_gomez.sqlite` and is shared by
everyone who opens the app, on any device, instead of being trapped in one
browser.

## Project structure

```
Document.html    ← the app (open it via the server, not by double-clicking the file)
script.js        ← frontend logic (now talks to /api/data instead of localStorage)
style.css
480686370_...jpg ← Barangay Gomez seal/logo
server/
  server.js      ← Express app: serves the frontend + the API
  db.js          ← SQLite schema, seeding, and read/write helpers
  seed-data.js   ← the original demo data, used to seed the DB on first run
  package.json
```

## Running it

You need [Node.js](https://nodejs.org) **22.5 or newer** (uses Node's built-in
`node:sqlite` module, so no extra database driver needs to be compiled —
no Python, no build tools, no native compilation required).

```bash
cd server
npm install
npm start
```

Then open **http://localhost:3000** in your browser. The server serves the
frontend files and the API from the same origin, so nothing else needs to
run. You may see a one-line `ExperimentalWarning: SQLite is an experimental
feature` in the terminal — that's expected and harmless, just Node letting
you know this built-in module is still labeled experimental.

The very first time you start the server it creates
`server/barangay_gomez.sqlite` and seeds it with the same demo accounts and
sample complaints the app used to ship with:

| Role  | Username | Password  |
|-------|----------|-----------|
| Admin | admin    | admin123  |
| Staff | staff1   | staff123  |
| Staff | staff2   | staff123  |

After that, all data — new residents, complaints, announcements, settings —
is read from and written to that SQLite file. Restarting the server (or your
computer) does not lose data; only using **Settings → Reset All Data** in the
app wipes it back to the seed demo data.

## How the frontend talks to the database

The database schema is fully relational (separate tables for `users`,
`residents`, `complaints`, `complaint_notes`, `complaint_evidence`,
`complaint_inspections`, `announcements`, `activity_logs`, `settings`) — see
`server/db.js`.

To avoid rewriting the entire frontend into async/await (the original file
calls `loadData()`/`saveData()` synchronously in dozens of places), the
frontend keeps a single in-memory cache of the whole dataset:

- On page load, the app shows a loading screen, fetches `GET /api/data`
  (which the server assembles by joining all the tables into the same
  nested shape the app already used), and caches it.
- `loadData()` now just returns that cache, synchronously — every existing
  call site keeps working unchanged.
- `saveData(data)` updates the cache immediately and pushes the whole
  object to `POST /api/data` in the background, which the server writes
  into the relational tables inside a transaction.

This is a good fit for a barangay-scale app (a handful of staff, not
thousands of concurrent writers). For a larger deployment you'd want
per-entity REST endpoints and real authentication/sessions instead of the
current plaintext-password, client-side-only login check — that part was
carried over as-is from the original version and is worth hardening before
using this for anything beyond a demo or a small barangay office.

## API reference

| Method | Path              | Description                                   |
|--------|-------------------|------------------------------------------------|
| GET    | `/api/data`       | Returns the full dataset as JSON               |
| POST   | `/api/data`       | Replaces the full dataset (body = same shape)  |
| POST   | `/api/data/reset` | Wipes the DB and restores the seed demo data   |
| GET    | `/api/health`     | Simple health check                            |
