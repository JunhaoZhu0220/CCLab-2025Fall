class AudioManager {
    constructor() {
        this.mic = new p5.AudioIn();
        this.fft = new p5.FFT(0.8, 1024);
        this.spectrum = [];
        this.isStarted = false;
        this.bgMusic = null;
        this.fft.setInput(this.mic);
    }

    preload() {
        this.bgMusic = loadSound('space.wav');
    }

    start() {
        this.mic.start();
        if (this.bgMusic && this.bgMusic.isLoaded()) {
            this.bgMusic.setVolume(0.5);
            this.bgMusic.loop();
        }
        this.isStarted = true;
    }

    update() {
        if (this.isStarted) {
            this.spectrum = this.fft.analyze();
            return this.mic.getLevel();
        }
        return 0;
    }

    getFreqLevel(index) {
        return this.isStarted ? (this.spectrum[index] || 0) : 0;
    }
}

class WaveGrid {
    constructor(cols, rows, size, margin, scl, speed) {
        this.cols = cols;
        this.rows = rows;
        this.size = size;
        this.margin = margin;
        this.scl = scl;
        this.speed = speed;
        this.boxes = [];
        this.initialize();
    }

    initialize() {
        for (let i = 0; i < this.cols; i++) {
            this.boxes[i] = [];
            for (let j = 0; j < this.rows; j++) {
                let x = -width/2 + this.margin + this.size/2 + i * this.size;
                let y = -height/2 + this.margin + this.size/2 + j * this.size;
                let distance = dist(x, y, 0, 0);
                let angle = map(distance, 0, width/2, 0, TWO_PI * 2);
                let hue = map(distance, 0, width/2, 120, 280);
                this.boxes[i][j] = new Box(x, y, 0, angle, this.scl, this.speed, hue);
            }
        }
    }

    update(vol, audio) {
        for (let i = 0; i < this.cols; i++) {
            for (let j = 0; j < this.rows; j++) {
                let freqIndex = floor(map(i * this.cols + j, 0, this.cols * this.rows, 0, 128));
                let freqLevel = audio.getFreqLevel(freqIndex);
                this.boxes[i][j].update(vol, freqLevel);
            }
        }
    }

    display(bootProgress, isBooting) {
        for (let i = 0; i < this.cols; i++) {
            for (let j = 0; j < this.rows; j++) {
                this.boxes[i][j].display(bootProgress, isBooting);
            }
        }
    }

    getAverageZ() {
        let total = 0;
        for (let i = 0; i < this.cols; i++) {
            for (let j = 0; j < this.rows; j++) {
                total += this.boxes[i][j].z;
            }
        }
        return total / (this.cols * this.rows);
    }
}

class StarField {
    constructor(count = 400) {
        this.stars = [];
        for (let i = 0; i < count; i++) {
            this.stars.push(new Star(i));
        }
    }

    update(vol, blackHoleStrength) {
        for (let s of this.stars) {
            s.update(vol, blackHoleStrength);
        }
    }

    display() {
        for (let s of this.stars) {
            s.show();
        }
    }
}

class BootManager {
    constructor() {
        this.isBooting = false;
        this.startTime = 0;
    }

    start() {
        this.isBooting = true;
        this.startTime = millis();
    }

    update() {
        if (this.isBooting) {
            let elapsed = millis() - this.startTime;
            let progress = elapsed / 2000;
            if (progress >= 1) {
                this.isBooting = false;
            }
            return progress;
        }
        return 0;
    }

    isActive() {
        return this.isBooting;
    }
}

class BlackHole {
    constructor() {
        this.strength = 0;
        this.waveDirection = 0;
        this.prevAverageZ = 0;
    }

    update(averageZ, vol) {
        this.waveDirection = averageZ - this.prevAverageZ;
        this.prevAverageZ = averageZ;

        if (this.waveDirection < 0) {
            this.strength = map(abs(this.waveDirection), 0, 2, 0, 1);
            this.strength = constrain(this.strength * (1 + vol * 3), 0, 1);
        } else {
            this.strength *= 0.95;
        }
    }

    getStrength() {
        return this.strength;
    }
}

let audioManager;
let waveGrid;
let starField;
let bootManager;
let blackHole;
let angleY = 0;

function preload() {
    audioManager = new AudioManager();
    audioManager.preload();
}

function setup() {
    createCanvas(800, 500, WEBGL);
    canvas.parent("p5-canvas-container");

    let cols = floor((width - 100) / 12);
    let rows = floor((height - 100) / 12);
    
    waveGrid = new WaveGrid(cols, rows, 12, 50, 60, 0.03);
    starField = new StarField(400);
    bootManager = new BootManager();
    blackHole = new BlackHole();
}

function draw() {
    background(10, 5, 20);
    orbitControl();

    let vol = audioManager.update();

    starField.update(vol, blackHole.strength);
    starField.display();

    let floatY = sin(frameCount * 0.01) * 10;
    translate(0, floatY, 0);

    let rotationSpeed = 0.003 + vol * 0.05;
    angleY += rotationSpeed;
    rotateX(PI/4);
    rotateZ(angleY);

    let bootProgress = bootManager.update();

    waveGrid.update(vol, audioManager);
    waveGrid.display(bootProgress, bootManager.isActive());

    let averageZ = waveGrid.getAverageZ();
    blackHole.update(averageZ, vol);
}

function mousePressed() {
    if (!audioManager.isStarted) {
        userStartAudio().then(() => {
            audioManager.start();
            bootManager.start();

            const overlay = document.getElementById('overlay');
            if (overlay) overlay.style.display = 'none';

            const hints = document.getElementById('control-hints');
            if (hints) hints.style.display = 'block';
        });
    }
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
}

class Box {
    constructor(x, y, z, angle, scl, speed, hue) {
        this.x = x;
        this.y = y;
        this.z = z;
        this.angle = angle;
        this.scl = scl;
        this.speed = speed;
        this.baseHue = hue;
        this.currentHue = hue;
        this.freqLevel = 0;
    }

    update(vol, freqLevel) {
        this.freqLevel = freqLevel;
        let waveSpeed = this.speed * (1 + vol * 3);
        this.angle += waveSpeed;

        let waveAmplitude = this.scl * (1 + vol * 5);
        let freqBoost = map(freqLevel, 0, 255, 0, 30);
        let hueShift = map(freqLevel, 0, 255, 0, 120);

        this.currentHue = (this.baseHue + hueShift) % 360;
        this.z = sin(this.angle) * waveAmplitude + freqBoost;
    }

    display(bootProgress, isBooting) {
        push();
        translate(this.x, this.y, this.z);

        if (isBooting) {
            let targetZ = sin(this.angle) * (this.scl * 6) + map(this.freqLevel, 0, 255, 0, 30);
            translate(0, 0, lerp(-200, 0, bootProgress) - this.z);
        }

        colorMode(HSB, 360, 100, 100, 255);

        let heightHue = map(this.z, -this.scl * 2, this.scl * 2, this.currentHue - 20, this.currentHue + 20);
        let saturation = map(this.freqLevel, 0, 255, 50, 100);
        let baseBrightness = map(this.z, -this.scl, this.scl, 40, 90);
        let freqBrightness = map(this.freqLevel, 0, 255, 0, 30);
        let brightness = min(baseBrightness + freqBrightness, 100);
        let alpha = map(this.freqLevel, 0, 255, 120, 255);

        let baseSize = map(this.z, -this.scl, this.scl, 12 * 0.6, 12 * 1.2);
        let freqSize = map(this.freqLevel, 0, 255, 0, 12 * 0.3);
        let boxSize = baseSize + freqSize;

        strokeWeight(map(this.freqLevel, 0, 255, 0.5, 2));
        stroke(heightHue, saturation, brightness);
        fill(heightHue, saturation * 0.9, brightness * 0.85, alpha);

        box(boxSize);
        colorMode(RGB, 255);
        pop();
    }
}

class Star {
    constructor(i) {
        this.index = i;
        this.noiseOffset = 0;
        this.reset();
    }

    reset() {
        this.noiseOffset += 1000;
        let t = this.index * 0.1 + this.noiseOffset;

        let r = map(noise(t), 0, 1, 300, 1200);
        let theta = map(noise(t + 100), 0, 1, 0, TWO_PI * 2);
        let phi = map(noise(t + 200), 0, 1, 0, PI);

        this.x = r * sin(phi) * cos(theta);
        this.y = r * sin(phi) * sin(theta);
        this.z = r * cos(phi);

        this.vx = 0;
        this.vy = 0;
        this.vz = 0;

        this.brightness = map(noise(t + 300), 0, 1, 150, 255);
        this.baseSpeed = map(noise(t + 400), 0, 1, 0.5, 2);
    }

    update(vol, blackHoleStrength) {
        let dx = -this.x;
        let dy = -this.y;
        let dz = -this.z;
        let distToCenter = dist(this.x, this.y, this.z, 0, 0, 0);

        if (distToCenter > 0) {
            dx /= distToCenter;
            dy /= distToCenter;
            dz /= distToCenter;
        }

        let pullStrength = blackHoleStrength * 8 * (1 + vol * 5);
        let proximityBoost = map(distToCenter, 50, 800, 3, 0.5);
        pullStrength *= proximityBoost;

        this.vx += dx * pullStrength * 0.1;
        this.vy += dy * pullStrength * 0.1;
        this.vz += dz * pullStrength * 0.1;

        let drift = this.baseSpeed * 0.3;
        this.vx += dx * drift * 0.05;
        this.vy += dy * drift * 0.05;
        this.vz += dz * drift * 0.05;

        let damping = blackHoleStrength > 0.1 ? 0.98 : 0.95;
        this.vx *= damping;
        this.vy *= damping;
        this.vz *= damping;

        this.x += this.vx;
        this.y += this.vy;
        this.z += this.vz;

        if (distToCenter < 30 + blackHoleStrength * 20) {
            this.reset();
        }
    }

    show() {
        push();
        stroke(255, this.brightness);
        strokeWeight(2);
        point(this.x, this.y, this.z);
        pop();
    }
}