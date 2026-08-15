// ═══════════════════════════════════════════════════════════════
//  Barangay Gomez — Backend Server
//  Express + SQLite (better-sqlite3)
// ═══════════════════════════════════════════════════════════════

const path = require('path');
const express = require('express');
const { getFullData, replaceFullData, resetToSeed } = require('./db.js');

const app = express();
const PORT = process.env.PORT || 3000;

// Evidence photos are sent as base64 data URLs, so allow a generous body size.
app.use(express.json({ limit: '25mb' }));

// ─── API ──────────────────────────────────────────────────────

// Fetch the entire application dataset (users, residents, complaints, etc.)
app.get('/api/data', (req, res) => {
    try {
        res.json(getFullData());
    } catch (err) {
        console.error('GET /api/data failed:', err);
        res.status(500).json({ error: 'Failed to load data from the database.' });
    }
});

// Persist the entire application dataset. The frontend keeps a single
// in-memory copy of the data and pushes the whole thing here whenever
// it changes (same pattern the old localStorage version used, just
// backed by a real database now instead of the browser).
app.post('/api/data', (req, res) => {
    try {
        replaceFullData(req.body || {});
        res.json({ success: true });
    } catch (err) {
        console.error('POST /api/data failed:', err);
        res.status(500).json({ error: 'Failed to save data to the database.' });
    }
});

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
});

// Wipes the database and restores the original demo/seed data.
// Used by Settings > Reset All Data in the app.
app.post('/api/data/reset', (req, res) => {
    try {
        resetToSeed();
        res.json({ success: true });
    } catch (err) {
        console.error('POST /api/data/reset failed:', err);
        res.status(500).json({ error: 'Failed to reset the database.' });
    }
});

// ─── Static frontend ──────────────────────────────────────────
// Serves Document.html, script.js, style.css, and the barangay logo
// from the project root (one directory up from /server).
const FRONTEND_DIR = path.join(__dirname, '..');
app.use(express.static(FRONTEND_DIR, { index: 'Document.html' }));

// Any unknown non-API route falls back to the app shell (single page app).
app.get(/^\/(?!api\/).*/, (req, res) => {
    res.sendFile(path.join(FRONTEND_DIR, 'Document.html'));
});

app.listen(PORT, () => {
    console.log('═══════════════════════════════════════════════════════');
    console.log('  🏡 Barangay Gomez Complaint & Concern System');
    console.log(`  🚀 Server running at http://localhost:${PORT}`);
    console.log('  🗄️  Data stored in SQLite (server/barangay_gomez.sqlite)');
    console.log('═══════════════════════════════════════════════════════');
});
