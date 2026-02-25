/**
 * Neon Pulse: Kinetic Orbit Defense
 * Core Game Engine
 */

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const levelEl = document.getElementById('level');
const finalScoreEl = document.getElementById('final-score');
const startScreen = document.getElementById('start-screen');
const gameOverScreen = document.getElementById('game-over-screen');
const startBtn = document.getElementById('start-btn');
const restartBtn = document.getElementById('restart-btn');

// Game State
let state = {
    running: false,
    score: 0,
    level: 1,
    lastTime: 0,
    mouse: { x: 0, y: 0, angle: 0 },
    entities: {
        player: null,
        pulses: [],
        particles: []
    }
};

// Configuration
const CONFIG = {
    CORE_RADIUS: 40,
    SHIELD_RADIUS: 120,
    SHIELD_WIDTH: 15,
    SHIELD_ARC: Math.PI / 2.5,
    PULSE_SPEED: 2,
    SPAWN_RATE: 2000,
    COLORS: {
        cyan: '#00f2ff',
        magenta: '#ff00ff',
        gold: '#ffcc00',
        bg: '#050508'
    }
};

class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.vx = (Math.random() - 0.5) * 8;
        this.vy = (Math.random() - 0.5) * 8;
        this.life = 1.0;
        this.decay = 0.02 + Math.random() * 0.02;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life -= this.decay;
        this.vx *= 0.95;
        this.vy *= 0.95;
    }

    draw() {
        ctx.save();
        ctx.globalAlpha = this.life;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

class Pulse {
    constructor() {
        const side = Math.floor(Math.random() * 4);
        const margin = 100;
        
        switch(side) {
            case 0: // Top
                this.x = Math.random() * canvas.width;
                this.y = -margin;
                break;
            case 1: // Right
                this.x = canvas.width + margin;
                this.y = Math.random() * canvas.height;
                break;
            case 2: // Bottom
                this.x = Math.random() * canvas.width;
                this.y = canvas.height + margin;
                break;
            case 3: // Left
                this.x = -margin;
                this.y = Math.random() * canvas.height;
                break;
        }

        const angle = Math.atan2(canvas.height / 2 - this.y, canvas.width / 2 - this.x);
        const speed = CONFIG.PULSE_SPEED + (state.level * 0.5);
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        this.radius = 8;
        this.active = true;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;

        // Check distance to center
        const dx = this.x - canvas.width / 2;
        const dy = this.y - canvas.height / 2;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // Core hit
        if (dist < CONFIG.CORE_RADIUS) {
            this.active = false;
            gameOver();
        }

        // Shield hit detected in main loop
    }

    draw() {
        ctx.save();
        ctx.shadowBlur = 15;
        ctx.shadowColor = CONFIG.COLORS.magenta;
        ctx.fillStyle = CONFIG.COLORS.magenta;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Inner glow
        ctx.shadowBlur = 0;
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius * 0.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

function resize() {
    canvas.width = canvas.parentElement.clientWidth;
    canvas.height = canvas.parentElement.clientHeight;
}

function init() {
    state.score = 0;
    state.level = 1;
    state.entities.pulses = [];
    state.entities.particles = [];
    scoreEl.textContent = '00000';
    levelEl.textContent = '1';
    resize();
    
    // Start spawn loop
    if (state.running) {
        spawnPulse();
    }
}

function spawnPulse() {
    if (!state.running) return;
    state.entities.pulses.push(new Pulse());
    const nextSpawn = Math.max(500, CONFIG.SPAWN_RATE - (state.level * 100));
    setTimeout(spawnPulse, nextSpawn);
}

function explode(x, y, color) {
    for (let i = 0; i < 15; i++) {
        state.entities.particles.push(new Particle(x, y, color));
    }
}

function update(time) {
    if (!state.running) return;
    
    const deltaTime = time - state.lastTime;
    state.lastTime = time;

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    // Update particles
    state.entities.particles = state.entities.particles.filter(p => {
        p.update();
        return p.life > 0;
    });

    // Update pulses
    state.entities.pulses = state.entities.pulses.filter(pulse => {
        pulse.update();
        
        // Shield Collision
        const dx = pulse.x - centerX;
        const dy = pulse.y - centerY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (Math.abs(dist - CONFIG.SHIELD_RADIUS) < pulse.radius + CONFIG.SHIELD_WIDTH / 2) {
            const angle = Math.atan2(dy, dx);
            const normalizedAngle = (angle + Math.PI * 2) % (Math.PI * 2);
            const startAngle = (state.mouse.angle - CONFIG.SHIELD_ARC / 2 + Math.PI * 2) % (Math.PI * 2);
            const endAngle = (state.mouse.angle + CONFIG.SHIELD_ARC / 2 + Math.PI * 2) % (Math.PI * 2);
            
            let inRange = false;
            if (startAngle < endAngle) {
                inRange = normalizedAngle >= startAngle && normalizedAngle <= endAngle;
            } else {
                inRange = normalizedAngle >= startAngle || normalizedAngle <= endAngle;
            }

            if (inRange) {
                explode(pulse.x, pulse.y, CONFIG.COLORS.cyan);
                state.score += 100;
                scoreEl.textContent = state.score.toString().padStart(5, '0');
                
                if (state.score % 1000 === 0) {
                    state.level++;
                    levelEl.textContent = state.level;
                }
                return false;
            }
        }
        
        return pulse.active;
    });

    draw();
    requestAnimationFrame(update);
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    // Build central core
    ctx.save();
    ctx.shadowBlur = 20;
    ctx.shadowColor = CONFIG.COLORS.cyan;
    ctx.strokeStyle = CONFIG.COLORS.cyan;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(centerX, centerY, CONFIG.CORE_RADIUS, 0, Math.PI * 2);
    ctx.stroke();
    
    // Core Pulse Effect
    const pulseMag = Math.sin(Date.now() / 500) * 10;
    ctx.globalAlpha = 0.3;
    ctx.beginPath();
    ctx.arc(centerX, centerY, CONFIG.CORE_RADIUS + pulseMag, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Draw Shield
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(state.mouse.angle);
    ctx.shadowBlur = 15;
    ctx.shadowColor = CONFIG.COLORS.cyan;
    ctx.strokeStyle = CONFIG.COLORS.cyan;
    ctx.lineWidth = CONFIG.SHIELD_WIDTH;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(0, 0, CONFIG.SHIELD_RADIUS, -CONFIG.SHIELD_ARC / 2, CONFIG.SHIELD_ARC / 2);
    ctx.stroke();
    ctx.restore();

    // Draw Entities
    state.entities.pulses.forEach(p => p.draw());
    state.entities.particles.forEach(p => p.draw());
}

function handleInput(e) {
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || (e.touches && e.touches[0].clientX)) - rect.left;
    const y = (e.clientY || (e.touches && e.touches[0].clientY)) - rect.top;
    
    state.mouse.x = x;
    state.mouse.y = y;
    
    state.mouse.angle = Math.atan2(y - canvas.height / 2, x - canvas.width / 2);
}

function gameOver() {
    state.running = false;
    finalScoreEl.textContent = state.score;
    gameOverScreen.classList.add('active');
}

function startGame() {
    startScreen.classList.remove('active');
    gameOverScreen.classList.remove('active');
    state.running = true;
    init();
    requestAnimationFrame(update);
}

// Listeners
window.addEventListener('resize', resize);
window.addEventListener('mousemove', handleInput);
window.addEventListener('touchstart', handleInput);
window.addEventListener('touchmove', handleInput);

startBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', startGame);

resize();
draw();
