let audio_ctx = null;

function get_audio() {
    if (!audio_ctx) {
        audio_ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
    return audio_ctx;
}

function play_sound(frequency, duration, type, volume) {
    let ctx = get_audio();
    let oscillator = ctx.createOscillator();
    let gain = ctx.createGain();
    oscillator.connect(gain);
    gain.connect(ctx.destination);
    oscillator.frequency.value = frequency;
    oscillator.type = type;
    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + duration);
}

function sound_attack() {
    play_sound(180, 0.08, "square", 0.2);
}

function sound_enemy_hit() {
    play_sound(120, 0.1, "square", 0.15);
}

function sound_ability() {
    play_sound(440, 0.1, "sine", 0.3);
    setTimeout(function () {
        play_sound(550, 0.2, "sine", 0.2);
    }, 100);
}

function sound_level_up() {
    play_sound(523, 0.1, "sine", 0.4);
    setTimeout(function () {
        play_sound(659, 0.1, "sine", 0.4);
    }, 120);
    setTimeout(function () {
        play_sound(784, 0.3, "sine", 0.4);
    }, 240);
}

function sound_player_hit() {
    play_sound(80, 0.15, "sawtooth", 0.25);
}

function sound_death() {
    play_sound(200, 0.1, "sawtooth", 0.3);
    setTimeout(function () {
        play_sound(150, 0.1, "sawtooth", 0.3);
    }, 100);
    setTimeout(function () {
        play_sound(100, 0.4, "sawtooth", 0.3);
    }, 200);
}

function sound_purchase() {
    play_sound(660, 0.05, "sine", 0.2);
    setTimeout(function () {
        play_sound(880, 0.1, "sine", 0.2);
    }, 60);
}

function sound_boss() {
    play_sound(60, 0.3, "sawtooth", 0.4);
    setTimeout(function () {
        play_sound(55, 0.5, "sawtooth", 0.3);
    }, 300);
}