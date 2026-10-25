// =============================================================
// SafeHer - Emergency SOS Panic Engine, Siren & Evidence Audio
// =============================================================

let audioCtx = null;
let sirenOscillator = null;
let sirenGainNode = null;
let sirenTimer = null;
let isSirenActive = false;

let isStrobeActive = false;

// Real MediaRecorder Audio Evidence
let mediaRecorder = null;
let audioChunks = [];
let isAudioRecording = false;
let audioRecordStartTime = 0;
let audioRecordTimerInterval = null;
let recordedAudioBlob = null;

// Accelerometer Shake Detection
let lastX = null, lastY = null, lastZ = null;
let shakeCount = 0;
let lastShakeTime = 0;

window.addEventListener('DOMContentLoaded', () => {
    initShakeSensor();
});

// -------------------------------------------------------------
// Emergency SOS Panic Dispatch (Backend Database Synced)
// -------------------------------------------------------------
async function triggerSOS() {
    const sosModal = document.getElementById('sosModal');
    if (sosModal) sosModal.classList.remove('hidden');

    const lat = window.userLat || 28.5355;
    const lng = window.userLng || 77.3910;
    const address = window.userAddress || "Near detected coordinates";
    const mapsUrl = `https://maps.google.com/?q=${lat},${lng}`;

    const modalSmsPayload = document.getElementById('modalSmsPayload');
    const modalGpsText = document.getElementById('modalGpsText');

    if (modalGpsText) {
        modalGpsText.innerHTML = `
            <div class="font-bold text-emerald-400 flex items-center space-x-1.5">
                <span class="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                <span>${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E</span>
            </div>
            <div class="text-[11px] text-slate-400 mt-0.5">${escapeHtml(address)}</div>
        `;
    }

    // Automatically fire loud siren & start evidence audio recording
    if (!isSirenActive) toggleSiren();
    if (!isAudioRecording) recordAudioEvidence();

    try {
        const response = await fetch('/api/sos/trigger', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                latitude: lat,
                longitude: lng,
                address: address,
                alert_type: 'panic_button'
            })
        });

        const data = await response.json();
        if (data.success) {
            if (modalSmsPayload) modalSmsPayload.innerText = data.sms_payload;
            window.activeSosAlertId = data.alert.id;
            window.lastSosDispatch = data;

            // Render WhatsApp One-Click Dispatch Buttons in Modal
            renderModalWhatsAppDispatch(data.whatsapp_links, data.sms_payload);
            showToast('EMERGENCY SOS LOGGED TO DATABASE & BROADCAST!', 'error');
        }
    } catch (err) {
        console.warn('Backend SOS trigger fallback:', err);
        const fallbackText = `EMERGENCY! I need immediate help at: ${mapsUrl}`;
        if (modalSmsPayload) modalSmsPayload.innerText = fallbackText;
    }
}

// Render Direct One-Click WhatsApp & SMS Dispatch Buttons in SOS Modal
function renderModalWhatsAppDispatch(links, smsPayload) {
    const container = document.getElementById('modalDispatchLinks');
    if (!container) return;

    if (!links || links.length === 0) {
        const generalWaUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(smsPayload)}`;
        container.innerHTML = `
            <a href="${generalWaUrl}" target="_blank" class="w-full py-2.5 px-4 bg-green-600 hover:bg-green-500 text-white rounded-xl font-bold text-xs flex items-center justify-center space-x-2 transition shadow-lg">
                <i class="fa-brands fa-whatsapp text-sm"></i>
                <span>Share SOS on WhatsApp</span>
            </a>
        `;
        return;
    }

    container.innerHTML = `
        <div class="text-[11px] font-bold text-slate-300 mb-1.5 flex items-center space-x-1">
            <i class="fa-brands fa-whatsapp text-green-400"></i>
            <span>Instant Guardian WhatsApp Dispatch:</span>
        </div>
        <div class="grid grid-cols-2 gap-2">
            ${links.map(l => `
                <a href="${l.url}" target="_blank" class="p-2 bg-green-600/20 border border-green-500/40 hover:bg-green-600/30 text-green-300 rounded-xl text-center text-xs font-semibold flex items-center justify-center space-x-1.5 transition">
                    <i class="fa-brands fa-whatsapp text-sm text-green-400"></i>
                    <span class="truncate">${escapeHtml(l.name)}</span>
                </a>
            `).join('')}
        </div>
    `;
}

// Close and Resolve SOS Alert
async function closeSOSModal() {
    const modal = document.getElementById('sosModal');
    if (modal) modal.classList.add('hidden');

    if (isSirenActive) toggleSiren();
    if (isStrobeActive) toggleFlashlight();

    try {
        await fetch('/api/sos/cancel', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: window.activeSosAlertId })
        });
        showToast('SOS Alert marked as Resolved. You are safe now.', 'success');
    } catch (e) {
        showToast('SOS Alert resolved locally.', 'info');
    }
}

// -------------------------------------------------------------
// Multi-Tone Loud Emergency Siren (Web Audio API)
// -------------------------------------------------------------
function toggleSiren() {
    const sirenText = document.getElementById('sirenText');
    const sirenIcon = document.getElementById('sirenIcon');
    const sirenBtn = document.getElementById('sirenBtn');

    if (!isSirenActive) {
        try {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            sirenOscillator = audioCtx.createOscillator();
            sirenGainNode = audioCtx.createGain();

            sirenOscillator.type = 'sawtooth';
            sirenGainNode.gain.setValueAtTime(0.4, audioCtx.currentTime);

            sirenOscillator.connect(sirenGainNode);
            sirenGainNode.connect(audioCtx.destination);
            sirenOscillator.start();

            // Modulate frequency continuously (dual-tone European police / distress wail: 750Hz to 1150Hz)
            let high = false;
            const modulate = () => {
                if (!isSirenActive || !audioCtx) return;
                const targetFreq = high ? 750 : 1150;
                sirenOscillator.frequency.exponentialRampToValueAtTime(targetFreq, audioCtx.currentTime + 0.35);
                high = !high;
            };
            modulate();
            sirenTimer = setInterval(modulate, 400);

            isSirenActive = true;
            if (sirenText) sirenText.innerText = 'Stop Siren';
            if (sirenIcon) sirenIcon.className = 'fa-solid fa-volume-high text-xl text-rose-500 animate-bounce mb-1';
            if (sirenBtn) sirenBtn.className = 'flex flex-col items-center justify-center p-3 rounded-2xl bg-rose-600/30 border border-rose-500 text-rose-200 transition';
            showToast('Loud Emergency Siren Activated!', 'error');
        } catch (e) {
            console.warn('Audio siren error:', e);
        }
    } else {
        if (sirenTimer) {
            clearInterval(sirenTimer);
            sirenTimer = null;
        }
        if (sirenOscillator) {
            try {
                sirenOscillator.stop();
                sirenOscillator.disconnect();
            } catch (e) {}
        }
        if (audioCtx) {
            audioCtx.close().catch(() => {});
            audioCtx = null;
        }
        isSirenActive = false;
        if (sirenText) sirenText.innerText = 'Loud Siren';
        if (sirenIcon) sirenIcon.className = 'fa-solid fa-bullhorn text-xl text-rose-400 mb-1';
        if (sirenBtn) sirenBtn.className = 'flex flex-col items-center justify-center p-3 rounded-2xl bg-slate-700/60 hover:bg-slate-700 border border-slate-600 transition text-slate-200';
    }
}

// -------------------------------------------------------------
// Emergency Strobe Flashlight Screen
// -------------------------------------------------------------
function toggleFlashlight() {
    const flashText = document.getElementById('flashText');
    const flashIcon = document.getElementById('flashIcon');
    const flashBtn = document.getElementById('flashBtn');

    if (!isStrobeActive) {
        document.body.classList.add('strobe');
        isStrobeActive = true;
        if (flashText) flashText.innerText = 'Stop Strobe';
        if (flashIcon) flashIcon.className = 'fa-solid fa-bolt text-xl text-amber-300 animate-spin mb-1';
        if (flashBtn) flashBtn.className = 'flex flex-col items-center justify-center p-3 rounded-2xl bg-amber-500/30 border border-amber-400 text-amber-200 transition';
    } else {
        document.body.classList.remove('strobe');
        isStrobeActive = false;
        if (flashText) flashText.innerText = 'Strobe Light';
        if (flashIcon) flashIcon.className = 'fa-solid fa-bolt text-xl text-amber-400 mb-1';
        if (flashBtn) flashBtn.className = 'flex flex-col items-center justify-center p-3 rounded-2xl bg-slate-700/60 hover:bg-slate-700 border border-slate-600 transition text-slate-200';
    }
}

// -------------------------------------------------------------
// Real Audio Evidence Recorder (Microphone MediaRecorder)
// -------------------------------------------------------------
async function recordAudioEvidence() {
    const audioText = document.getElementById('audioText');
    const audioIcon = document.getElementById('audioIcon');
    const audioBtn = document.getElementById('audioBtn');
    const playbackContainer = document.getElementById('audioEvidencePlaybackContainer');

    if (!isAudioRecording) {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            audioChunks = [];
            mediaRecorder = new MediaRecorder(stream);

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunks.push(event.data);
                }
            };

            mediaRecorder.onstop = () => {
                recordedAudioBlob = new Blob(audioChunks, { type: 'audio/webm' });
                stream.getTracks().forEach(track => track.stop());
                renderAudioPlayback(recordedAudioBlob);
            };

            mediaRecorder.start();
            isAudioRecording = true;
            audioRecordStartTime = Date.now();

            if (audioText) audioText.innerText = 'Recording (00:00)';
            if (audioIcon) audioIcon.className = 'fa-solid fa-microphone text-xl text-rose-500 animate-pulse mb-1';
            if (audioBtn) audioBtn.className = 'flex flex-col items-center justify-center p-3 rounded-2xl bg-rose-600/30 border border-rose-500 text-rose-200 transition';

            audioRecordTimerInterval = setInterval(() => {
                const diff = Math.floor((Date.now() - audioRecordStartTime) / 1000);
                const m = String(Math.floor(diff / 60)).padStart(2, '0');
                const s = String(diff % 60).padStart(2, '0');
                if (audioText) audioText.innerText = `Recording (${m}:${s})`;
            }, 1000);

            showToast('Microphone Recording Active: Ambient audio evidence being captured.', 'info');
        } catch (err) {
            console.warn('Microphone permission denied or not available:', err);
            // Simulated state if browser microphone permission is blocked
            isAudioRecording = true;
            if (audioText) audioText.innerText = 'Simulated Rec';
            if (audioIcon) audioIcon.className = 'fa-solid fa-microphone text-xl text-rose-500 animate-pulse mb-1';
            showToast('Microphone not permitted. Enable microphone access in browser settings.', 'error');
        }
    } else {
        // Stop Recording
        if (mediaRecorder && mediaRecorder.state !== 'inactive') {
            mediaRecorder.stop();
        }
        if (audioRecordTimerInterval) {
            clearInterval(audioRecordTimerInterval);
            audioRecordTimerInterval = null;
        }

        isAudioRecording = false;
        if (audioText) audioText.innerText = 'Record Audio';
        if (audioIcon) audioIcon.className = 'fa-solid fa-microphone text-xl text-cyan-400 mb-1';
        if (audioBtn) audioBtn.className = 'flex flex-col items-center justify-center p-3 rounded-2xl bg-slate-700/60 hover:bg-slate-700 border border-slate-600 transition text-slate-200';
    }
}

// Render Audio Playback & Download Button for Recorded Evidence
function renderAudioPlayback(blob) {
    let container = document.getElementById('audioEvidencePlaybackContainer');
    if (!container) return;

    const audioUrl = URL.createObjectURL(blob);
    const timeStr = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    const filename = `SafeHer_Evidence_${timeStr}.webm`;

    container.classList.remove('hidden');
    container.innerHTML = `
        <div class="p-3 bg-slate-900/90 rounded-2xl border border-cyan-500/40 text-xs space-y-2 mt-3">
            <div class="flex items-center justify-between text-cyan-300 font-bold">
                <span class="flex items-center space-x-1.5">
                    <i class="fa-solid fa-file-audio"></i>
                    <span>Ambient Evidence Recorded</span>
                </span>
                <span class="text-[10px] text-slate-400 font-mono">${(blob.size / 1024).toFixed(1)} KB</span>
            </div>
            <audio controls src="${audioUrl}" class="w-full h-8 rounded-lg outline-none"></audio>
            <div class="flex space-x-2">
                <a href="${audioUrl}" download="${filename}" class="flex-1 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-center rounded-xl transition flex items-center justify-center space-x-1">
                    <i class="fa-solid fa-download text-[11px]"></i>
                    <span>Download Audio Proof</span>
                </a>
            </div>
        </div>
    `;
    showToast('Audio evidence captured! You can listen or download the legal proof file.', 'success');
}

// -------------------------------------------------------------
// Accelerometer Device Shake Sensor
// -------------------------------------------------------------
function initShakeSensor() {
    const badge = document.getElementById('sensorBadge');
    if (window.DeviceMotionEvent) {
        window.addEventListener('devicemotion', (e) => {
            const acc = e.accelerationIncludingGravity;
            if (!acc) return;

            const curTime = Date.now();
            if ((curTime - lastShakeTime) > 100) {
                lastShakeTime = curTime;

                if (lastX !== null) {
                    const deltaX = Math.abs(acc.x - lastX);
                    const deltaY = Math.abs(acc.y - lastY);
                    const deltaZ = Math.abs(acc.z - lastZ);

                    // Threshold for a vigorous emergency shake
                    if (deltaX + deltaY + deltaZ > 26) {
                        shakeCount++;
                        if (shakeCount >= 3) {
                            triggerSOS();
                            shakeCount = 0;
                            showToast('SHAKE SOS TRIGGERED VIA MOTION SENSOR!', 'error');
                        }
                    }
                }
                lastX = acc.x;
                lastY = acc.y;
                lastZ = acc.z;
            }
        });

        if (badge) {
            badge.className = "hidden md:flex items-center space-x-2 px-3 py-1.5 rounded-full bg-slate-700/80 text-amber-300 border border-amber-500/30 text-xs font-medium";
            badge.innerHTML = `<i class="fa-solid fa-mobile-screen-button text-amber-400 animate-pulse"></i> <span>Shake-SOS Active</span>`;
        }
    }
}

// Utility: HTML Sanitizer
function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/[&<>"']/g, function(m) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[m];
    });
}
