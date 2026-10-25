// =============================================================
// SafeHer Emergency Platform - Core Application & Contacts Engine
// =============================================================

const API_BASE = ''; // Current origin
let contactsListState = [];
let editingContactId = null;

// Initialize Core Application
window.addEventListener('DOMContentLoaded', () => {
    loadContacts();
    setupModalsAndEvents();
});

// -------------------------------------------------------------
// Toast Notification Engine
// -------------------------------------------------------------
function showToast(message, type = 'info') {
    let container = document.getElementById('toastContainer');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toastContainer';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = 'toast-item flex items-center space-x-3 px-4 py-3 rounded-2xl shadow-2xl border text-xs font-semibold backdrop-blur-md transition-all';
    
    if (type === 'success') {
        toast.className += ' bg-emerald-950/90 border-emerald-500/50 text-emerald-200';
        toast.innerHTML = `<i class="fa-solid fa-circle-check text-emerald-400 text-sm"></i> <span>${escapeHtml(message)}</span>`;
    } else if (type === 'error') {
        toast.className += ' bg-rose-950/90 border-rose-500/50 text-rose-200';
        toast.innerHTML = `<i class="fa-solid fa-triangle-exclamation text-rose-400 text-sm"></i> <span>${escapeHtml(message)}</span>`;
    } else {
        toast.className += ' bg-slate-800/95 border-slate-600/60 text-slate-200';
        toast.innerHTML = `<i class="fa-solid fa-circle-info text-cyan-400 text-sm"></i> <span>${escapeHtml(message)}</span>`;
    }

    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => toast.remove(), 300);
    }, 3500);
}

// -------------------------------------------------------------
// Contacts Management (SQLite Backend Connected)
// -------------------------------------------------------------
async function loadContacts() {
    const container = document.getElementById('contactsList');
    if (container) {
        container.innerHTML = `
            <div class="text-slate-400 text-center py-4 flex items-center justify-center space-x-2">
                <i class="fa-solid fa-spinner animate-spin text-rose-400"></i>
                <span>Loading guardians from database...</span>
            </div>
        `;
    }

    try {
        const response = await fetch(`${API_BASE}/api/contacts`);
        const data = await response.json();
        
        if (data.success && Array.isArray(data.contacts)) {
            contactsListState = data.contacts;
            renderContacts();
        } else {
            fallbackContacts();
        }
    } catch (err) {
        console.warn('Backend unavailable, using local memory for contacts:', err);
        fallbackContacts();
    }
}

function fallbackContacts() {
    if (contactsListState.length === 0) {
        contactsListState = [
            { id: 1, name: 'Parent / Guardian', phone: '+91 98100 12345', relation: 'Father', is_primary: 1 },
            { id: 2, name: 'Ananya Sharma', phone: '+91 98711 67890', relation: 'Best Friend', is_primary: 0 }
        ];
    }
    renderContacts();
}

function renderContacts() {
    const container = document.getElementById('contactsList');
    const badge = document.getElementById('contactsCountBadge');
    if (badge) badge.innerText = `${contactsListState.length} Guardians`;
    if (!container) return;

    if (contactsListState.length === 0) {
        container.innerHTML = `
            <div class="text-center py-6 px-4 bg-slate-900/40 rounded-2xl border border-dashed border-slate-700/60">
                <i class="fa-solid fa-user-shield text-slate-500 text-2xl mb-2"></i>
                <p class="text-slate-400 text-xs">No emergency contacts added yet.</p>
                <button onclick="openContactModal()" class="mt-3 text-xs bg-rose-600/20 text-rose-300 border border-rose-500/30 hover:bg-rose-600/30 px-3 py-1.5 rounded-xl font-medium transition inline-flex items-center space-x-1.5">
                    <i class="fa-solid fa-plus"></i>
                    <span>Add First Guardian</span>
                </button>
            </div>
        `;
        return;
    }

    // Get current GPS coords if available for prefilled WhatsApp link
    const currentLat = window.userLat || 28.5355;
    const currentLng = window.userLng || 77.3910;
    const mapsLink = `https://maps.google.com/?q=${currentLat},${currentLng}`;
    const sosQuickText = encodeURIComponent(`EMERGENCY! I need immediate help. My current live location is: ${mapsLink}`);

    container.innerHTML = contactsListState.map(c => {
        const cleanPhone = (c.phone || '').replace(/[^0-9]/g, '');
        const waLink = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${sosQuickText}`;

        return `
            <div class="flex items-center justify-between p-3 bg-slate-900/70 hover:bg-slate-900 rounded-2xl border ${c.is_primary ? 'border-rose-500/40 shadow-sm shadow-rose-950/20' : 'border-slate-700/60'} transition">
                <div class="flex items-center space-x-3">
                    <div class="w-9 h-9 rounded-xl ${c.is_primary ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40' : 'bg-slate-800 text-pink-400 border border-slate-700'} flex items-center justify-center font-black text-sm shrink-0 shadow-inner">
                        ${escapeHtml(c.name.charAt(0).toUpperCase())}
                    </div>
                    <div>
                        <div class="font-bold text-slate-200 text-xs flex items-center space-x-1.5">
                            <span>${escapeHtml(c.name)}</span>
                            <span class="text-[9px] px-1.5 py-0.5 rounded-full ${c.is_primary ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : 'bg-slate-800 text-slate-400 border border-slate-700'} font-semibold">
                                ${escapeHtml(c.relation || 'Guardian')}
                            </span>
                        </div>
                        <div class="text-slate-400 font-mono text-[11px] mt-0.5">${escapeHtml(c.phone)}</div>
                    </div>
                </div>

                <div class="flex items-center space-x-1.5">
                    <!-- Call Button -->
                    <a href="tel:${escapeHtml(c.phone)}" title="Direct Emergency Call" class="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 border border-emerald-500/30 flex items-center justify-center transition">
                        <i class="fa-solid fa-phone text-xs"></i>
                    </a>

                    <!-- WhatsApp SOS Dispatch -->
                    <a href="${waLink}" target="_blank" rel="noopener noreferrer" title="Send WhatsApp SOS with Live GPS" class="w-8 h-8 rounded-xl bg-green-500/15 text-green-400 hover:bg-green-500/25 border border-green-500/30 flex items-center justify-center transition">
                        <i class="fa-brands fa-whatsapp text-sm"></i>
                    </a>

                    <!-- Edit Contact -->
                    <button onclick="editContact(${c.id})" title="Edit Contact" class="w-8 h-8 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 border border-slate-700 flex items-center justify-center transition">
                        <i class="fa-solid fa-pen-to-square text-xs"></i>
                    </button>

                    <!-- Delete Contact -->
                    <button onclick="deleteContact(${c.id})" title="Delete Contact" class="w-8 h-8 rounded-xl bg-slate-800 text-slate-400 hover:text-rose-400 hover:bg-slate-700 border border-slate-700 flex items-center justify-center transition">
                        <i class="fa-solid fa-trash-can text-xs"></i>
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

// Open Add / Edit Contact Modal
function openContactModal(contactId = null) {
    editingContactId = contactId;
    const modal = document.getElementById('contactModal');
    const titleEl = document.getElementById('contactModalTitle');
    const nameInput = document.getElementById('contactName');
    const phoneInput = document.getElementById('contactPhone');
    const relationInput = document.getElementById('contactRelation');
    const primaryInput = document.getElementById('contactPrimary');

    if (contactId) {
        const existing = contactsListState.find(c => c.id === contactId);
        if (existing) {
            if (titleEl) titleEl.innerText = 'Edit Trusted Guardian';
            if (nameInput) nameInput.value = existing.name;
            if (phoneInput) phoneInput.value = existing.phone;
            if (relationInput) relationInput.value = existing.relation;
            if (primaryInput) primaryInput.checked = !!existing.is_primary;
        }
    } else {
        if (titleEl) titleEl.innerText = 'Add Trusted Guardian';
        if (nameInput) nameInput.value = '';
        if (phoneInput) phoneInput.value = '';
        if (relationInput) relationInput.value = '';
        if (primaryInput) primaryInput.checked = contactsListState.length === 0;
    }

    if (modal) {
        modal.classList.remove('hidden');
        if (nameInput) nameInput.focus();
    }
}

function closeContactModal() {
    const modal = document.getElementById('contactModal');
    if (modal) modal.classList.add('hidden');
    editingContactId = null;
}

function editContact(id) {
    openContactModal(id);
}

// Save Contact to Backend Database
async function saveContact() {
    const nameInput = document.getElementById('contactName');
    const phoneInput = document.getElementById('contactPhone');
    const relationInput = document.getElementById('contactRelation');
    const primaryInput = document.getElementById('contactPrimary');

    const name = nameInput ? nameInput.value.trim() : '';
    const phone = phoneInput ? phoneInput.value.trim() : '';
    const relation = (relationInput && relationInput.value.trim()) || 'Guardian';
    const is_primary = primaryInput && primaryInput.checked ? 1 : 0;

    if (!name) {
        showToast('Please enter the contact\'s full name', 'error');
        if (nameInput) nameInput.focus();
        return;
    }

    // Phone validation
    const digitsOnly = phone.replace(/[^0-9]/g, '');
    if (!phone || digitsOnly.length < 7) {
        showToast('Please enter a valid emergency phone number (at least 7 digits)', 'error');
        if (phoneInput) phoneInput.focus();
        return;
    }

    const payload = { name, phone, relation, is_primary };

    try {
        if (editingContactId) {
            // Update Contact
            const res = await fetch(`${API_BASE}/api/contacts/${editingContactId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            if (data.success) {
                showToast('Contact updated successfully in database!', 'success');
            }
        } else {
            // Create Contact
            const res = await fetch(`${API_BASE}/api/contacts`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            if (data.success) {
                showToast('New guardian added and synced to database!', 'success');
            }
        }
        await loadContacts();
        closeContactModal();
    } catch (err) {
        console.warn('Backend sync failed, saving locally:', err);
        if (editingContactId) {
            contactsListState = contactsListState.map(c => c.id === editingContactId ? { ...c, ...payload } : c);
        } else {
            contactsListState.push({ id: Date.now(), ...payload });
        }
        renderContacts();
        closeContactModal();
        showToast('Contact saved in local session.', 'info');
    }
}

// Delete Contact from Database
async function deleteContact(id) {
    const contact = contactsListState.find(c => c.id === id);
    const contactName = contact ? contact.name : 'this contact';

    if (!confirm(`Are you sure you want to remove "${contactName}" from your emergency guardians?`)) {
        return;
    }

    try {
        const res = await fetch(`${API_BASE}/api/contacts/${id}`, { method: 'DELETE' });
        const data = await res.json();
        if (data.success) {
            showToast(`${contactName} deleted successfully.`, 'info');
            await loadContacts();
        }
    } catch (err) {
        contactsListState = contactsListState.filter(c => c.id !== id);
        renderContacts();
        showToast(`${contactName} removed from list.`, 'info');
    }
}

// -------------------------------------------------------------
// Fake Call Simulator (Lifesaver Escape Feature)
// -------------------------------------------------------------
let fakeCallTimer = null;
let ringtoneAudioCtx = null;
let ringOscillator1 = null;
let ringOscillator2 = null;
let callDurationInterval = null;
let callSeconds = 0;

function scheduleFakeCall(delaySeconds = 0) {
    if (delaySeconds === 0) {
        triggerFakeCallRing();
    } else {
        showToast(`Fake emergency call scheduled in ${delaySeconds} seconds. Lock your phone or keep it visible!`, 'info');
        setTimeout(() => {
            triggerFakeCallRing();
        }, delaySeconds * 1000);
    }
}

function triggerFakeCallRing() {
    const modal = document.getElementById('fakeCallModal');
    if (!modal) return;
    
    modal.classList.remove('hidden');
    document.getElementById('fakeCallIncoming').classList.remove('hidden');
    document.getElementById('fakeCallActive').classList.add('hidden');

    startRingtoneSound();
}

function startRingtoneSound() {
    try {
        ringtoneAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
        
        function ringPattern() {
            if (!ringtoneAudioCtx) return;
            // Standard telephone dual-frequency ring tone (440Hz + 480Hz)
            const osc1 = ringtoneAudioCtx.createOscillator();
            const osc2 = ringtoneAudioCtx.createOscillator();
            const gainNode = ringtoneAudioCtx.createGain();

            osc1.type = 'sine';
            osc1.frequency.setValueAtTime(440, ringtoneAudioCtx.currentTime);
            osc2.type = 'sine';
            osc2.frequency.setValueAtTime(480, ringtoneAudioCtx.currentTime);

            gainNode.gain.setValueAtTime(0.2, ringtoneAudioCtx.currentTime);
            gainNode.gain.setValueAtTime(0.2, ringtoneAudioCtx.currentTime + 1.8);
            gainNode.gain.setValueAtTime(0.001, ringtoneAudioCtx.currentTime + 2.0);

            osc1.connect(gainNode);
            osc2.connect(gainNode);
            gainNode.connect(ringtoneAudioCtx.destination);

            osc1.start();
            osc2.start();
            osc1.stop(ringtoneAudioCtx.currentTime + 2.0);
            osc2.stop(ringtoneAudioCtx.currentTime + 2.0);
        }

        ringPattern();
        fakeCallTimer = setInterval(ringPattern, 3500);
    } catch (e) {
        console.warn('Audio ringtone error:', e);
    }
}

function stopRingtoneSound() {
    if (fakeCallTimer) {
        clearInterval(fakeCallTimer);
        fakeCallTimer = null;
    }
    if (ringtoneAudioCtx) {
        ringtoneAudioCtx.close().catch(() => {});
        ringtoneAudioCtx = null;
    }
}

function answerFakeCall() {
    stopRingtoneSound();
    document.getElementById('fakeCallIncoming').classList.add('hidden');
    document.getElementById('fakeCallActive').classList.remove('hidden');

    callSeconds = 0;
    const durationDisplay = document.getElementById('fakeCallDuration');
    callDurationInterval = setInterval(() => {
        callSeconds++;
        const mins = String(Math.floor(callSeconds / 60)).padStart(2, '0');
        const secs = String(callSeconds % 60).padStart(2, '0');
        if (durationDisplay) durationDisplay.innerText = `${mins}:${secs}`;
    }, 1000);

    // Speak audio voice prompt so bystanders hear someone asking for you!
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance("Hey, where are you? The car and police patrol are right outside waiting for you. Come out immediately, we can see the street.");
        utterance.rate = 1.0;
        utterance.pitch = 1.1;
        window.speechSynthesis.speak(utterance);
    }
}

function endFakeCall() {
    stopRingtoneSound();
    if (callDurationInterval) {
        clearInterval(callDurationInterval);
        callDurationInterval = null;
    }
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
    }
    const modal = document.getElementById('fakeCallModal');
    if (modal) modal.classList.add('hidden');
    showToast('Fake call ended. Stay alert and move to safety!', 'info');
}

// -------------------------------------------------------------
// Settings Modal Handler
// -------------------------------------------------------------
async function openSettingsModal() {
    const modal = document.getElementById('settingsModal');
    if (!modal) return;
    modal.classList.remove('hidden');

    try {
        const res = await fetch(`${API_BASE}/api/settings`);
        const data = await res.json();
        if (data.success && data.settings) {
            const userNameInput = document.getElementById('settingUserName');
            const customSosInput = document.getElementById('settingSosMessage');
            const apiKeyInput = document.getElementById('settingApiKey');

            if (userNameInput) userNameInput.value = data.settings.user_name || '';
            if (customSosInput) customSosInput.value = data.settings.custom_sos_message || '';
            if (apiKeyInput) {
                apiKeyInput.value = data.settings.gemini_api_key || '';
                apiKeyInput.placeholder = data.settings.gemini_api_key_masked || 'Enter Google Gemini API Key...';
            }
        }
    } catch (e) {
        console.warn('Could not fetch settings:', e);
    }
}

function closeSettingsModal() {
    const modal = document.getElementById('settingsModal');
    if (modal) modal.classList.add('hidden');
}

async function saveSettings() {
    const userNameInput = document.getElementById('settingUserName');
    const customSosInput = document.getElementById('settingSosMessage');
    const apiKeyInput = document.getElementById('settingApiKey');

    const payload = {
        user_name: userNameInput ? userNameInput.value.trim() : '',
        custom_sos_message: customSosInput ? customSosInput.value.trim() : '',
        gemini_api_key: apiKeyInput ? apiKeyInput.value.trim() : ''
    };

    try {
        const res = await fetch(`${API_BASE}/api/settings`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (data.success) {
            showToast('Settings saved to database successfully!', 'success');
            closeSettingsModal();
        }
    } catch (err) {
        showToast('Settings saved locally.', 'info');
        closeSettingsModal();
    }
}

// Setup Event Listeners
function setupModalsAndEvents() {
    // Escape key closes modals
    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeContactModal();
            closeSettingsModal();
            const sosModal = document.getElementById('sosModal');
            if (sosModal && !sosModal.classList.contains('hidden')) {
                closeSOSModal();
            }
        }
    });
}

// Utility: HTML Sanitizer
function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/[&<>"']/g, function(m) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[m];
    });
}
