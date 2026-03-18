let audio_ctx = null;

function get_audio() {
    if (!audio_ctx) {
        audio_ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
    return audio_ctx;
}

function play_deep_pulse() {
    let ctx = get_audio();
    let osc = ctx.createOscillator();
    let gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "sine";
    osc.frequency.value = 40 + Math.random() * 20;
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.25, ctx.currentTime + 0.3);
    gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 2.5);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 2.5);
}

function start_ambient_hum() {
    let ctx = get_audio();
    let osc1 = ctx.createOscillator();
    let osc2 = ctx.createOscillator();
    let gain = ctx.createGain();

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);

    osc1.type = "sine";
    osc1.frequency.value = 55;
    osc2.type = "sine";
    osc2.frequency.value = 58;

    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.06, ctx.currentTime + 3);

    osc1.start(ctx.currentTime);
    osc2.start(ctx.currentTime);

    function breathe() {
        if (!running) return;
        let now = ctx.currentTime;
        let drift = Math.random() * 4 - 2;
        osc1.frequency.linearRampToValueAtTime(55 + drift, now + 4);
        osc2.frequency.linearRampToValueAtTime(58 + drift, now + 4);
        setTimeout(breathe, 4000 + Math.random() * 3000);
    }

    setTimeout(breathe, 3000);
}
function play_bell() {
    let ctx = get_audio();
    let osc1 = ctx.createOscillator();
    let osc2 = ctx.createOscillator();
    let gain = ctx.createGain();

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);

    osc1.type = "sine";
    osc1.frequency.value = 220;
    osc2.type = "sine";
    osc2.frequency.value = 349;

    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 4);

    osc1.start(ctx.currentTime);
    osc2.start(ctx.currentTime);
    osc1.stop(ctx.currentTime + 4);
    osc2.stop(ctx.currentTime + 4);
}