const { DatabaseSync } = require('node:sqlite');
const path = require('path');

const dbPath = path.join(__dirname, 'database.sqlite');
const db = new DatabaseSync(dbPath);

// Initialize Tables
function initDatabase() {
    // 1. Contacts Table
    db.exec(`
        CREATE TABLE IF NOT EXISTS contacts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            phone TEXT NOT NULL,
            relation TEXT DEFAULT 'Emergency Contact',
            is_primary INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
    `);

    // 2. SOS Alerts History
    db.exec(`
        CREATE TABLE IF NOT EXISTS sos_alerts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            latitude REAL NOT NULL,
            longitude REAL NOT NULL,
            address TEXT,
            alert_type TEXT DEFAULT 'panic_button',
            status TEXT DEFAULT 'active',
            sms_payload TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            resolved_at DATETIME
        );
    `);

    // 3. AI Chat History
    db.exec(`
        CREATE TABLE IF NOT EXISTS chat_messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            role TEXT NOT NULL,
            message TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
    `);

    // 4. AI Threat Scans
    db.exec(`
        CREATE TABLE IF NOT EXISTS threat_scans (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            input_text TEXT NOT NULL,
            threat_level TEXT NOT NULL,
            threat_score INTEGER NOT NULL,
            legal_sections TEXT,
            analysis TEXT,
            action_plan TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
    `);

    // 5. Safe Havens / Places
    db.exec(`
        CREATE TABLE IF NOT EXISTS safe_places (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            type TEXT NOT NULL,
            latitude REAL NOT NULL,
            longitude REAL NOT NULL,
            phone TEXT NOT NULL,
            address TEXT,
            is_24_7 INTEGER DEFAULT 1
        );
    `);

    // 6. Application Settings
    db.exec(`
        CREATE TABLE IF NOT EXISTS settings (
            key TEXT PRIMARY KEY,
            value TEXT
        );
    `);

    // Seed default contacts if empty
    const contactCount = db.prepare('SELECT COUNT(*) as count FROM contacts').get().count;
    if (contactCount === 0) {
        const insertContact = db.prepare('INSERT INTO contacts (name, phone, relation, is_primary) VALUES (?, ?, ?, ?)');
        insertContact.run('Parent / Guardian', '+91 98100 12345', 'Father', 1);
        insertContact.run('Ananya Sharma', '+91 98711 67890', 'Best Friend', 0);
        insertContact.run('Sister (Pooja)', '+91 98112 34567', 'Sister', 0);
    }

    // Seed safe places if empty
    const placeCount = db.prepare('SELECT COUNT(*) as count FROM safe_places').get().count;
    if (placeCount === 0) {
        const insertPlace = db.prepare('INSERT INTO safe_places (name, type, latitude, longitude, phone, address, is_24_7) VALUES (?, ?, ?, ?, ?, ?, ?)');
        insertPlace.run('Sector 62 Police Station', 'police', 28.6255, 77.3685, '112', 'Sector 62, Noida, UP', 1);
        insertPlace.run('Fortis Hospital 24/7 Emergency', 'hospital', 28.6180, 77.3720, '102', 'B-22, Sector 62, Noida', 1);
        insertPlace.run('Women Safe Haven & Helpdesk (NGO)', 'safezone', 28.6310, 77.3610, '181', 'Near Metro Station, Sector 62', 1);
        insertPlace.run('Police Beat Booth - Sector 63', 'police', 28.6350, 77.3820, '112', 'Electronic City Crossing, Sector 63', 1);
        insertPlace.run('Jaypee Hospital Emergency Trauma', 'hospital', 28.5175, 77.3705, '0120-4122222', 'Sector 128, Noida-Greater Noida Expy', 1);
        insertPlace.run('24/7 One Stop Centre (Sakhi) for Women', 'safezone', 28.5700, 77.3200, '0120-2544100', 'District Hospital Complex, Noida', 1);
    }
}

// Contacts DAO
const contactsDao = {
    getAll: () => db.prepare('SELECT * FROM contacts ORDER BY is_primary DESC, id ASC').all(),
    getById: (id) => db.prepare('SELECT * FROM contacts WHERE id = ?').get(id),
    create: (name, phone, relation, is_primary = 0) => {
        const stmt = db.prepare('INSERT INTO contacts (name, phone, relation, is_primary) VALUES (?, ?, ?, ?)');
        const result = stmt.run(name, phone, relation, is_primary ? 1 : 0);
        return contactsDao.getById(result.lastInsertRowid);
    },
    update: (id, name, phone, relation, is_primary = 0) => {
        db.prepare('UPDATE contacts SET name = ?, phone = ?, relation = ?, is_primary = ? WHERE id = ?')
          .run(name, phone, relation, is_primary ? 1 : 0, id);
        return contactsDao.getById(id);
    },
    delete: (id) => {
        return db.prepare('DELETE FROM contacts WHERE id = ?').run(id);
    }
};

// SOS Alerts DAO
const sosDao = {
    getAll: (limit = 20) => db.prepare('SELECT * FROM sos_alerts ORDER BY id DESC LIMIT ?').all(limit),
    getActive: () => db.prepare("SELECT * FROM sos_alerts WHERE status = 'active' ORDER BY id DESC LIMIT 1").get(),
    create: (latitude, longitude, address, alert_type, sms_payload) => {
        const stmt = db.prepare('INSERT INTO sos_alerts (latitude, longitude, address, alert_type, sms_payload) VALUES (?, ?, ?, ?, ?)');
        const result = stmt.run(latitude, longitude, address || 'Unknown Location', alert_type || 'panic_button', sms_payload || '');
        return db.prepare('SELECT * FROM sos_alerts WHERE id = ?').get(result.lastInsertRowid);
    },
    resolve: (id) => {
        if (id) {
            db.prepare("UPDATE sos_alerts SET status = 'resolved', resolved_at = CURRENT_TIMESTAMP WHERE id = ?").run(id);
        } else {
            db.prepare("UPDATE sos_alerts SET status = 'resolved', resolved_at = CURRENT_TIMESTAMP WHERE status = 'active'").run();
        }
    }
};

// Chat DAO
const chatDao = {
    getAll: (limit = 50) => db.prepare('SELECT * FROM chat_messages ORDER BY id ASC LIMIT ?').all(limit),
    add: (role, message) => {
        const stmt = db.prepare('INSERT INTO chat_messages (role, message) VALUES (?, ?)');
        const result = stmt.run(role, message);
        return db.prepare('SELECT * FROM chat_messages WHERE id = ?').get(result.lastInsertRowid);
    },
    clear: () => db.prepare('DELETE FROM chat_messages').run()
};

// Threat DAO
const threatDao = {
    getAll: (limit = 10) => db.prepare('SELECT * FROM threat_scans ORDER BY id DESC LIMIT ?').all(limit),
    add: (input_text, threat_level, threat_score, legal_sections, analysis, action_plan) => {
        const stmt = db.prepare('INSERT INTO threat_scans (input_text, threat_level, threat_score, legal_sections, analysis, action_plan) VALUES (?, ?, ?, ?, ?, ?)');
        const result = stmt.run(input_text, threat_level, threat_score, legal_sections, analysis, action_plan);
        return db.prepare('SELECT * FROM threat_scans WHERE id = ?').get(result.lastInsertRowid);
    }
};

// Safe Places DAO
const safePlacesDao = {
    getAll: () => db.prepare('SELECT * FROM safe_places ORDER BY id ASC').all(),
    add: (name, type, latitude, longitude, phone, address, is_24_7 = 1) => {
        const stmt = db.prepare('INSERT INTO safe_places (name, type, latitude, longitude, phone, address, is_24_7) VALUES (?, ?, ?, ?, ?, ?, ?)');
        const result = stmt.run(name, type, latitude, longitude, phone, address, is_24_7 ? 1 : 0);
        return db.prepare('SELECT * FROM safe_places WHERE id = ?').get(result.lastInsertRowid);
    }
};

// Settings DAO
const settingsDao = {
    get: (key) => {
        const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key);
        return row ? row.value : null;
    },
    set: (key, value) => {
        db.prepare('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = ?').run(key, value, value);
    },
    getAll: () => {
        const rows = db.prepare('SELECT key, value FROM settings').all();
        const obj = {};
        rows.forEach(r => { obj[r.key] = r.value; });
        return obj;
    }
};

initDatabase();

module.exports = {
    db,
    contactsDao,
    sosDao,
    chatDao,
    threatDao,
    safePlacesDao,
    settingsDao
};
