// =====================
// AUDIO.JS
// Web Audio API sound system
// No external files needed
// =====================

let audioCtx = null;

// =====================
// INIT
// =====================

export function initAudio() {
    // Audio context must be created after user interaction
    // We create it lazily on first sound
}

function getCtx() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    return audioCtx;
}

// =====================
// CORE UTILITIES
// =====================

function playTone(frequency, duration, type = 'sine', volume = 0.3, delay = 0) {
    const ctx = getCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = type;
    osc.frequency.setValueAtTime(frequency, ctx.currentTime + delay);

    gain.gain.setValueAtTime(0, ctx.currentTime + delay);
    gain.gain.linearRampToValueAtTime(volume, ctx.currentTime + delay + 0.01);
    gain.gain.linearRampToValueAtTime(0, ctx.currentTime + delay + duration);

    osc.start(ctx.currentTime + delay);
    osc.stop(ctx.currentTime + delay + duration + 0.01);
}

function playNoise(duration, volume = 0.05, delay = 0) {
    const ctx = getCtx();
    const bufferSize = ctx.sampleRate * duration;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    // Fill with white noise
    for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1);
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;

    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    source.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    // Bandpass filter for radio-like sound
    filter.type = 'bandpass';
    filter.frequency.value = 1200;
    filter.Q.value = 0.5;

    gain.gain.setValueAtTime(0, ctx.currentTime + delay);
    gain.gain.linearRampToValueAtTime(volume, ctx.currentTime + delay + 0.02);
    gain.gain.linearRampToValueAtTime(0, ctx.currentTime + delay + duration);

    source.start(ctx.currentTime + delay);
    source.stop(ctx.currentTime + delay + duration + 0.01);
}

// =====================
// SOUND EFFECTS
// =====================

// Classic two-tone dispatch alert
export function playDispatchTone() {
    playTone(880, 0.15, 'square', 0.2, 0.0);
    playTone(660, 0.15, 'square', 0.2, 0.18);
    playTone(880, 0.15, 'square', 0.2, 0.36);
    playTone(660, 0.15, 'square', 0.2, 0.54);
}

// Critical alert — more urgent
export function playCriticalTone() {
    playTone(1200, 0.1, 'square', 0.25, 0.0);
    playTone(800, 0.1, 'square', 0.25, 0.12);
    playTone(1200, 0.1, 'square', 0.25, 0.24);
    playTone(800, 0.1, 'square', 0.25, 0.36);
    playTone(1200, 0.1, 'square', 0.25, 0.48);
}

// Soft confirm beep when dispatching
export function playDispatchBeep() {
    playTone(600, 0.08, 'sine', 0.15, 0.0);
    playTone(800, 0.08, 'sine', 0.15, 0.1);
}

// Radio static burst
export function playRadioStatic() {
    playNoise(0.12, 0.08, 0.0);
    playNoise(0.08, 0.06, 0.15);
}

// All clear — incident resolved
export function playAllClear() {
    playTone(400, 0.1, 'sine', 0.15, 0.0);
    playTone(600, 0.1, 'sine', 0.15, 0.12);
    playTone(800, 0.15, 'sine', 0.2, 0.24);
}

// UI click
export function playClick() {
    playTone(800, 0.04, 'sine', 0.1, 0);
}

// Warning — no units available
export function playWarning() {
    playTone(300, 0.2, 'sawtooth', 0.15, 0.0);
    playTone(250, 0.2, 'sawtooth', 0.15, 0.25);
}

// =====================
// MUTE CONTROL
// =====================

let muted = false;

export function toggleMute() {
    muted = !muted;
    return muted;
}

export function isMuted() {
    return muted;
}

// Wrap all play functions to respect mute
export function play(soundFn) {
    if (!muted) soundFn();
}