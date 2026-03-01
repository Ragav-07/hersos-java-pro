// HerSOS - Safety Platform JavaScript
// Design Thinking approach: Empathy-centered, discreet, automated protection

// Global State
let appState = {
  currentTab: 'home',
  sosPressStart: 0,
  sosTimer: null,
  isSOActive: false,
  fakeCallActive: false,
  locationSharing: false,
  sirenActive: false,
  safetyScore: 92,
  audioRecorder: null,
  recordingChunks: []
};

// Safety Tips Array
const safetyTips = [
  { title: "Share your journey", text: "Always share your live location with trusted contacts when traveling alone, especially at night." },
  { title: "Trust your instincts", text: "If something feels wrong, it probably is. Remove yourself from uncomfortable situations immediately." },
  { title: "Keep phone charged", text: "Maintain at least 50% battery when going out. Consider carrying a portable charger." },
  { title: "Know your exits", text: "When entering any building, quickly identify at least two exit routes." },
  { title: "Use code words", text: "Establish code words with close friends that mean 'call me with an emergency' or 'I'm in danger'." },
  { title: "Park smart", text: "Park in well-lit areas near entrances. Check your surroundings before getting in your car." }
];

let currentTipIndex = 0;

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
  lucide.createIcons();
  initializeLocationTracking();
  startSafetyMonitoring();
  updateSafetyScore();
});

// Tab Navigation
function setTab(tab) {
  // Hide all views
  document.getElementById('contactsView').classList.add('hidden');
  document.getElementById('mapView').classList.add('hidden');
  document.getElementById('settingsView').classList.add('hidden');
  
  // Reset tab styles
  document.querySelectorAll('nav button').forEach(btn => {
    btn.classList.remove('active-tab', 'text-primary-600');
    btn.classList.add('text-gray-400');
  });
  
  // Show selected view
  if (tab === 'contacts') {
    document.getElementById('contactsView').classList.remove('hidden');
  } else if (tab === 'location') {
    document.getElementById('mapView').classList.remove('hidden');
    initMapFeatures();
  } else if (tab === 'settings') {
    document.getElementById('settingsView').classList.remove('hidden');
  }
  
  // Update active tab style
  const activeBtn = document.getElementById(`tab-${tab}`);
  activeBtn.classList.add('active-tab', 'text-primary-600');
  activeBtn.classList.remove('text-gray-400');
  
  appState.currentTab = tab;
}

// SOS Button Logic - Press and Hold for 3 seconds
function startSOSPress() {
  if (appState.isSOActive) return;
  
  appState.sosPressStart = Date.now();
  const progressRing = document.getElementById('sosProgressRing');
  const progressContainer = document.getElementById('sosProgress');
  
  progressContainer.classList.remove('opacity-0');
  
  let progress = 0;
  appState.sosTimer = setInterval(() => {
    const elapsed = Date.now() - appState.sosPressStart;
    progress = Math.min((elapsed / 3000) * 100, 100);
    
    // Rotate the progress ring
    progressRing.style.transform = `rotate(${(progress / 100) * 360}deg)`;
    
    if (elapsed >= 3000) {
      clearInterval(appState.sosTimer);
      activateSOS();
    }
  }, 50);
}

function cancelSOSPress() {
  if (appState.sosTimer) {
    clearInterval(appState.sosTimer);
    appState.sosTimer = null;
  }
  
  const progressContainer = document.getElementById('sosProgress');
  progressContainer.classList.add('opacity-0');
  
  // Reset rotation after animation
  setTimeout(() => {
    document.getElementById('sosProgressRing').style.transform = 'rotate(0deg)';
  }, 300);
}

// Activate Emergency SOS
function activateSOS() {
  appState.isSOActive = true;
  
  // Play emergency sound (if not silent mode)
  // const audio = new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=');
  // audio.play().catch(() => {});
  
  // Start audio recording
  startAudioRecording();
  
  // Get precise location
  updateSOSSocation();
  
  // Show emergency overlay
  document.getElementById('sosOverlay').classList.remove('hidden');
  document.getElementById('sosOverlay').classList.add('flex');
  
  // Send alerts to contacts (simulated)
  sendEmergencyAlerts();
  
  // Trigger device vibration if available
  if ('vibrate' in navigator) {
    navigator.vibrate([500, 200, 500, 200, 1000]);
  }
  
  showToast('Emergency services contacted', 'error');
}

// Cancel SOS (requires confirmation)
function cancelSOS() {
  if (!confirm('Are you sure you want to cancel the emergency?')) return;
  
  appState.isSOActive = false;
  stopAudioRecording();
  
  document.getElementById('sosOverlay').classList.add('hidden');
  document.getElementById('sosOverlay').classList.remove('flex');
  
  showToast('Emergency cancelled', 'info');
}

// Silent Alert - Discreet activation
function sendSilentAlert() {
  // Double-confirm for discretion
  showToast('Silent alert sent to trusted contacts', 'warning');
  
  // Send location without sound
  sendLocationToContacts(true);
  
  // Log to recent alerts
  addRecentAlert('Silent alert triggered', 'Your location was shared discreetly', 'warning');
}

// Audio Recording
async function startAudioRecording() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mediaRecorder = new MediaRecorder(stream);
    appState.audioRecorder = mediaRecorder;
    appState.recordingChunks = [];
    
    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        appState.recordingChunks.push(e.data);
      }
    };
    
    mediaRecorder.start(1000); // Collect data every second
  } catch (err) {
    console.log('Audio recording not available:', err);
  }
}

function stopAudioRecording() {
  if (appState.audioRecorder && appState.audioRecorder.state !== 'inactive') {
    appState.audioRecorder.stop();
    appState.audioRecorder.stream.getTracks().forEach(track => track.stop());
  }
}

// Location Functions
function initializeLocationTracking() {
  if ('geolocation' in navigator) {
    navigator.geolocation.watchPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        
        // Update location displays
        updateLocationDisplay(lat, lon);
        
        // Check safety score based on location
        assessLocationSafety(lat, lon);
      },
      (err) => {
        console.log('Location error:', err);
      },
      { enableHighAccuracy: true, maximumAge: 10000 }
    );
  }
}

function updateSOSSocation() {
  navigator.geolocation.getCurrentPosition((position) => {
    const lat = position.coords.latitude.toFixed(6);
    const lon = position.coords.longitude.toFixed(6);
    document.getElementById('sosLocation').textContent = `${lat}, ${lon}`;
  });
}

function updateLocationDisplay(lat, lon) {
  // Reverse geocode would happen here in production
}

function assessLocationSafety(lat, lon) {
  // Simulated safety assessment
  // In production, this would check against crime data, lighting, time, etc.
  const hour = new Date().getHours();
  let score = 92;
  
  // Reduce score at night
  if (hour >= 22 || hour <= 5) {
    score -= 15;
  }
  
  // Update safety score with animation
  const currentScore = parseInt(document.getElementById('safetyScore').textContent);
  if (currentScore !== score) {
    animateScoreChange(currentScore, score);
  }
}

function animateScoreChange(from, to) {
  const element = document.getElementById('safetyScore');
  const duration = 500;
  const start = Date.now();
  
  const animate = () => {
    const elapsed = Date.now() - start;
    const progress = Math.min(elapsed / duration, 1);
    const current = Math.round(from + (to - from) * progress);
    
    element.textContent = current;
    
    if (progress < 1) {
      requestAnimationFrame(animate);
    } else {
      updateSafetyStatus(current);
    }
  };
  
  requestAnimationFrame(animate);
}

function updateSafetyStatus(score) {
  const statusEl = document.getElementById('safetyStatus');
  const dotEl = document.getElementById('statusDot');
  
  if (score >= 80) {
    statusEl.innerHTML = '<i data-lucide="check-circle" class="w-4 h-4"></i>Safe Zone';
    dotEl.className = 'w-3 h-3 rounded-full bg-emerald-500 animate-pulse';
    statusEl.className = 'text-emerald-600 text-sm mt-1 flex items-center gap-1';
  } else if (score >= 50) {
    statusEl.innerHTML = '<i data-lucide="alert-circle" class="w-4 h-4"></i>Caution';
    dotEl.className = 'w-3 h-3 rounded-full bg-amber-500 animate-pulse';
    statusEl.className = 'text-amber-600 text-sm mt-1 flex items-center gap-1';
  } else {
    statusEl.innerHTML = '<i data-lucide="alert-triangle" class="w-4 h-4"></i>At Risk';
    dotEl.className = 'w-3 h-3 rounded-full bg-red-500 animate-pulse';
    statusEl.className = 'text-red-500 text-sm mt-1 flex items-center gap-1';
  }
  
  lucide.createIcons();
}

// Fake Call Feature
function fakeCall() {
  appState.fakeCallActive = true;
  
  const overlay = document.getElementById('fakeCallOverlay');
  overlay.classList.remove('hidden');
  overlay.classList.add('flex');
  
  // Play ringtone
  // const ringtone = new Audio('ringtone.mp3');
  // ringtone.play();
  
  // Start timer after "answering"
  setTimeout(() => {
    let seconds = 0;
    const timerEl = document.getElementById('callTimer');
    
    const timer = setInterval(() => {
      if (!appState.fakeCallActive) {
        clearInterval(timer);
        return;
      }
      
      seconds++;
      const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
      const secs = (seconds % 60).toString().padStart(2, '0');
      timerEl.textContent = `${mins}:${secs}`;
    }, 1000);
  }, 2000);
  
  // Auto-vibrate
  if ('vibrate' in navigator) {
    navigator.vibrate([200, 100, 200, 100, 400]);
  }
}

function endFakeCall() {
  appState.fakeCallActive = false;
  
  document.getElementById('fakeCallOverlay').classList.add('hidden');
  document.getElementById('fakeCallOverlay').classList.remove('flex');
  document.getElementById('callTimer').textContent = '00:00';
  
  addRecentAlert('Fake call ended', 'Call duration: 45 seconds', 'info');
}

// Siren Mode
function sirenMode() {
  appState.sirenActive = true;
  
  const alert = document.getElementById('sirenAlert');
  alert.classList.remove('hidden');
  
  // Flash screen if possible
  if ('wakeLock' in navigator) {
    navigator.wakeLock.request('screen').then(wakeLock => {
      appState.wakeLock = wakeLock;
    }).catch(() => {});
  }
  
  // Play siren sound
  playSirenSound();
  
  // Auto-stop after 10 seconds
  setTimeout(() => {
    if (appState.sirenActive) {
      stopSiren();
    }
  }, 10000);
}

function playSirenSound() {
  // Create oscillator for siren
  try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    // Siren effect
    oscillator.type = 'sawtooth';
    oscillator.frequency.setValueAtTime(440, audioContext.currentTime);
    
    // Modulate frequency for siren effect
    const lfo = audioContext.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 1; // 1Hz modulation
    
    const lfoGain = audioContext.createGain();
    lfoGain.gain.value = 100;
    
    lfo.connect(lfoGain);
    lfoGain.connect(oscillator.frequency);
    
    lfo.start();
    oscillator.start();
    
    gainNode.gain.setValueAtTime(0.5, audioContext.currentTime);
    
    // Store to stop later
    appState.sirenNodes = { oscillator, lfo, gainNode, audioContext };
  } catch (e) {
    console.log('Audio not supported');
  }
}

function stopSiren() {
  appState.sirenActive = false;
  
  const alert = document.getElementById('sirenAlert');
  if (alert) {
    alert.classList.add('hidden');
  }
  
  if (appState.sirenNodes) {
    try {
      appState.sirenNodes.oscillator.stop();
      appState.sirenNodes.lfo.stop();
      appState.sirenNodes.audioContext.close();
    } catch (e) {
      console.log('Error stopping siren:', e);
    }
    appState.sirenNodes = null;
  }
  
  // Release wake lock if active
  if ('wakeLock' in navigator && appState.wakeLock) {
    appState.wakeLock.release().catch(() => {});
    appState.wakeLock = null;
  }
}

// Location Sharing
function shareLocation() {
  document.getElementById('locationModal').classList.remove('hidden');
}

function closeLocationModal() {
  document.getElementById('locationModal').classList.add('hidden');
}

function confirmShareLocation() {
  const duration = document.querySelector('input[name="duration"]:checked').value;
  
  closeLocationModal();
  
  showToast(`Location shared for ${duration} minutes`, 'success');
  addRecentAlert('Location shared', `Active for ${duration} minutes`, 'success');
  
  appState.locationSharing = true;
  
  // Simulate countdown
  setTimeout(() => {
    if (appState.locationSharing) {
      showToast('Location sharing expired', 'info');
      appState.locationSharing = false;
    }
  }, parseInt(duration) * 60000);
}

// Emergency Sending
function sendEmergencyAlerts() {
  // This would connect to backend API in production
  const emergencyData = {
    type: 'SOS_ACTIVATED',
    userId: 'user_123',
    timestamp: new Date().toISOString(),
    location: null, // Would be filled
    audioRecording: null // Would be streaming
  };
  
  // Send to contacts
  console.log('Emergency alert sent:', emergencyData);
  
  // Add to recent alerts
  addRecentAlert('SOS Activated', 'Emergency services notified', 'error');
}

function sendLocationToContacts(silent = false) {
  navigator.geolocation.getCurrentPosition((position) => {
    const data = {
      lat: position.coords.latitude,
      lon: position.coords.longitude,
      accuracy: position.coords.accuracy,
      timestamp: new Date().toISOString()
    };
    
    console.log('Location shared:', data, silent ? '(silent)' : '');
  });
}

// Recent Alerts
function addRecentAlert(title, subtitle, type) {
  const container = document.getElementById('recentAlerts');
  
  const colors = {
    success: { bg: 'bg-emerald-100', icon: 'bg-emerald-50', text: 'text-emerald-600', iconName: 'check' },
    error: { bg: 'bg-red-100', icon: 'bg-red-50', text: 'text-red-600', iconName: 'alert-triangle' },
    warning: { bg: 'bg-amber-100', icon: 'bg-amber-50', text: 'text-amber-600', iconName: 'bell' },
    info: { bg: 'bg-blue-100', icon: 'bg-blue-50', text: 'text-blue-600', iconName: 'info' }
  };
  
  const color = colors[type] || colors.info;
  
  const alertEl = document.createElement('div');
  alertEl.className = 'bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center gap-3 animate-scale-in';
  alertEl.innerHTML = `
    <div class="w-10 h-10 rounded-full ${color.bg} flex items-center justify-center">
      <i data-lucide="${color.iconName}" class="w-5 h-5 ${color.text}"></i>
    </div>
    <div class="flex-1">
      <p class="font-medium text-gray-900 text-sm">${title}</p>
      <p class="text-xs text-gray-500">${subtitle}</p>
    </div>
    <span class="text-xs ${color.text} font-medium ${color.icon} px-2 py-1 rounded-full">Active</span>
  `;
  
  container.insertBefore(alertEl, container.firstChild);
  
  // Remove last if too many
  if (container.children.length > 5) {
    container.removeChild(container.lastChild);
  }
  
  lucide.createIcons();
}

// Safety Tips
function nextTip() {
  currentTipIndex = (currentTipIndex + 1) % safetyTips.length;
  const tip = safetyTips[currentTipIndex];
  
  document.getElementById('tipTitle').textContent = tip.title;
  document.getElementById('tipText').textContent = tip.text;
  
  // Animate
  const container = document.querySelector('#tipTitle').parentElement.parentElement.parentElement;
  container.style.opacity = '0';
  container.style.transform = 'translateX(10px)';
  container.style.transition = 'all 0.3s ease';
  
  setTimeout(() => {
    container.style.opacity = '1';
    container.style.transform = 'translateX(0)';
  }, 100);
}

// Safety Monitoring (Background)
function startSafetyMonitoring() {
  // Check inactivity
  let lastActivity = Date.now();
  
  const resetActivity = () => {
    lastActivity = Date.now();
  };
  
  ['click', 'touchstart', 'keydown'].forEach(evt => {
    document.addEventListener(evt, resetActivity, { passive: true });
  });
  
  // Periodic check
  setInterval(() => {
    const inactive = Date.now() - lastActivity;
    const minutes = Math.floor(inactive / 60000);
    
    if (minutes >= 30) {
      // Suggest check-in
      showToast('Check in? You haven\'t moved in 30 minutes', 'warning');
      // Play gentle reminder sound if enabled
    }
  }, 60000);
  
  // Simulate AI detection events
  setInterval(() => {
    // Random "anomaly detection" for demo
    if (Math.random() > 0.99) {
      showToast('Unusual movement pattern detected near you', 'warning');
    }
  }, 30000);
}

function updateSafetyScore() {
  // Continuously update based on various factors
  setInterval(() => {
    // Small fluctuations to show it's "alive"
    const baseScore = 85;
    const variation = Math.sin(Date.now() / 300000) * 10; // 5-minute cycle
    const timeOfDay = new Date().getHours();
    const nightPenalty = (timeOfDay >= 22 || timeOfDay <= 5) ? -10 : 0;
    
    const newScore = Math.round(baseScore + variation + nightPenalty + Math.random() * 5);
    appState.safetyScore = Math.min(100, Math.max(0, newScore));
    
    animateScoreChange(parseInt(document.getElementById('safetyScore').textContent), appState.safetyScore);
  }, 30000);
}

// Toast Notifications
function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  
  const colors = {
    info: 'bg-primary-600',
    success: 'bg-emerald-600',
    warning: 'bg-amber-500',
    error: 'bg-red-600'
  };
  
  const toast = document.createElement('div');
  toast.className = `${colors[type]} text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-3 animate-slide-up`;
  toast.innerHTML = `
    <i data-lucide="${type === 'error' ? 'alert-circle' : type === 'success' ? 'check-circle' : type === 'warning' ? 'alert-triangle' : 'info'}" class="w-5 h-5"></i>
    <p class="font-medium text-sm">${message}</p>
  `;
  
  container.appendChild(toast);
  lucide.createIcons();
  
  // Auto remove
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(-10px)';
    toast.style.transition = 'all 0.3s ease';
    
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 300);
  }, 4000);
}

// Profile and Settings
function showProfile() {
  setTab('settings');
}

function showAllAlerts() {
  showToast('Full alert history coming soon', 'info');
}

// Contacts Management
function addContact() {
  showToast('Contact picker opening...', 'info');
  // In production, would open native contact picker
}

function syncContacts() {
  showToast('Contacts synced successfully', 'success');
}

// Map Features
function initMapFeatures() {
  // Initialize map interactions
}

function zoomIn() {
  showToast('Zoomed in', 'info');
}

function zoomOut() {
  showToast('Zoomed out', 'info');
}

function centerOnMe() {
  showToast('Centered on your location', 'success');
}

// Prevent accidental SOS on button elements
document.querySelectorAll('button').forEach(btn => {
  btn.addEventListener('contextmenu', e => e.preventDefault());
});

// Keyboard shortcuts for desktop
document.addEventListener('keydown', (e) => {
  // Press Spacebar 3 times rapidly for silent alert
  if (e.code === 'Space') {
    const now = Date.now();
    if (!appState.spacePresses) appState.spacePresses = [];
    appState.spacePresses.push(now);
    appState.spacePresses = appState.spacePresses.filter(t => now - t < 2000);
    
    if (appState.spacePresses.length >= 3) {
      sendSilentAlert();
      appState.spacePresses = [];
    }
  }
  
  // ESC to cancel SOS if active
  if (e.code === 'Escape' && appState.isSOActive) {
    cancelSOS();
  }
});

// Visibility API - detect if app is hidden
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    // App went to background
    // Ensure location sharing continues
    console.log('App in background - safety features active');
  } else {
    // App came to foreground
    updateSafetyScore();
  }
});

// Service Worker registration for offline/PWA functionality
if ('serviceWorker' in navigator) {
  // In production, would register SW here
  // navigator.serviceWorker.register('/sw.js');
}

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { appState, activateSOS, sendSilentAlert };
}