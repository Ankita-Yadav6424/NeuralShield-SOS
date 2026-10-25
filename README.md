# SafeHer - Women Safety Emergency SOS, Google Maps & AI Guardian Platform
**Built by Neural Ninjas-4 (CS & AI Innovation)**

SafeHer is a comprehensive, full-stack emergency response, GPS tracking, and AI-powered safety platform engineered for women's security. It integrates instant panic dispatch, active continuous GPS tracking with Google Maps live tracking, dual-tone emergency sirens, real microphone ambient audio evidence recording, a fake call escape simulator, an AI Guardian (**AURA**), and a comprehensive awareness center for **Women's Rights under the Indian Constitution and Criminal Law (Bharatiya Nyaya Sanhita - BNS / BNSS)**.

---

## 🚀 Key Features Implemented

### 1. 🚨 Automated SOS Multi-Guardian & Helpline Dispatch
- **Dispatches to All Saved Guardians**:
  - Live coordinates and verified street address.
  - **Live Google Maps Tracking URL** (`https://www.google.com/maps?q=lat,lng`).
  - **1-Click Bulk SMS Dispatch**: Generates native `sms:${allPhones}?body=${encodedSms}` opening the default phone SMS messenger with all saved guardian contacts simultaneously.
  - **Individual WhatsApp Emergency Links**: Direct one-tap emergency message links for each contact.
- **Official Emergency Helplines Direct Routing**:
  - **112 (National Emergency ERSS)**: National Police/Emergency single-dial with instant ERSS technical dispatch code.
  - **1091 (Women in Distress Helpline)**: 24/7 dedicated women safety line.
  - **181 (Domestic Abuse Helpline)**: One Stop Crisis / Sakhi centers.
  - **1930 (National Cyber Crime Reporting Portal)**: Financial and cyber harassment reporting.
  - **One-Click "Copy Official ERSS Police Code"**: Copies standardized police distress telemetry for 112 operators.

### 2. 🗺️ Google Maps Integration & Live GPS Havens Map
- **Live Google Maps Satellite & Terrain View**: Integrated Google Maps live embed centered on the user's exact coordinates.
- **Map View Switcher**:
  - `Radar Havens`: Leaflet dark-mode map showing closest police stations, trauma hospitals, and safe zones with calculated walking distance.
  - `Google Map`: Live Google Maps interface.
- **One-Click "Open in Google Maps"**: Direct link (`https://www.google.com/maps?q=lat,lng`) to launch turn-by-turn navigation in the Google Maps mobile app or browser.
- **Active Geolocation**: Continuous tracking via `navigator.geolocation.watchPosition` with high-accuracy mode, animated radar pulse marker, and GPS accuracy radius circle.
- **Reverse Geocoding**: Automatically translates latitude/longitude into human-readable street and locality names (e.g. *Sector 62, Noida, Uttar Pradesh*).

### 3. ⚖️ Women's Rights in the Indian Constitution & Legal Safeguards
- Dedicated awareness center featuring **18 constitutional and statutory safeguards**:
  - **Fundamental Rights (Part III)**:
    - **Article 14**: Right to Equality before law and equal protection of laws.
    - **Article 15(1) & 15(3)**: Prohibition of sex discrimination & power to make special protective provisions for women (validating the POSH Act, DV Act, maternity benefits).
    - **Article 16(2)**: Equal opportunity in public employment without sex discrimination.
    - **Article 19(1)(d) & 19(1)(g)**: Freedom of safe movement and choice of occupation without harassment.
    - **Article 21**: Right to Life, Dignity, Bodily Integrity & Privacy (*Vishaka*, *K.S. Puttaswamy*, *Francis Coralie*).
    - **Article 23**: Absolute prohibition on human trafficking and forced labor.
  - **Directive Principles of State Policy (Part IV)**:
    - **Article 39(a) & 39(d)**: Equal livelihood & equal pay for equal work (Equal Remuneration Act).
    - **Article 39A**: Right to **Free Legal Aid** for every woman regardless of income under Legal Services Authorities Act.
    - **Article 42**: Maternity relief and just working conditions (26 weeks paid maternity leave).
  - **Fundamental Duties (Part IV-A)**:
    - **Article 51A(e)**: Duty of every citizen to renounce practices derogatory to the dignity of women.
  - **Criminal & Police Procedure Rights (BNSS & BNS 2023)**:
    - **Section 173 BNSS (Zero FIR)**: Right to lodge an FIR at ANY police station in India regardless of territorial jurisdiction.
    - **Section 43(5) BNSS / CrPC 46(4)**: Absolute ban on arresting women between sunset and sunrise (night hours).
    - **Section 179 BNSS / CrPC 160**: Right to be questioned/interrogated at residence in presence of family, not at a police station.
    - **Section 51 BNSS / CrPC 164A**: Physical/medical examination strictly by or under a registered female medical practitioner. Two-finger test strictly criminalized.
    - **Section 72 BNS**: Absolute confidentiality of sexual violence survivor identity (up to 2 years imprisonment for disclosure).
  - **Special Enactments**:
    - **Protection of Women from Domestic Violence Act, 2005 (PWDVA)**: Right to shared residence, protection orders, monetary maintenance.
    - **POSH Act, 2013**: Mandatory Internal Complaints Committee (ICC) in all workplaces with 10+ employees.
    - **BNS Sections 74 to 79**: Penalties for outraging modesty (74), voyeurism (77), cyber/physical stalking (78), and insults to modesty (79).
- **Interactive Tools**:
  - Live search bar and category filters.
  - "Ask AURA to Explain" button on each provision (smoothly sends query to the AI Guardian).
  - "Copy Legal Provision" button for quick sharing.

### 4. 🤖 AURA AI Guardian & Cyber Threat Scanner
- **Dual AI Engine**:
  - Integrated with **Google Gemini API** (`gemini-2.5-flash`).
  - **Built-in Offline-Resilient NLP Safety Intelligence**: Provides expert responses on self-defense, transit emergencies, de-escalation, and legal rights under BNS even without an external API key.
- **Voice Speech-to-Text & Text-to-Speech**:
  - Hands-free voice querying via microphone in chat.
  - "Listen" button on all AI messages to hear instructions read aloud.
- **AI Cyber Threat & Harassment Scanner**:
  - Evaluates suspicious messages for extortion, morphing, non-consensual media, and stalking.
  - Generates **Threat Risk Score (0-100%)**, legal provisions, and 1-click **Formal Cyber Crime Complaint Letter** formatted for `cybercrime.gov.in`.

### 5. 🗄️ Full-Stack Backend & SQLite Database
- **SQLite Database (`database.sqlite`)**:
  - Powered by Node.js native `node:sqlite` (SQLite 3.51).
  - Relational tables: `contacts`, `sos_alerts`, `constitutional_rights`, `chat_messages`, `threat_scans`, `safe_places`, `settings`.
- **Express.js API (`server.js`)**:
  - REST endpoints for contacts, SOS distress logging, constitutional rights, safe havens, reverse geocoding, and AI chat.

### 6. 🚨 Interactive Hardware & Safety Tools
- **Microphone Audio Evidence Recorder**: Uses `MediaRecorder` to capture ambient audio, displaying recording timer and providing a **Download Legal Evidence (.webm)** button.
- **Dual-Tone Loud Emergency Siren**: Oscillates between 750 Hz and 1150 Hz using the Web Audio API.
- **Emergency Strobe Light**: High-intensity flashing screen to disorient attackers.
- **Fake Call Simulator**: Realistic phone ringtone and simulated voice prompt (*"Where are you? The police patrol is waiting for you outside, come out right now."*) to excuse oneself from dangerous situations.
- **Motion Sensor (Shake SOS)**: Triggers SOS when the phone is shaken vigorously 3 times.

---

## 🛠️ Getting Started

### 1. Start the Server
```bash
npm start
```
The server will start on `http://localhost:3000`.

### 2. Open in Browser
Visit:
```
http://localhost:3000
```

---

## 📡 REST API Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Backend status & database check |
| `GET` | `/api/contacts` | Retrieve all trusted guardians |
| `POST` | `/api/contacts` | Add new guardian (`name`, `phone`, `relation`) |
| `PUT` | `/api/contacts/:id` | Update guardian details |
| `DELETE` | `/api/contacts/:id` | Delete guardian from database |
| `POST` | `/api/sos/trigger` | Trigger panic alert and dispatch payloads to guardians & helplines |
| `POST` | `/api/sos/cancel` | Mark active SOS alert as resolved in database |
| `GET` | `/api/rights` | Retrieve women's constitutional rights & legal provisions |
| `POST` | `/api/ai/chat` | Query AURA AI safety assistant |
| `GET` | `/api/ai/chat/history`| Retrieve chat history |
| `DELETE` | `/api/ai/chat/history`| Clear chat history |
| `POST` | `/api/ai/scan-threat`| Audit text for cyber threats and legal violations |
| `GET` | `/api/places` | List verified nearby safe havens |
| `GET` | `/api/geocode/reverse`| Reverse geocode coordinates to street address |
| `GET` / `POST` | `/api/settings` | Get/Set preferences and Gemini API key |
# NeuralShield-SOS
