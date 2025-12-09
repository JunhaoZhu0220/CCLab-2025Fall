let boxes = [];
let size = 12;
let cols, rows;
let margin = 50;
let scl = 60;
let speed = 0.03;

let mic;
let fft;
let spectrum = [];
let audioStarted = false;
let bgMusic;
let stars = [];
let angleY = 0;
let angleX = 0;
let isBooting = false;
let bootStartTime = 0;


let waveDirection = 0;
let blackHoleStrength = 0;
let prevAverageZ = 0;

function preload() {
    bgMusic = loadSound('space.wav');
}

function setup() {
    canvas = createCanvas(800, 500, WEBGL);
    canvas.parent("p5-canvas-container");
    mic = new p5.AudioIn();
    fft = new p5.FFT(0.8, 1024);
    fft.setInput(mic);
    for (let i = 0; i < 400; i++) {
        stars.push(new Star(i));
    }
    cols = floor((width - margin * 2) / size);
    rows = floor((height - margin * 2) / size);
    
    for (let i = 0; i < cols; i++) {
        boxes[i] = [];
        for (let j = 0; j < rows; j++) {
            let x = -width/2 + margin + size/2 + i * size;
            let y = -height/2 + margin + size/2 + j * size;
            let z = 0;
            let distance = dist(x, y, 0, 0);
            let angle = map(distance, 0, width/2, 0, TWO_PI * 2);
            let hue = map(distance, 0, width/2, 120, 280);
            boxes[i][j] = new Box(x, y, z, angle, scl, speed, hue);
        }
    }
}

function draw() {
    background(10, 5, 20);

    orbitControl();

    // Get audio level
    let vol = 0;
    if (audioStarted) {
        vol = mic.getLevel();
        spectrum = fft.analyze();
    }
    
    // Calculate average wave height to determine direction
    let totalZ = 0;
    let count = 0;
    for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
            totalZ += boxes[i][j].z;
            count++;
        }
    }
    let averageZ = totalZ / count;
    
    waveDirection = averageZ - prevAverageZ;
    prevAverageZ = averageZ;
    
    if (waveDirection < 0) {
        blackHoleStrength = map(abs(waveDirection), 0, 2, 0, 1);
        blackHoleStrength = constrain(blackHoleStrength * (1 + vol * 3), 0, 1);
    } else {
        blackHoleStrength *= 0.95;
    }
    
    for (let s of stars) {
        s.update(vol, blackHoleStrength);
        s.show();
    }

    let floatY = sin(frameCount * 0.01) * 10;
    translate(0, floatY, 0);
    
    let rotationSpeed = 0.003 + vol * 0.05;
    angleY += rotationSpeed;
    rotateX(PI/4);
    rotateZ(angleY);

    let bootProgress = 0;
    if (isBooting) {
        let elapsed = millis() - bootStartTime;
        bootProgress = elapsed / 2000;
        if (bootProgress >= 1) {
            isBooting = false;
        }
    }

    for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
            let freqIndex = floor(map(i * cols + j, 0, cols * rows, 0, 128));
            let freqLevel = audioStarted ? (spectrum[freqIndex] || 0) : 0;
            
            boxes[i][j].update(vol, freqLevel, bootProgress, isBooting);
            boxes[i][j].display();
        }
    }
}

function mousePressed() {
    if (!audioStarted) {
        userStartAudio().then(() => {
            mic.start();

            if (bgMusic && bgMusic.isLoaded()) {
                bgMusic.setVolume(0.5);
                bgMusic.loop();
            }

            audioStarted = true;

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
        this.originalZ = z;
    }
    
    update(vol, freqLevel, bootProgress, isBooting) {
        this.freqLevel = freqLevel;
        let waveSpeed = this.speed * (1 + vol * 3);
        this.angle += waveSpeed;
        let waveAmplitude = this.scl * (1 + vol * 5);
        let freqBoost = map(freqLevel, 0, 255, 0, 30);
        let hueShift = map(freqLevel, 0, 255, 0, 120);
        this.currentHue = (this.baseHue + hueShift) % 360;
        
        if (isBooting) {
            let targetZ = sin(this.angle) * waveAmplitude + freqBoost;
            this.z = lerp(-200, targetZ, bootProgress);
        } else {
            this.z = sin(this.angle) * waveAmplitude + freqBoost;
        }
    }
    
    display() {
        push();
        translate(this.x, this.y, this.z);
        colorMode(HSB, 360, 100, 100, 255);
        let heightHue = map(this.z, -scl * 2, scl * 2, this.currentHue - 20, this.currentHue + 20);
        let saturation = map(this.freqLevel, 0, 255, 50, 100);
        let baseBrightness = map(this.z, -scl, scl, 40, 90);
        let freqBrightness = map(this.freqLevel, 0, 255, 0, 30);
        let brightness = min(baseBrightness + freqBrightness, 100);
        let alpha = map(this.freqLevel, 0, 255, 120, 255);
        let baseSize = map(this.z, -scl, scl, size * 0.6, size * 1.2);
        let freqSize = map(this.freqLevel, 0, 255, 0, size * 0.3);
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