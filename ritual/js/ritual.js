let canvas, ctx;
let width, height, cx, cy;
let particles = [];
let runes = ["ᚠ", "ᚢ", "ᚦ", "ᚨ", "ᚱ", "ᚲ", "ᚷ", "ᚹ", "ᚺ", "ᚾ", "ᛁ", "ᛃ"];
let rune_angles = [];
let rune_pulses = [];
let sigil_rotation = 0;
let frame = 0;
let running = false;

function start_ritual() {
    document.getElementById("start-btn").style.display = "none";
    running = true;
    setup();
    schedule_sounds();
    requestAnimationFrame(animate);
}

function setup() {
    canvas = document.getElementById("ritual-canvas");
    ctx = canvas.getContext("2d");
    resize();
    window.addEventListener("resize", resize);
    for (let i = 0; i < runes.length; i++) {
        rune_angles.push((i / runes.length) * Math.PI * 2);
        rune_pulses.push(Math.random() * Math.PI * 2);
    }
    for (let i = 0; i < 120; i++) {
        spawn_particle();
    }
}

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    width = canvas.width;
    height = canvas.height;
    cx = width / 2;
    cy = height / 2;
}

function spawn_particle() {
    let angle = Math.random() * Math.PI * 2;
    let radius = 200 + Math.random() * 300;
    particles.push({
        x: cx + Math.cos(angle) * radius,
        y: cy + Math.sin(angle) * radius,
        angle: angle,
        radius: radius,
        speed: 0.003 + Math.random() * 0.004,
        size: 0.5 + Math.random() * 2,
        opacity: 0.3 + Math.random() * 0.7,
        color: Math.random() < 0.6 ? "#c9a84c" : "#7b2d8b"
    });
}

function animate() {
    if (!running) return;
    requestAnimationFrame(animate);
    frame++;
    ctx.fillStyle = "rgba(0, 0, 0, 0.15)";
    ctx.fillRect(0, 0, width, height);
    sigil_rotation += 0.002;
    draw_outer_circle();
    draw_sigil();
    draw_runes();
    update_particles();
    draw_particles();
    draw_center_glow();
}

function draw_outer_circle() {
    ctx.beginPath();
    ctx.arc(cx, cy, 180, 0, Math.PI * 2);
    ctx.strokeStyle = "#3d1f5a";
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx, cy, 182, 0, Math.PI * 2);
    ctx.strokeStyle = "#7b2d8b22";
    ctx.lineWidth = 3;
    ctx.stroke();
}

function draw_sigil() {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(sigil_rotation);
    let points = 6;
    let r1 = 140;
    let r2 = 70;
    ctx.beginPath();
    for (let i = 0; i <= points * 2; i++) {
        let angle = (i / (points * 2)) * Math.PI * 2 - Math.PI / 2;
        let r = i % 2 === 0 ? r1 : r2;
        let x = Math.cos(angle) * r;
        let y = Math.sin(angle) * r;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.strokeStyle = "#c9a84c44";
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.rotate(-sigil_rotation * 2);
    ctx.beginPath();
    for (let i = 0; i <= points * 2; i++) {
        let angle = (i / (points * 2)) * Math.PI * 2 - Math.PI / 2;
        let r = i % 2 === 0 ? r1 : r2;
        let x = Math.cos(angle) * r;
        let y = Math.sin(angle) * r;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.strokeStyle = "#7b2d8b44";
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();
}

function draw_runes() {
    ctx.font = "16px serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    for (let i = 0; i < runes.length; i++) {
        rune_angles[i] += 0.001;
        rune_pulses[i] += 0.03;
        let pulse = 0.4 + Math.sin(rune_pulses[i]) * 0.3;
        let x = cx + Math.cos(rune_angles[i]) * 200;
        let y = cy + Math.sin(rune_angles[i]) * 200;
        ctx.fillStyle = "rgba(201, 168, 76, " + pulse + ")";
        ctx.fillText(runes[i], x, y);
    }
}

function update_particles() {
    for (let i = particles.length - 1; i >= 0; i--) {
        let p = particles[i];
        p.radius -= p.speed * p.radius * 0.015;
        p.angle += p.speed * 1.5;
        p.x = cx + Math.cos(p.angle) * p.radius;
        p.y = cy + Math.sin(p.angle) * p.radius;
        if (p.radius < 15) {
            particles.splice(i, 1);
            spawn_particle();
        }
    }

}

function draw_particles() {
    for (let p of particles) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.opacity * (p.radius / 500);
        ctx.fill();
    }
    ctx.globalAlpha = 1;
}

function draw_center_glow() {
    let pulse = Math.sin(frame * 0.05) * 0.3 + 0.7;
    let gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, 80);
    gradient.addColorStop(0, "rgba(123, 45, 139, " + pulse * 0.9 + ")");
    gradient.addColorStop(0.3, "rgba(123, 45, 139, " + pulse * 0.5 + ")");
    gradient.addColorStop(0.7, "rgba(201, 168, 76, " + pulse * 0.15 + ")");
    gradient.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.beginPath();
    ctx.arc(cx, cy, 80, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();
}

function schedule_sounds() {
  start_ambient_hum();

  function pulse_loop() {
    if (!running) return;
    play_deep_pulse();
    setTimeout(pulse_loop, 2000 + Math.random() * 2000);
  }

  function bell_loop() {
    if (!running) return;
    play_bell();
    setTimeout(bell_loop, 20000 + Math.random() * 20000);
  }
  setTimeout(pulse_loop, 1000);
  setTimeout(bell_loop, 5000 + Math.random() * 10000);
}