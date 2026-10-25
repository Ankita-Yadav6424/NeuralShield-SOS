// =============================================================
// SafeHer - Live GPS Tracking, Safe Havens & Leaflet Map Engine
// =============================================================

let userLat = 28.5355; // Default fallback coordinates
let userLng = 77.3910;
let userAccuracy = 20;
let userAddress = "Sector 62, Noida, Uttar Pradesh";

let map = null;
let userMarker = null;
let userAccuracyCircle = null;
let safePlacesData = [];
let placeMarkers = [];
let gpsWatchId = null;
let currentCategoryFilter = 'all';

window.addEventListener('DOMContentLoaded', () => {
    initLeafletMap();
    startActiveGPSTracking();
    loadSafePlaces();
});

// -------------------------------------------------------------
// Initialize Leaflet Map
// -------------------------------------------------------------
function initLeafletMap() {
    const mapContainer = document.getElementById('leafletMap');
    if (!mapContainer) return;

    map = L.map('leafletMap', {
        center: [userLat, userLng],
        zoom: 15,
        zoomControl: true
    });

    // Dark Mode Tile Layer (CartoDB Dark Matter)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 19
    }).addTo(map);

    // Custom Radar User Marker Icon
    const userIcon = L.divIcon({
        className: 'custom-user-pin relative',
        html: `
            <div class="radar-wave"></div>
            <div class="relative w-8 h-8 rounded-full bg-rose-600 border-2 border-white shadow-2xl flex items-center justify-center text-xs text-white font-bold z-10 ring-4 ring-rose-500/30">
                <i class="fa-solid fa-person-dress text-sm"></i>
            </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16]
    });

    userMarker = L.marker([userLat, userLng], { icon: userIcon, zIndexOffset: 1000 }).addTo(map);
    userMarker.bindPopup(`
        <div class="p-1 text-slate-900">
            <div class="font-bold text-rose-600 flex items-center space-x-1.5">
                <i class="fa-solid fa-location-dot"></i>
                <span>Your Live Position</span>
            </div>
            <div class="text-[11px] text-slate-600 mt-1" id="popupAddress">${userAddress}</div>
            <div class="text-[10px] font-mono text-slate-500 mt-1">Lat: ${userLat.toFixed(4)}, Lng: ${userLng.toFixed(4)}</div>
        </div>
    `);

    // Accuracy Circle
    userAccuracyCircle = L.circle([userLat, userLng], {
        radius: userAccuracy,
        color: '#f43f5e',
        weight: 1,
        fillColor: '#f43f5e',
        fillOpacity: 0.12
    }).addTo(map);

    // Allow user to click anywhere on map to manually pinpoint distress location
    map.on('click', (e) => {
        updateUserLocation(e.latlng.lat, e.latlng.lng, 10, true);
    });
}

// -------------------------------------------------------------
// Active Live GPS Tracking Engine
// -------------------------------------------------------------
function startActiveGPSTracking() {
    const coordsDisplay = document.getElementById('coordsDisplay');
    const headerGpsBadge = document.getElementById('headerGpsBadge');

    if (!navigator.geolocation) {
        if (coordsDisplay) coordsDisplay.innerHTML = `<span class="text-amber-400">GPS not supported by browser</span>`;
        return;
    }

    if (coordsDisplay) {
        coordsDisplay.innerHTML = `<i class="fa-solid fa-satellite-dish animate-pulse text-emerald-400 mr-1.5"></i> Acquiring Active GPS Signal...`;
    }

    const geoSuccess = (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const acc = Math.round(position.coords.accuracy || 15);

        updateUserLocation(lat, lng, acc, false);
    };

    const geoError = (err) => {
        console.warn('GPS location error:', err.message);
        if (coordsDisplay) {
            coordsDisplay.innerHTML = `
                <div class="flex items-center space-x-1.5 text-amber-300">
                    <i class="fa-solid fa-location-crosshairs text-amber-400"></i>
                    <span>GPS Active: ${userLat.toFixed(4)}, ${userLng.toFixed(4)}</span>
                </div>
            `;
        }
        if (headerGpsBadge) {
            headerGpsBadge.innerHTML = `
                <span class="w-2 h-2 rounded-full bg-emerald-400 animate-ping mr-1.5"></span>
                <span class="font-semibold">GPS Active</span>
            `;
        }
    };

    const options = {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 5000
    };

    // 1. Initial Position
    navigator.geolocation.getCurrentPosition(geoSuccess, geoError, options);

    // 2. Continuous Real-time Watch
    if (gpsWatchId !== null) navigator.geolocation.clearWatch(gpsWatchId);
    gpsWatchId = navigator.geolocation.watchPosition(geoSuccess, geoError, options);
}

// Update User Location State, UI & Markers
function updateUserLocation(lat, lng, accuracy = 15, isManualClick = false) {
    userLat = lat;
    userLng = lng;
    userAccuracy = accuracy;

    // Expose globally for other modules (SOS & WhatsApp Links)
    window.userLat = lat;
    window.userLng = lng;

    const coordsDisplay = document.getElementById('coordsDisplay');
    const headerGpsBadge = document.getElementById('headerGpsBadge');

    if (coordsDisplay) {
        coordsDisplay.innerHTML = `
            <div class="flex items-center space-x-2 text-slate-200">
                <span class="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                <span class="font-bold text-emerald-400">GPS Live:</span>
                <span class="font-mono text-[11px]">${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E (±${accuracy}m)</span>
            </div>
        `;
    }

    if (headerGpsBadge) {
        headerGpsBadge.className = "hidden sm:flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs font-semibold shadow-sm";
        headerGpsBadge.innerHTML = `
            <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>GPS Live (${lat.toFixed(2)}, ${lng.toFixed(2)})</span>
        `;
    }

    // Update Marker and Circle on Leaflet Map
    if (map && userMarker) {
        userMarker.setLatLng([lat, lng]);
        if (userAccuracyCircle) {
            userAccuracyCircle.setLatLng([lat, lng]);
            userAccuracyCircle.setRadius(accuracy);
        }
        if (isManualClick) {
            map.panTo([lat, lng]);
        }
    }

    // Reverse Geocode to street/neighborhood name
    reverseGeocodeLocation(lat, lng);

    // Refresh distance badges on safe havens
    renderSafePlacesMarkers();
}

// Reverse Geocode Coordinates via Backend Proxy
async function reverseGeocodeLocation(lat, lng) {
    const locNameEl = document.getElementById('locationAddressText');
    const popupAddress = document.getElementById('popupAddress');

    try {
        const res = await fetch(`/api/geocode/reverse?lat=${lat}&lng=${lng}`);
        const data = await res.json();
        if (data.success && data.address) {
            userAddress = data.address;
            window.userAddress = userAddress;
            if (locNameEl) locNameEl.innerText = userAddress;
            if (popupAddress) popupAddress.innerText = userAddress;
        }
    } catch (e) {
        userAddress = `Coordinates: ${lat.toFixed(4)}, ${lng.toFixed(4)}`;
        if (locNameEl) locNameEl.innerText = userAddress;
    }
}

// Recenter Map on Current GPS Location
function recenterMap() {
    if (map) {
        map.flyTo([userLat, userLng], 15, { duration: 1.2 });
        if (userMarker) userMarker.openPopup();
    }
    startActiveGPSTracking();
}

function refreshLocation() {
    recenterMap();
    showToast('GPS position refreshed and updated!', 'success');
}

// -------------------------------------------------------------
// Safe Havens (Police, Hospitals, Women Safe Zones)
// -------------------------------------------------------------
async function loadSafePlaces() {
    try {
        const res = await fetch('/api/places');
        const data = await res.json();
        if (data.success && Array.isArray(data.places)) {
            safePlacesData = data.places;
            renderSafePlacesMarkers();
            renderSafePlacesList();
        }
    } catch (e) {
        console.warn('Could not load safe places from backend:', e);
    }
}

function renderSafePlacesMarkers() {
    if (!map) return;

    // Clear old markers
    placeMarkers.forEach(m => map.removeLayer(m));
    placeMarkers = [];

    safePlacesData.forEach(place => {
        // Filter by category if selected
        if (currentCategoryFilter !== 'all' && place.type !== currentCategoryFilter) {
            return;
        }

        const distanceMeters = calculateDistance(userLat, userLng, place.latitude, place.longitude);
        const distanceStr = distanceMeters > 1000 
            ? `${(distanceMeters / 1000).toFixed(1)} km` 
            : `${Math.round(distanceMeters)} m`;

        let colorClass = 'bg-blue-600';
        let iconClass = 'fa-shield-halved';
        let badgeColor = 'text-blue-400 bg-blue-500/20 border-blue-500/30';
        let labelType = 'Police Station';

        if (place.type === 'hospital') {
            colorClass = 'bg-emerald-600';
            iconClass = 'fa-hospital';
            badgeColor = 'text-emerald-400 bg-emerald-500/20 border-emerald-500/30';
            labelType = '24/7 Emergency Hospital';
        } else if (place.type === 'safezone') {
            colorClass = 'bg-purple-600';
            iconClass = 'fa-house-user';
            badgeColor = 'text-purple-400 bg-purple-500/20 border-purple-500/30';
            labelType = 'Women Haven & NGO';
        }

        const customIcon = L.divIcon({
            className: 'custom-place-pin',
            html: `
                <div class="w-8 h-8 rounded-2xl ${colorClass} text-white flex items-center justify-center text-xs shadow-xl ring-2 ring-white/30 hover:scale-110 transition-transform">
                    <i class="fa-solid ${iconClass}"></i>
                </div>
            `,
            iconSize: [32, 32],
            iconAnchor: [16, 16]
        });

        const directionsUrl = `https://www.google.com/maps/dir/?api=1&origin=${userLat},${userLng}&destination=${place.latitude},${place.longitude}`;

        const marker = L.marker([place.latitude, place.longitude], { icon: customIcon }).addTo(map);
        marker.bindPopup(`
            <div class="p-1 min-w-[200px] text-slate-900">
                <span class="text-[10px] font-bold px-2 py-0.5 rounded-full border ${badgeColor} inline-block mb-1">
                    ${labelType}
                </span>
                <div class="font-bold text-sm text-slate-900">${escapeHtml(place.name)}</div>
                <div class="text-[11px] text-slate-600 mt-0.5">${escapeHtml(place.address || '')}</div>
                
                <div class="flex items-center space-x-1 text-rose-600 font-bold text-xs mt-2">
                    <i class="fa-solid fa-person-walking"></i>
                    <span>Distance: ${distanceStr} away</span>
                </div>

                <div class="flex space-x-2 mt-3">
                    <a href="tel:${place.phone}" class="flex-1 text-center py-1.5 bg-rose-600 text-white rounded-lg text-xs font-bold hover:bg-rose-700 transition">
                        <i class="fa-solid fa-phone mr-1"></i> Call ${place.phone}
                    </a>
                    <a href="${directionsUrl}" target="_blank" rel="noopener" class="flex-1 text-center py-1.5 bg-slate-800 text-white rounded-lg text-xs font-bold hover:bg-slate-700 transition">
                        <i class="fa-solid fa-diamond-turn-right mr-1"></i> Navigate
                    </a>
                </div>
            </div>
        `);

        placeMarkers.push(marker);
    });
}

function renderSafePlacesList() {
    const listContainer = document.getElementById('nearbyHavensList');
    if (!listContainer) return;

    // Sort places by distance
    const sorted = [...safePlacesData].map(p => {
        return {
            ...p,
            distance: calculateDistance(userLat, userLng, p.latitude, p.longitude)
        };
    }).sort((a, b) => a.distance - b.distance);

    listContainer.innerHTML = sorted.slice(0, 4).map(place => {
        const distanceStr = place.distance > 1000 
            ? `${(place.distance / 1000).toFixed(1)} km` 
            : `${Math.round(place.distance)} m`;

        let color = place.type === 'police' ? 'blue' : place.type === 'hospital' ? 'emerald' : 'purple';
        let icon = place.type === 'police' ? 'fa-shield-halved' : place.type === 'hospital' ? 'fa-hospital' : 'fa-house-user';

        return `
            <div class="p-3 bg-slate-900/60 rounded-2xl border border-slate-700/60 flex items-center justify-between text-xs hover:border-slate-600 transition">
                <div class="flex items-center space-x-3">
                    <div class="w-8 h-8 rounded-xl bg-${color}-500/20 text-${color}-400 border border-${color}-500/30 flex items-center justify-center text-xs shrink-0">
                        <i class="fa-solid ${icon}"></i>
                    </div>
                    <div>
                        <div class="font-bold text-slate-200">${escapeHtml(place.name)}</div>
                        <div class="text-[11px] text-slate-400 flex items-center space-x-2">
                            <span><i class="fa-solid fa-route text-rose-400 mr-1"></i>${distanceStr} away</span>
                            <span>•</span>
                            <span class="text-emerald-400">24/7 Active</span>
                        </div>
                    </div>
                </div>
                <div class="flex items-center space-x-1.5">
                    <a href="tel:${place.phone}" class="px-2.5 py-1.5 rounded-xl bg-rose-600/20 text-rose-300 border border-rose-500/30 hover:bg-rose-600 hover:text-white transition font-semibold text-[11px] flex items-center space-x-1">
                        <i class="fa-solid fa-phone text-[10px]"></i>
                        <span>${place.phone}</span>
                    </a>
                </div>
            </div>
        `;
    }).join('');
}

// Filter Places by Type
function filterHavens(type) {
    currentCategoryFilter = type;
    
    // Update filter button tabs
    document.querySelectorAll('.haven-filter-btn').forEach(btn => {
        if (btn.getAttribute('data-type') === type) {
            btn.className = 'haven-filter-btn px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-600 text-white shadow-md transition';
        } else {
            btn.className = 'haven-filter-btn px-3 py-1.5 rounded-xl text-xs font-medium bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 border border-slate-700 transition';
        }
    });

    renderSafePlacesMarkers();
}

// Haversine Formula for Distance Calculation (meters)
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3; // Earth radius in meters
    const phi1 = (lat1 * Math.PI) / 180;
    const phi2 = (lat2 * Math.PI) / 180;
    const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
    const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

    const a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
              Math.cos(phi1) * Math.cos(phi2) *
              Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
}

// Utility: HTML Sanitizer
function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/[&<>"']/g, function(m) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[m];
    });
}
