// =============================================================
// SafeHer - AURA AI Safety Assistant & Threat Scanner Engine
// =============================================================

let isSpeechRecognitionActive = false;
let speechRecognizer = null;

window.addEventListener('DOMContentLoaded', () => {
    initAIChatHistory();
    initSpeechRecognition();
});

// -------------------------------------------------------------
// AI Threat & Harassment Scanner (Forensics & Legal Advisory)
// -------------------------------------------------------------
async function scanThreatMessage() {
    const textInput = document.getElementById('threatInput');
    const text = textInput ? textInput.value.trim() : '';

    if (!text) {
        showToast('Please paste or type a suspicious message to analyze.', 'error');
        if (textInput) textInput.focus();
        return;
    }

    const box = document.getElementById('threatResultBox');
    const levelTag = document.getElementById('threatLevelTag');
    const adviceText = document.getElementById('threatAdviceText');
    const scoreBar = document.getElementById('threatScoreBar');
    const scoreVal = document.getElementById('threatScoreValue');
    const legalTag = document.getElementById('threatLegalTag');
    const actionPlanList = document.getElementById('threatActionPlan');
    const scanBtn = document.getElementById('scanThreatBtn');

    if (box) box.classList.remove('hidden');
    if (levelTag) {
        levelTag.className = 'font-bold text-purple-400 flex items-center space-x-1.5';
        levelTag.innerHTML = `<i class="fa-solid fa-spinner animate-spin"></i> <span>AURA AI Forensic Audit in progress...</span>`;
    }
    if (adviceText) adviceText.innerText = "Analyzing text patterns against Indian Penal Law (BNS), IT Act 66E/67, and cyber harassment indicators...";
    if (scanBtn) scanBtn.disabled = true;

    try {
        const response = await fetch('/api/ai/scan-threat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text })
        });

        const data = await response.json();
        if (scanBtn) scanBtn.disabled = false;

        if (data.success && data.result) {
            const res = data.result;
            const score = res.threat_score || 50;

            if (scoreBar) {
                scoreBar.style.width = `${score}%`;
                scoreBar.className = score >= 75 ? 'h-full bg-rose-500 rounded-full transition-all duration-700' :
                                    score >= 40 ? 'h-full bg-amber-500 rounded-full transition-all duration-700' :
                                    'h-full bg-emerald-500 rounded-full transition-all duration-700';
            }
            if (scoreVal) scoreVal.innerText = `${score}% Risk`;

            if (res.threat_level === 'HIGH THREAT') {
                if (levelTag) {
                    levelTag.className = 'font-black text-rose-400 flex items-center space-x-1 text-sm';
                    levelTag.innerHTML = `<i class="fa-solid fa-triangle-exclamation text-rose-500 animate-pulse"></i> <span>CRITICAL THREAT DETECTED</span>`;
                }
            } else if (res.threat_level === 'MEDIUM THREAT') {
                if (levelTag) {
                    levelTag.className = 'font-black text-amber-400 flex items-center space-x-1 text-sm';
                    levelTag.innerHTML = `<i class="fa-solid fa-circle-exclamation text-amber-400"></i> <span>MODERATE HARASSMENT DETECTED</span>`;
                }
            } else {
                if (levelTag) {
                    levelTag.className = 'font-black text-emerald-400 flex items-center space-x-1 text-sm';
                    levelTag.innerHTML = `<i class="fa-solid fa-shield-check text-emerald-400"></i> <span>LOW / SAFE CONTENT</span>`;
                }
            }

            if (legalTag) {
                legalTag.innerText = res.legal_sections || 'IT Act & BNS Provisions';
            }

            if (adviceText) {
                adviceText.innerText = res.analysis || 'Analysis complete.';
            }

            if (actionPlanList && Array.isArray(res.action_plan)) {
                actionPlanList.innerHTML = res.action_plan.map(step => `
                    <li class="flex items-start space-x-2 text-slate-300">
                        <i class="fa-solid fa-arrow-right text-rose-400 mt-0.5 text-[10px] shrink-0"></i>
                        <span>${escapeHtml(step)}</span>
                    </li>
                `).join('');
            }

            // Store current scan result for one-click complaint generation
            window.lastThreatResult = { text, result: res };
            const draftBtn = document.getElementById('genDraftBtn');
            if (draftBtn) draftBtn.classList.remove('hidden');

            showToast(`Threat Scan Complete: ${res.threat_level}`, res.threat_level === 'HIGH THREAT' ? 'error' : 'info');
        } else {
            if (adviceText) adviceText.innerText = "Scan completed. If you feel harassed or in danger, immediately dial Cyber Helpline 1930 or Police 112.";
        }
    } catch (err) {
        if (scanBtn) scanBtn.disabled = false;
        console.warn('Threat scan error:', err);
        if (adviceText) adviceText.innerText = "Local safety check: If you are receiving threatening or abusive texts, do not delete them. Document screenshots and report to cybercrime.gov.in or dial 1930.";
    }
}

// 1-Click Sample Threat Messages for Quick Evaluation
function loadThreatSample(sampleType) {
    const input = document.getElementById('threatInput');
    if (!input) return;

    if (sampleType === 'blackmail') {
        input.value = "I have your morphed photos and videos. If you don't send 50,000 rupees to this UPI by tonight, I will leak them to all your Instagram followers and college groups!";
    } else if (sampleType === 'stalking') {
        input.value = "Why aren't you answering my calls? I saw you wearing the blue jacket today near Sector 62 metro. Unblock me right now or I will come to your house!";
    } else if (sampleType === 'safe') {
        input.value = "Hi Ananya! Hope you reached home safely. Let me know if you need the notes for tomorrow's class.";
    }
    scanThreatMessage();
}

// Generate Formal Cyber Complaint Draft
function generateCyberComplaintDraft() {
    if (!window.lastThreatResult) return;
    const { text, result } = window.lastThreatResult;
    const userLatStr = (window.userLat || 28.5355).toFixed(4);
    const userLngStr = (window.userLng || 77.3910).toFixed(4);
    const now = new Date().toLocaleString('en-IN');

    const draft = `FORMAL COMPLAINT OF ONLINE HARASSMENT & THREAT
Date & Time: ${now}
Jurisdiction Coordinates: Lat ${userLatStr}, Long ${userLngStr}
Applicable Legal Sections: ${result.legal_sections}
Threat Classification: ${result.threat_level} (${result.threat_score}% Risk)

Respected Cyber Crime Cell / Station House Officer,

I wish to lodge an urgent complaint regarding targeted cyber harassment and intimidation received via digital communications:

INCIDENT DETAILS & PERPETRATOR'S MESSAGE:
"${text}"

LEGAL ASSESSMENT:
The above message constitutes an offense of criminal intimidation, extortion, cyber stalking, and violation of bodily privacy under Bharatiya Nyaya Sanhita (BNS) Sections 77, 78, 308, and Information Technology Act Section 66E/67.

I request an immediate Zero FIR and tracing of the sender's IP and telecom credentials to safeguard my safety. All digital evidence and timestamped screenshots are preserved.

Submitted via SafeHer Emergency Safety System.`;

    navigator.clipboard.writeText(draft).then(() => {
        showToast('Official Cyber Crime Complaint Letter copied to clipboard! You can now paste into cybercrime.gov.in or email police.', 'success');
    }).catch(() => {
        alert(draft);
    });
}

// -------------------------------------------------------------
// AURA AI Chat Assistant
// -------------------------------------------------------------
async function initAIChatHistory() {
    try {
        const res = await fetch('/api/ai/chat/history');
        const data = await res.json();
        if (data.success && Array.isArray(data.history) && data.history.length > 0) {
            const chatBox = document.getElementById('chatBox');
            if (chatBox) chatBox.innerHTML = '';
            data.history.forEach(item => {
                if (item.role === 'user') {
                    appendUserMessage(item.message, false);
                } else {
                    appendAIMessage(item.message, false);
                }
            });
        }
    } catch (e) {
        console.warn('Could not load chat history:', e);
    }
}

async function handleChatSubmit(e) {
    if (e) e.preventDefault();
    const inputEl = document.getElementById('userInput');
    const prompt = inputEl ? inputEl.value.trim() : '';
    if (!prompt) return;

    appendUserMessage(prompt);
    if (inputEl) inputEl.value = '';

    await sendToAuraAI(prompt);
}

function sendQuickPrompt(promptText) {
    appendUserMessage(promptText);
    sendToAuraAI(promptText);
}

async function sendToAuraAI(prompt) {
    const chatBox = document.getElementById('chatBox');
    const loadingId = 'loading-' + Date.now();

    chatBox.innerHTML += `
        <div id="${loadingId}" class="flex items-start space-x-2">
            <div class="w-7 h-7 rounded-xl bg-purple-600/30 text-purple-300 flex items-center justify-center text-xs shrink-0 mt-0.5 font-bold shadow-inner">
                <i class="fa-solid fa-robot"></i>
            </div>
            <div class="bg-slate-800/80 border border-slate-700/80 p-3 rounded-2xl text-slate-400 italic text-xs flex items-center space-x-2">
                <i class="fa-solid fa-spinner animate-spin text-purple-400"></i>
                <span>AURA is evaluating safety response...</span>
            </div>
        </div>
    `;
    chatBox.scrollTop = chatBox.scrollHeight;

    try {
        const response = await fetch('/api/ai/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: prompt })
        });

        const data = await response.json();
        document.getElementById(loadingId)?.remove();

        if (data.success && data.reply) {
            appendAIMessage(data.reply);
        } else {
            appendAIMessage("In an immediate safety crisis: Stay in lit public spots, trigger SafeHer SOS, and dial 112 (Police) or 1091 (Women Helpline)!");
        }
    } catch (err) {
        document.getElementById(loadingId)?.remove();
        console.warn('Chat error:', err);
        appendAIMessage("For urgent safety emergencies, please dial **National Emergency 112** or **Women Helpline 1091** right away!");
    }
}

function appendUserMessage(text, scroll = true) {
    const chatBox = document.getElementById('chatBox');
    if (!chatBox) return;

    chatBox.innerHTML += `
        <div class="flex items-start justify-end space-x-2">
            <div class="bg-gradient-to-tr from-rose-600 to-pink-600 text-white p-3 rounded-2xl rounded-tr-sm max-w-[85%] leading-relaxed shadow-md shadow-rose-950/20 text-xs">
                ${escapeHtml(text)}
            </div>
        </div>
    `;
    if (scroll) chatBox.scrollTop = chatBox.scrollHeight;
}

function appendAIMessage(markdownText, scroll = true) {
    const chatBox = document.getElementById('chatBox');
    if (!chatBox) return;

    const formattedHtml = formatMarkdownToHtml(markdownText);
    const msgId = 'msg-' + Date.now() + '-' + Math.floor(Math.random() * 1000);

    chatBox.innerHTML += `
        <div class="flex items-start space-x-2" id="${msgId}">
            <div class="w-7 h-7 rounded-xl bg-gradient-to-tr from-purple-600 to-pink-600 text-white flex items-center justify-center text-xs shrink-0 mt-0.5 font-bold shadow-md">
                <i class="fa-solid fa-shield-halved"></i>
            </div>
            <div class="bg-slate-800/90 border border-slate-700/80 p-3.5 rounded-2xl rounded-tl-sm text-slate-200 max-w-[88%] leading-relaxed text-xs shadow-md">
                <div class="prose-content">${formattedHtml}</div>
                <div class="flex items-center space-x-2 mt-2 pt-2 border-t border-slate-700/50 text-[10px] text-slate-400">
                    <button onclick="speakText('${encodeURIComponent(markdownText.replace(/[*#_`]/g, ''))}')" class="hover:text-purple-300 transition flex items-center space-x-1" title="Read Aloud">
                        <i class="fa-solid fa-volume-high"></i>
                        <span>Listen</span>
                    </button>
                    <span>•</span>
                    <button onclick="copyMessageText('${msgId}')" class="hover:text-purple-300 transition flex items-center space-x-1" title="Copy Guidance">
                        <i class="fa-regular fa-copy"></i>
                        <span>Copy</span>
                    </button>
                </div>
            </div>
        </div>
    `;
    if (scroll) chatBox.scrollTop = chatBox.scrollHeight;
}

// Simple Markdown to HTML Formatter
function formatMarkdownToHtml(text) {
    if (!text) return '';
    let res = text
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/`([^`]+)`/g, '<code class="bg-slate-900 px-1 py-0.5 rounded text-rose-300 font-mono">$1</code>')
        .replace(/^[•\-\*]\s+(.*)$/gm, '<li class="ml-3 list-disc">$1</li>')
        .replace(/\n\n/g, '<br><br>')
        .replace(/\n/g, '<br>');
    return res;
}

// Text-to-Speech (TTS)
function speakText(encodedText) {
    if (!('speechSynthesis' in window)) {
        showToast('Speech synthesis not supported in this browser.', 'error');
        return;
    }
    const cleanText = decodeURIComponent(encodedText);
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    window.speechSynthesis.speak(utterance);
    showToast('AURA speaking instructions aloud...', 'info');
}

// Copy Message Content
function copyMessageText(msgId) {
    const el = document.getElementById(msgId);
    if (!el) return;
    const text = el.querySelector('.prose-content').innerText;
    navigator.clipboard.writeText(text).then(() => {
        showToast('Safety instructions copied to clipboard!', 'success');
    });
}

// Voice Speech-to-Text Recognition
function initSpeechRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    speechRecognizer = new SpeechRecognition();
    speechRecognizer.continuous = false;
    speechRecognizer.interimResults = false;
    speechRecognizer.lang = 'en-IN';

    speechRecognizer.onstart = () => {
        isSpeechRecognitionActive = true;
        const micIcon = document.getElementById('chatMicIcon');
        if (micIcon) micIcon.className = 'fa-solid fa-microphone text-rose-400 animate-ping';
        showToast('Listening... Speak your emergency query clearly', 'info');
    };

    speechRecognizer.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        const inputEl = document.getElementById('userInput');
        if (inputEl) {
            inputEl.value = transcript;
            handleChatSubmit();
        }
    };

    speechRecognizer.onerror = (e) => {
        console.warn('Speech recognition error:', e.error);
        stopSpeechRecognition();
    };

    speechRecognizer.onend = () => {
        stopSpeechRecognition();
    };
}

function toggleVoiceInput() {
    if (!speechRecognizer) {
        showToast('Speech-to-text not available in this browser. Please type your message.', 'error');
        return;
    }
    if (isSpeechRecognitionActive) {
        speechRecognizer.stop();
        stopSpeechRecognition();
    } else {
        speechRecognizer.start();
    }
}

function stopSpeechRecognition() {
    isSpeechRecognitionActive = false;
    const micIcon = document.getElementById('chatMicIcon');
    if (micIcon) micIcon.className = 'fa-solid fa-microphone text-slate-400';
}

// Clear Chat History
async function clearChat() {
    if (!confirm('Are you sure you want to clear your conversation with AURA?')) return;
    try {
        await fetch('/api/ai/chat/history', { method: 'DELETE' });
        const chatBox = document.getElementById('chatBox');
        if (chatBox) {
            chatBox.innerHTML = `
                <div class="flex items-start space-x-2">
                    <div class="w-7 h-7 rounded-xl bg-gradient-to-tr from-purple-600 to-pink-600 text-white flex items-center justify-center text-xs shrink-0 mt-0.5 font-bold shadow-md">
                        <i class="fa-solid fa-shield-halved"></i>
                    </div>
                    <div class="bg-slate-800/90 border border-slate-700/80 p-3.5 rounded-2xl rounded-tl-sm text-slate-200 max-w-[85%] leading-relaxed text-xs">
                        Conversation reset. I am **AURA**, your 24/7 AI Women Safety Guardian. How can I protect you right now?
                    </div>
                </div>
            `;
        }
        showToast('Chat history cleared from database.', 'info');
    } catch (e) {
        console.warn('Could not clear chat:', e);
    }
}

// Utility: HTML Sanitizer
function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/[&<>"']/g, function(m) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[m];
    });
}
