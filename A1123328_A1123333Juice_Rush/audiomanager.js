// Audio utility functions using WebAudio API
let AudioManager_ctx = null;
let AudioManager_muted = false;

function AudioManager_init() {
  try {
    AudioManager_ctx = new (window.AudioContext || window.webkitAudioContext)();
  } catch(e) {
    AudioManager_ctx = null;
  }
}

function AudioManager_toggleMute() {
  AudioManager_muted = !AudioManager_muted;
  return AudioManager_muted;
}

function AudioManager_isMuted() {
  return AudioManager_muted;
}

function AudioManager_playTone(freq, duration, type, volume) {
  if (AudioManager_muted || !AudioManager_ctx) return;
  try {
    if (AudioManager_ctx.state === 'suspended') AudioManager_ctx.resume();
    const osc = AudioManager_ctx.createOscillator();
    const gain = AudioManager_ctx.createGain();
    osc.type = type || 'square';
    osc.frequency.setValueAtTime(freq, AudioManager_ctx.currentTime);
    gain.gain.setValueAtTime(volume || 0.1, AudioManager_ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, AudioManager_ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(AudioManager_ctx.destination);
    osc.start();
    osc.stop(AudioManager_ctx.currentTime + duration);
  } catch(e) {}
}

function AudioManager_playCut() {
  AudioManager_playTone(800, 0.1, 'square', 0.08);
  setTimeout(() => AudioManager_playTone(1200, 0.08, 'square', 0.06), 50);
}

function AudioManager_playBlend() {
  for (let i = 0; i < 5; i++) {
    setTimeout(() => AudioManager_playTone(200 + Math.random() * 300, 0.15, 'sawtooth', 0.04), i * 150);
  }
}

function AudioManager_playPour() {
  AudioManager_playTone(400, 0.3, 'sine', 0.06);
  setTimeout(() => AudioManager_playTone(350, 0.3, 'sine', 0.05), 150);
}

function AudioManager_playServeCorrect() {
  AudioManager_playTone(523, 0.15, 'square', 0.08);
  setTimeout(() => AudioManager_playTone(659, 0.15, 'square', 0.08), 100);
  setTimeout(() => AudioManager_playTone(784, 0.2, 'square', 0.1), 200);
}

function AudioManager_playServeWrong() {
  AudioManager_playTone(200, 0.3, 'sawtooth', 0.08);
  setTimeout(() => AudioManager_playTone(150, 0.4, 'sawtooth', 0.06), 200);
}

function AudioManager_playCustomerAngry() {
  AudioManager_playTone(150, 0.5, 'sine', 0.1);
}

function AudioManager_playClick() {
  AudioManager_playTone(600, 0.05, 'square', 0.05);
}

function AudioManager_playWaveClear() {
  const notes = [523, 659, 784, 1047];
  notes.forEach((n, i) => {
    setTimeout(() => AudioManager_playTone(n, 0.2, 'square', 0.08), i * 120);
  });
}

function AudioManager_playGameOver() {
  const notes = [400, 350, 300, 200];
  notes.forEach((n, i) => {
    setTimeout(() => AudioManager_playTone(n, 0.4, 'sine', 0.1), i * 200);
  });
}