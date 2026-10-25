const { settingsDao } = require('./db.js');

// Built-in Knowledge Base for AURA Safety Intelligence
const SAFETY_KNOWLEDGE = [
    {
        keywords: ['following', 'follow', 'behind me', 'stalking me', 'someone behind', 'creep', 'walking alone', 'dark road', 'shadow'],
        title: "Immediate Action: You are being followed",
        reply: `⚠️ **IMMEDIATE ESCAPE PROTOCOL:**
1. **Change Direction & Pace:** Cross the street immediately to confirm if they change direction too.
2. **Head to Lit Public Havens:** Walk straight into any open shop, pharmacy, petrol pump, or restaurant. Do not head into an isolated home or dead-end alley.
3. **Make Active Noise:** Call a trusted guardian or pretend you are on speakerphone saying: *"I am 20 seconds away from the police booth at the corner, see you right now."*
4. **Trigger SafeHer SOS:** Tap the red SOS button immediately. Your live coordinates will be broadcast to all your guardians.
5. **Call Police 112:** If the threat persists, dial **112** without hesitation.`
    },
    {
        keywords: ['cab', 'taxi', 'uber', 'ola', 'auto', 'driver', 'route', 'wrong way', 'diversion', 'door locked', 'child lock'],
        title: "Cab / Transit Emergency",
        reply: `🚕 **IN-CAB SAFETY PROTOCOL:**
1. **Demand to Stop Immediately:** Speak firmly: *"Stop the cab here, I need to get down immediately."*
2. **Check Child Locks:** If rear doors won't open, reach forward to the front passenger door or lower the window and shout for help at the next signal.
3. **Share Live Trip:** Share your live Google Maps ride link with guardians right now via WhatsApp.
4. **Dial Emergency 112:** Call 112 on speakerphone immediately and state aloud: *"I am in cab vehicle number [Speak Registration Number aloud], driver is deviating from route."* Drivers almost always comply once they realize police are listening.`
    },
    {
        keywords: ['self defense', 'attack', 'grab', 'grabbed', 'punch', 'kick', 'pepper spray', 'defend', 'physical fight', 'knife', 'choke'],
        title: "Practical Self-Defense Techniques",
        reply: `🥋 **EFFECTIVE VITAL TARGET STRIKES:**
1. **Eyes & Throat (Highest Impact):** Open-palm strike or gouge toward the attacker's eyes or throat notch. This triggers involuntary choking and eye closure.
2. **Groin Kick / Knee Strike:** If facing attacker, drive your knee upward into the groin with your full hip weight.
3. **Instep Stomp:** If grabbed from behind, bring your heel down with full force onto the attacker's instep/toes, then drive your elbow backward into their solar plexus.
4. **Everyday Weaponry:** Hold house or car keys protruding between your knuckles. Aim for the bridge of the nose or collarbone.
5. **Escape Objective:** Your goal is NOT to win a prolonged fight — strike once with 100% force and sprint toward crowds screaming *"POLICE!"* rather than just scream.`
    },
    {
        keywords: ['rights', 'legal', 'law', 'bns', 'ipc', 'police', 'fir', 'zero fir', 'arrest', 'sunset', 'night', 'station'],
        title: "Legal Rights for Women in India",
        reply: `⚖️ **YOUR LEGAL SAFEGUARDS UNDER INDIAN LAW (BNS & BNSS):**
1. **Zero FIR Right:** Under Section 173 BNSS, any police station MUST register your FIR regardless of where the incident occurred. They cannot turn you away.
2. **Arrest After Sunset Prohibited:** Under Section 43(5) BNSS / CrPC 46(4), a woman **cannot be arrested between sunset and sunrise** except under exceptional circumstances with prior written permission of a Judicial Magistrate and in the presence of a female officer.
3. **Virtual / Online FIR:** Under BNS, complaints of sexual harassment, stalking (BNS Section 78), or cyber voyeurism (BNS Section 77) can be registered online or via registered post/email.
4. **Free Legal Aid:** Every woman has the constitutional right to free legal representation provided by the Legal Services Authority.
5. **Right to Confidentiality:** Disclosing the identity of a survivor of assault is a criminal offense under BNS Section 72.`
    },
    {
        keywords: ['domestic', 'husband', 'in laws', 'family', 'beat', 'beating', 'violence at home', 'abusive partner', 'slap', 'abuse'],
        title: "Domestic Violence Emergency Support",
        reply: `🛡️ **DOMESTIC VIOLENCE INTERVENTION & LEGAL AID:**
1. **Call Women Helpline 181:** National toll-free 24/7 helpline dedicated to domestic abuse, offering immediate police intervention, shelter, and counseling.
2. **Protection Officers & Sakhi One Stop Centres:** Under the Domestic Violence Act, you can seek free emergency shelter, medical aid, and legal orders (Protection Order & Residence Order).
3. **Preserve Evidence:** Document dates, times, photographs of bruises or injuries, hospital prescriptions, audio/video recordings, and threatening text messages.
4. **Emergency Rescue:** If in imminent bodily danger inside the house, call **112** for emergency police dispatch.`
    },
    {
        keywords: ['blackmail', 'morph', 'nude', 'photo', 'video', 'leak', 'private', 'extortion', 'threaten to send', 'ruin reputation', 'instagram', 'whatsapp', 'cyber'],
        title: "Cyber Blackmail & Non-Consensual Image Threat",
        reply: `🚨 **CYBER BLACKMAIL CRISIS PROTOCOL:**
1. **DO NOT PAY OR COMPLY:** Blackmailers never delete files after payment; extortion always escalates. Cut off communication.
2. **Preserve Digital Evidence:** Take uncropped screenshots showing phone numbers, Instagram handles, URLs, and exact timestamps.
3. **StopNCII.org Protection:** Visit **stopncii.org** (Stop Non-Consensual Intimate Image Abuse) to generate digital hashes of your photos to stop them from being uploaded across Meta platforms.
4. **Lodge Cyber Complaint:** File an immediate report on **cybercrime.gov.in** or call **1930** (National Cyber Fraud/Crime Helpline).
5. **Applicable Laws:** BNS Section 77 (Voyeurism - up to 3 years jail), BNS Section 308 (Extortion), and IT Act Section 66E/67A.`
    },
    {
        keywords: ['hello', 'hi', 'hey', 'aura', 'who are you', 'help me', 'start'],
        title: "Welcome to AURA",
        reply: `Hello! I am **AURA**, your 24/7 AI Women Safety Guardian & Legal Advisor.

Here is how I can protect and guide you right now:
• 📍 **Instant Panic Protocols** (If you're being followed, stranded, or in an unsafe cab)
• ⚖️ **Legal Rights & Laws** (Zero FIR, BNS sections, arrest rules for women)
• 🥋 **High-Impact Self Defense** (Escapes from grabs, chokes, and vital targets)
• 🔍 **Threat Scanner** (Analyze threatening messages, blackmail, or cyberstalking)
• 🚨 **Helpline Access** (Immediate dispatch to 112, 1091, 181, 1930)

How can I assist you right now?`
    }
];

// Fallback generative response builder for general queries
function generateAuraFallback(query) {
    const qLower = query.toLowerCase();

    // Check knowledge base matches
    for (const item of SAFETY_KNOWLEDGE) {
        if (item.keywords.some(kw => qLower.includes(kw))) {
            return item.reply;
        }
    }

    // Contextual intelligent response
    return `🛡️ **AURA Safety Guidance:**
Regarding your concern: "${query.substring(0, 70)}..."

• **Immediate Precaution:** If you are currently in an active or uncertain situation, move toward a well-lit, public location with CCTV or foot traffic immediately.
• **Guardians & Tracking:** Trigger the **SafeHer SOS Panic Button** to share live GPS coordinates with your emergency contacts.
• **Official Helpline Numbers:**
  - National Emergency Police: **112**
  - Women Helpline (24/7): **1091**
  - Cyber Crime Helpline: **1930**
  - Domestic Violence Helpline: **181**

If you face physical intimidation, online blackmail, or legal doubts, please ask me specifically and I will outline your rights under Indian Law (BNS & IT Act).`;
}

// Call Google Gemini API if key is present
async function queryGemini(prompt, systemInstruction = null) {
    const envKey = process.env.GEMINI_API_KEY;
    const dbKey = settingsDao.get('gemini_api_key');
    const apiKey = envKey || dbKey;

    if (!apiKey) {
        return null;
    }

    const defaultSystem = "You are AURA, an emergency women safety AI companion built for team Neural Ninjas-4. Provide concise, direct, supportive, and actionable safety guidance, self-defense tactics, Indian emergency numbers (112, 1091, 181, 1930), and legal rights under Bharatiya Nyaya Sanhita (BNS) and IT Act. Keep response structured with markdown bullet points and under 150 words.";

    const sysText = systemInstruction || defaultSystem;

    // Use gemini-2.5-flash or gemini-1.5-flash
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    const body = {
        contents: [{ parts: [{ text: prompt }] }],
        systemInstruction: { parts: [{ text: sysText }] }
    };

    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    });

    if (!response.ok) {
        const errText = await response.text();
        console.warn('Gemini API returned error status:', response.status, errText);
        return null;
    }

    const data = await response.json();
    if (data.candidates && data.candidates[0]?.content?.parts[0]?.text) {
        return data.candidates[0].content.parts[0].text;
    }
    return null;
}

// Main AI Chat Handler
async function getAIChatResponse(userMessage) {
    try {
        const geminiResult = await queryGemini(userMessage);
        if (geminiResult) {
            return geminiResult;
        }
    } catch (err) {
        console.warn('Gemini call failed, using built-in NLP engine:', err.message);
    }

    // Seamless fallback to AURA internal knowledge engine
    return generateAuraFallback(userMessage);
}

// Threat & Harassment Scanner
async function analyzeCyberThreat(inputText) {
    if (!inputText || !inputText.trim()) {
        return {
            threat_level: "LOW / SAFE",
            threat_score: 5,
            legal_sections: "N/A",
            analysis: "No text provided for analysis.",
            action_plan: ["Enter message text to audit."]
        };
    }

    const text = inputText.toLowerCase();

    // Check if Gemini can analyze it with structured output
    try {
        const prompt = `Analyze this message sent to a woman for cyber safety threats, extortion, morphing, stalking, or harassment:
"${inputText}"

Return ONLY valid JSON matching this schema:
{
  "threat_level": "HIGH THREAT" | "MEDIUM THREAT" | "LOW / SAFE",
  "threat_score": number (0-100),
  "legal_sections": "string listing Indian BNS / IPC / IT Act sections",
  "analysis": "2 sentence clear analysis",
  "action_plan": ["step 1", "step 2", "step 3"]
}`;

        const geminiResult = await queryGemini(prompt, "You are an expert Indian Cyber Crime and Women Safety forensic analyst. Output strict JSON only.");
        if (geminiResult) {
            const cleanJson = geminiResult.replace(/```json/g, '').replace(/```/g, '').trim();
            const parsed = JSON.parse(cleanJson);
            return parsed;
        }
    } catch (e) {
        console.warn('Gemini threat analysis fallback to local evaluator');
    }

    // Built-in Forensic Threat Engine
    let threatScore = 10;
    let threatLevel = "LOW / SAFE";
    let legalSections = "IT Act General Netiquette";
    let analysis = "The text does not show apparent threatening, coercive, or sexually abusive indicators.";
    let actionPlan = [
        "Normal communication detected. No immediate cyber legal action needed.",
        "Always practice digital privacy hygiene and never share sensitive OTPs or personal credentials."
    ];

    const highThreatKeywords = [
        'kill', 'rape', 'murder', 'acid', 'leak', 'morph', 'nude', 'photos', 'video',
        'ruin', 'destroy you', 'blackmail', 'extort', 'ransom', 'pay money', 'expose',
        'viral', 'post online', 'wait outside', 'slit', 'stab', 'die', 'dead'
    ];

    const mediumThreatKeywords = [
        'stalk', 'following you', 'know where you live', 'watch you', 'unblock',
        'why not picking up', 'meet me or else', 'regret', 'answer me', 'dare you',
        'bitch', 'slut', 'whore', 'bastard', 'harass', 'tracking you'
    ];

    let highMatches = highThreatKeywords.filter(kw => text.includes(kw));
    let medMatches = mediumThreatKeywords.filter(kw => text.includes(kw));

    if (highMatches.length > 0) {
        threatScore = Math.min(99, 85 + highMatches.length * 5);
        threatLevel = "HIGH THREAT";
        legalSections = "BNS Section 77 (Voyeurism), BNS Section 78 (Stalking), BNS Section 308 (Extortion), BNS Section 351 (Criminal Intimidation), IT Act 66E/67A";
        analysis = `CRITICAL THREAT DETECTED: Message contains severe coercion, intimidation, or non-consensual media/violence threats (${highMatches.slice(0, 3).join(', ')}).`;
        actionPlan = [
            "DO NOT delete the chat or call logs — take high-resolution screenshots with timestamps and caller ID visible.",
            "DO NOT negotiate, pay money, or reply to the perpetrator. Extortion feeds on compliance.",
            "File an urgent incident report immediately on the National Cyber Crime Portal (cybercrime.gov.in) or call 1930.",
            "Approach the nearest police station to lodge a Zero FIR under BNS Sections 77/78/308 and IT Act 66E."
        ];
    } else if (medMatches.length > 0) {
        threatScore = Math.min(75, 55 + medMatches.length * 7);
        threatLevel = "MEDIUM THREAT";
        legalSections = "BNS Section 78 (Cyber Stalking & Electronic Harassment), BNS Section 79 (Outraging Modesty)";
        analysis = `PERSISTENT HARASSMENT DETECTED: Text exhibits obsessive monitoring, stalking, abusive slurs, or boundary violations (${medMatches.slice(0, 2).join(', ')}).`;
        actionPlan = [
            "Explicitly text once: 'Do not contact me again. Any further messages will be forwarded to the Cyber Police.'",
            "Archive full chat backup and block caller across all telephone and social platforms.",
            "If communication continues via new numbers, register a cyber stalking complaint at 1930 or local women police cell (1091)."
        ];
    }

    return {
        threat_level: threatLevel,
        threat_score: threatScore,
        legal_sections: legalSections,
        analysis: analysis,
        action_plan: actionPlan
    };
}

module.exports = {
    getAIChatResponse,
    analyzeCyberThreat
};
