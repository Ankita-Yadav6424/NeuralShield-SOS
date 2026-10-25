require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { contactsDao, sosDao, chatDao, threatDao, safePlacesDao, settingsDao } = require('./db.js');
const { getAIChatResponse, analyzeCyberThreat } = require('./ai-engine.js');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// -------------------------------------------------------------
// Contacts API
// -------------------------------------------------------------
app.get('/api/contacts', (req, res) => {
    try {
        const contacts = contactsDao.getAll();
        res.json({ success: true, contacts });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

app.post('/api/contacts', (req, res) => {
    try {
        const { name, phone, relation, is_primary } = req.body;
        if (!name || !name.trim()) {
            return res.status(400).json({ success: false, error: 'Contact name is required' });
        }
        if (!phone || !phone.trim()) {
            return res.status(400).json({ success: false, error: 'Phone number is required' });
        }

        const newContact = contactsDao.create(
            name.trim(),
            phone.trim(),
            (relation && relation.trim()) || 'Guardian',
            is_primary ? 1 : 0
        );
        res.status(201).json({ success: true, contact: newContact });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

app.put('/api/contacts/:id', (req, res) => {
    try {
        const { id } = req.params;
        const { name, phone, relation, is_primary } = req.body;
        const updated = contactsDao.update(id, name, phone, relation, is_primary);
        res.json({ success: true, contact: updated });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

app.delete('/api/contacts/:id', (req, res) => {
    try {
        const { id } = req.params;
        contactsDao.delete(id);
        res.json({ success: true, message: 'Contact deleted successfully' });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// -------------------------------------------------------------
// SOS Emergency Dispatch API
// -------------------------------------------------------------
app.post('/api/sos/trigger', (req, res) => {
    try {
        const { latitude, longitude, address, alert_type } = req.body;
        const lat = parseFloat(latitude) || 28.5355;
        const lng = parseFloat(longitude) || 77.3910;
        const mapsLink = `https://maps.google.com/?q=${lat},${lng}`;
        const timestampStr = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });

        const customMsg = settingsDao.get('custom_sos_message') || 'EMERGENCY! I feel unsafe and require immediate assistance.';
        const userName = settingsDao.get('user_name') || 'User';

        const smsPayload = `[SafeHer SOS - ${timestampStr}] ${userName}: ${customMsg}\nLive Location: ${mapsLink} | Address: ${address || 'Near coordinates'}`;

        const alert = sosDao.create(lat, lng, address, alert_type || 'panic_button', smsPayload);

        // Fetch contacts to generate WhatsApp alert links
        const contacts = contactsDao.getAll();
        const whatsappLinks = contacts.map(c => {
            const cleanPhone = c.phone.replace(/[^0-9]/g, '');
            const encodedMsg = encodeURIComponent(smsPayload);
            return {
                name: c.name,
                phone: c.phone,
                url: `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodedMsg}`
            };
        });

        res.json({
            success: true,
            alert,
            sms_payload: smsPayload,
            maps_link: mapsLink,
            contacts_count: contacts.length,
            whatsapp_links: whatsappLinks
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

app.post('/api/sos/cancel', (req, res) => {
    try {
        const { id } = req.body;
        sosDao.resolve(id);
        res.json({ success: true, message: 'Emergency SOS alert marked as safe/resolved.' });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

app.get('/api/sos/history', (req, res) => {
    try {
        const alerts = sosDao.getAll();
        res.json({ success: true, alerts });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// -------------------------------------------------------------
// Safe Places / Havens API
// -------------------------------------------------------------
app.get('/api/places', (req, res) => {
    try {
        const places = safePlacesDao.getAll();
        res.json({ success: true, places });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

app.post('/api/places', (req, res) => {
    try {
        const { name, type, latitude, longitude, phone, address, is_24_7 } = req.body;
        const place = safePlacesDao.add(name, type, parseFloat(latitude), parseFloat(longitude), phone, address, is_24_7);
        res.status(201).json({ success: true, place });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// -------------------------------------------------------------
// AI Chat Assistant (AURA) API
// -------------------------------------------------------------
app.post('/api/ai/chat', async (req, res) => {
    try {
        const { message } = req.body;
        if (!message || !message.trim()) {
            return res.status(400).json({ success: false, error: 'Message cannot be empty' });
        }

        // Save user message to database
        chatDao.add('user', message.trim());

        // Process message through AURA AI Engine
        const aiReply = await getAIChatResponse(message.trim());

        // Save AI reply to database
        chatDao.add('model', aiReply);

        res.json({ success: true, reply: aiReply });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

app.get('/api/ai/chat/history', (req, res) => {
    try {
        const history = chatDao.getAll();
        res.json({ success: true, history });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

app.delete('/api/ai/chat/history', (req, res) => {
    try {
        chatDao.clear();
        res.json({ success: true, message: 'Chat history cleared' });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// -------------------------------------------------------------
// AI Cyber Threat Scanner API
// -------------------------------------------------------------
app.post('/api/ai/scan-threat', async (req, res) => {
    try {
        const { text } = req.body;
        if (!text || !text.trim()) {
            return res.status(400).json({ success: false, error: 'Text input required for scanning' });
        }

        const analysis = await analyzeCyberThreat(text.trim());

        // Persist scan to database
        threatDao.add(
            text.trim(),
            analysis.threat_level,
            analysis.threat_score,
            analysis.legal_sections,
            analysis.analysis,
            JSON.stringify(analysis.action_plan)
        );

        res.json({ success: true, result: analysis });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

app.get('/api/ai/scan-threat/history', (req, res) => {
    try {
        const scans = threatDao.getAll();
        res.json({ success: true, scans });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// -------------------------------------------------------------
// Reverse Geocoding Proxy (Nominatim OSM)
// -------------------------------------------------------------
app.get('/api/geocode/reverse', async (req, res) => {
    try {
        const { lat, lng } = req.query;
        if (!lat || !lng) {
            return res.status(400).json({ success: false, error: 'lat and lng parameters are required' });
        }

        const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lng)}&zoom=18&addressdetails=1`;
        
        const geoRes = await fetch(url, {
            headers: {
                'User-Agent': 'SafeHer-Women-Safety-App/1.0 (Hackathon Project)'
            }
        });

        if (!geoRes.ok) {
            return res.json({ success: false, address: `Coordinates: ${Number(lat).toFixed(4)}, ${Number(lng).toFixed(4)}` });
        }

        const geoData = await geoRes.json();
        const address = geoData.display_name || `${geoData.address?.road || ''}, ${geoData.address?.suburb || ''}, ${geoData.address?.city || geoData.address?.town || ''}`;

        res.json({ success: true, address: address.trim() || `Lat: ${lat}, Long: ${lng}`, raw: geoData });
    } catch (err) {
        res.json({ success: false, address: `Lat: ${req.query.lat}, Long: ${req.query.lng}`, error: err.message });
    }
});

// -------------------------------------------------------------
// Settings API
// -------------------------------------------------------------
app.get('/api/settings', (req, res) => {
    try {
        const settings = settingsDao.getAll();
        // Mask API key for security
        if (settings.gemini_api_key) {
            settings.gemini_api_key_masked = settings.gemini_api_key.substring(0, 4) + '••••••••' + settings.gemini_api_key.slice(-4);
        }
        res.json({ success: true, settings });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

app.post('/api/settings', (req, res) => {
    try {
        const { gemini_api_key, user_name, custom_sos_message } = req.body;
        if (gemini_api_key !== undefined) settingsDao.set('gemini_api_key', gemini_api_key.trim());
        if (user_name !== undefined) settingsDao.set('user_name', user_name.trim());
        if (custom_sos_message !== undefined) settingsDao.set('custom_sos_message', custom_sos_message.trim());
        res.json({ success: true, message: 'Settings saved successfully' });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'online',
        service: 'SafeHer NeuralShield SOS Backend',
        database: 'SQLite 3 (node:sqlite)',
        timestamp: new Date().toISOString()
    });
});

// Start Server
app.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(` SafeHer Emergency SOS & AI Guardian Server Active! `);
    console.log(` Running on: http://localhost:${PORT}             `);
    console.log(` Database: database.sqlite (Initialized)            `);
    console.log(`====================================================`);
});
