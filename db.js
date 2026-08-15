// ═══════════════════════════════════════════════════════════════
//  DATABASE LAYER — SQLite (better-sqlite3)
//  Replaces the browser localStorage store used previously.
// ═══════════════════════════════════════════════════════════════

const path = require('path');
const { DatabaseSync } = require('node:sqlite');

const DB_PATH = path.join(__dirname, 'barangay_gomez.sqlite');
const db = new DatabaseSync(DB_PATH);
db.exec('PRAGMA journal_mode = WAL');
db.exec('PRAGMA foreign_keys = ON');

// ─── Schema ───────────────────────────────────────────────────
db.exec(`
CREATE TABLE IF NOT EXISTS users (
    id          INTEGER PRIMARY KEY,
    username    TEXT UNIQUE NOT NULL,
    password    TEXT NOT NULL,
    role        TEXT NOT NULL,
    name        TEXT,
    email       TEXT,
    phone       TEXT,
    address     TEXT,
    birthdate   TEXT,
    status      TEXT DEFAULT 'Active',
    createdAt   TEXT
);

CREATE TABLE IF NOT EXISTS residents (
    id            INTEGER PRIMARY KEY,
    name          TEXT NOT NULL,
    email         TEXT,
    phone         TEXT,
    address       TEXT,
    birthdate     TEXT,
    status        TEXT DEFAULT 'Active',
    registeredAt  TEXT
);

CREATE TABLE IF NOT EXISTS complaints (
    id               INTEGER PRIMARY KEY,
    referenceNumber  TEXT UNIQUE NOT NULL,
    residentId       INTEGER,
    residentName     TEXT,
    category         TEXT,
    description      TEXT,
    status           TEXT DEFAULT 'Pending',
    priority         TEXT DEFAULT 'Medium',
    assignedTo       INTEGER,
    createdAt        TEXT,
    updatedAt        TEXT,
    resolvedAt       TEXT,
    FOREIGN KEY (residentId) REFERENCES residents(id) ON DELETE SET NULL,
    FOREIGN KEY (assignedTo) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS complaint_notes (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    complaintId  INTEGER NOT NULL,
    sortOrder    INTEGER DEFAULT 0,
    date         TEXT,
    author       TEXT,
    note         TEXT,
    FOREIGN KEY (complaintId) REFERENCES complaints(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS complaint_evidence (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    complaintId  INTEGER NOT NULL,
    sortOrder    INTEGER DEFAULT 0,
    name         TEXT,
    type         TEXT,
    dataURL      TEXT,
    FOREIGN KEY (complaintId) REFERENCES complaints(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS complaint_inspections (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    complaintId  INTEGER NOT NULL,
    sortOrder    INTEGER DEFAULT 0,
    date         TEXT,
    location     TEXT,
    notes        TEXT,
    FOREIGN KEY (complaintId) REFERENCES complaints(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS announcements (
    id        INTEGER PRIMARY KEY,
    title     TEXT NOT NULL,
    content   TEXT,
    author    TEXT,
    date      TEXT,
    isPinned  INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS activity_logs (
    id         INTEGER PRIMARY KEY,
    userId     INTEGER,
    userName   TEXT,
    action     TEXT,
    timestamp  TEXT
);

CREATE TABLE IF NOT EXISTS settings (
    id             INTEGER PRIMARY KEY CHECK (id = 1),
    systemName     TEXT,
    barangayName   TEXT,
    municipality   TEXT,
    province       TEXT
);

CREATE TABLE IF NOT EXISTS next_ids (
    key    TEXT PRIMARY KEY,
    value  INTEGER NOT NULL
);
`);

// ─── Seed data (used only the first time the DB is created) ───
function seedIfEmpty() {
    const userCount = db.prepare('SELECT COUNT(*) AS c FROM users').get().c;
    if (userCount > 0) return; // already seeded

    const seed = require('./seed-data.js');
    replaceFullData(seed);
    console.log('🌱 Database seeded with initial Barangay Gomez data.');
}

// ─── Read: assemble the full nested object the frontend expects ───
function getFullData() {
    const users = db.prepare('SELECT * FROM users ORDER BY id').all();
    const residents = db.prepare('SELECT * FROM residents ORDER BY id').all();

    const complaints = db.prepare('SELECT * FROM complaints ORDER BY id').all();
    const notes = db.prepare('SELECT * FROM complaint_notes ORDER BY complaintId, sortOrder, id').all();
    const evidence = db.prepare('SELECT * FROM complaint_evidence ORDER BY complaintId, sortOrder, id').all();
    const inspections = db.prepare('SELECT * FROM complaint_inspections ORDER BY complaintId, sortOrder, id').all();

    const notesByComplaint = groupBy(notes, 'complaintId');
    const evidenceByComplaint = groupBy(evidence, 'complaintId');
    const inspectionsByComplaint = groupBy(inspections, 'complaintId');

    complaints.forEach(c => {
        c.notes = (notesByComplaint[c.id] || []).map(n => ({ date: n.date, author: n.author, note: n.note }));
        c.evidence = (evidenceByComplaint[c.id] || []).map(e => ({ name: e.name, type: e.type, dataURL: e.dataURL }));
        c.inspections = (inspectionsByComplaint[c.id] || []).map(i => ({ date: i.date, location: i.location, notes: i.notes }));
    });

    const announcements = db.prepare('SELECT * FROM announcements ORDER BY id').all()
        .map(a => ({ ...a, isPinned: !!a.isPinned }));

    const activityLogs = db.prepare('SELECT * FROM activity_logs ORDER BY id').all();

    const nextIdRows = db.prepare('SELECT * FROM next_ids').all();
    const nextId = {};
    nextIdRows.forEach(r => { nextId[r.key] = r.value; });

    const settings = db.prepare('SELECT * FROM settings WHERE id = 1').get() || {};
    delete settings.id;

    return { users, residents, complaints, announcements, activityLogs, nextId, settings };
}

function groupBy(rows, key) {
    const out = {};
    rows.forEach(r => {
        (out[r[key]] = out[r[key]] || []).push(r);
    });
    return out;
}

// ─── Write: full replace-sync (mirrors the app's "save whole blob" pattern) ───
function replaceFullData(data) {
    db.exec('BEGIN');
    try {
        db.exec(`
            DELETE FROM complaint_notes;
            DELETE FROM complaint_evidence;
            DELETE FROM complaint_inspections;
            DELETE FROM complaints;
            DELETE FROM residents;
            DELETE FROM users;
            DELETE FROM announcements;
            DELETE FROM activity_logs;
            DELETE FROM settings;
            DELETE FROM next_ids;
        `);

        const insertUser = db.prepare(`INSERT INTO users
            (id, username, password, role, name, email, phone, address, birthdate, status, createdAt)
            VALUES (@id, @username, @password, @role, @name, @email, @phone, @address, @birthdate, @status, @createdAt)`);
        (data.users || []).forEach(u => insertUser.run(withDefaults(u, ['username','password','role','name','email','phone','address','birthdate','status','createdAt'])));

        const insertResident = db.prepare(`INSERT INTO residents
            (id, name, email, phone, address, birthdate, status, registeredAt)
            VALUES (@id, @name, @email, @phone, @address, @birthdate, @status, @registeredAt)`);
        (data.residents || []).forEach(r => insertResident.run(withDefaults(r, ['name','email','phone','address','birthdate','status','registeredAt'])));

        const insertComplaint = db.prepare(`INSERT INTO complaints
            (id, referenceNumber, residentId, residentName, category, description, status, priority, assignedTo, createdAt, updatedAt, resolvedAt)
            VALUES (@id, @referenceNumber, @residentId, @residentName, @category, @description, @status, @priority, @assignedTo, @createdAt, @updatedAt, @resolvedAt)`);
        const insertNote = db.prepare(`INSERT INTO complaint_notes (complaintId, sortOrder, date, author, note) VALUES (?, ?, ?, ?, ?)`);
        const insertEvidence = db.prepare(`INSERT INTO complaint_evidence (complaintId, sortOrder, name, type, dataURL) VALUES (?, ?, ?, ?, ?)`);
        const insertInspection = db.prepare(`INSERT INTO complaint_inspections (complaintId, sortOrder, date, location, notes) VALUES (?, ?, ?, ?, ?)`);

        (data.complaints || []).forEach(c => {
            insertComplaint.run(withDefaults(c, ['referenceNumber','residentId','residentName','category','description','status','priority','assignedTo','createdAt','updatedAt','resolvedAt']));
            (c.notes || []).forEach((n, i) => insertNote.run(c.id, i, n.date || null, n.author || null, n.note || null));
            (c.evidence || []).forEach((e, i) => insertEvidence.run(c.id, i, e.name || null, e.type || null, e.dataURL || null));
            (c.inspections || []).forEach((ins, i) => insertInspection.run(c.id, i, ins.date || null, ins.location || null, ins.notes || null));
        });

        const insertAnnouncement = db.prepare(`INSERT INTO announcements (id, title, content, author, date, isPinned)
            VALUES (@id, @title, @content, @author, @date, @isPinned)`);
        (data.announcements || []).forEach(a => insertAnnouncement.run({ ...withDefaults(a, ['title','content','author','date']), isPinned: a.isPinned ? 1 : 0 }));

        const insertLog = db.prepare(`INSERT INTO activity_logs (id, userId, userName, action, timestamp)
            VALUES (@id, @userId, @userName, @action, @timestamp)`);
        (data.activityLogs || []).forEach(l => insertLog.run(withDefaults(l, ['userId','userName','action','timestamp'])));

        const s = data.settings || {};
        db.prepare(`INSERT INTO settings (id, systemName, barangayName, municipality, province) VALUES (1, ?, ?, ?, ?)`)
            .run(s.systemName || null, s.barangayName || null, s.municipality || null, s.province || null);

        const nextId = data.nextId || {};
        const insertNextId = db.prepare(`INSERT INTO next_ids (key, value) VALUES (?, ?)`);
        Object.keys(nextId).forEach(k => insertNextId.run(k, nextId[k]));

        db.exec('COMMIT');
    } catch (err) {
        db.exec('ROLLBACK');
        throw err;
    }
}

// Fills in any missing keys with null so the prepared statement's named params always resolve
function withDefaults(obj, keys) {
    const out = { id: obj.id };
    keys.forEach(k => { out[k] = obj[k] === undefined ? null : obj[k]; });
    return out;
}

function resetToSeed() {
    const seed = require('./seed-data.js');
    replaceFullData(seed);
}

seedIfEmpty();

module.exports = { db, getFullData, replaceFullData, resetToSeed };
