/*
Original Logic by Patt Vira (Sound Mini Series EP5)
*/

let size = 20;
let num = 10;
let grid = [];
let minVal = 50;

let mic;
let fft;
let spectrum = [];
let distFromCenter = [];
let audioStarted = false;
let bgMusic;
let stars = []; // Array to store star positions
let angleY = 0;
let angleX = 0;
let isBooting = false;
let bootStartTime = 0;

function preload() {
    bgMusic = loadSound('space.wav');
}

function setup() {
    canvas = createCanvas(800, 500, WEBGL);
    canvas.parent("p5-canvas-container");
    mic = new p5.AudioIn();
    fft = new p5.FFT(0.8, 1024);
    fft.setInput(mic);

    // Create a starfield
    for (let i = 0; i < 400; i++) {
        stars.push(new Star(i));
    }

    // Pre-calculate grid positions
    for (let i = 0; i < num; i++) {
        grid[i] = [];
        for (let j = 0; j < num; j++) {
            grid[i][j] = [];
            for (let k = 0; k < num; k++) {
                grid[i][j][k] = 0;

                let offset = size / 2 - (num / 2) * size;
                let x = i * size + offset;
                let y = j * size + offset;
                let z = k * size + offset;

                let distance = dist(x, y, z, 0, 0, 0);
                distFromCenter.push({ i, j, k, distance });
            }
        }
    }

    distFromCenter.sort(compareDistances);
}

function compareDistances(a, b) {
    return a.distance - b.distance;
}

function draw() {
    background(10, 5, 20);

    orbitControl();

    // Draw Stars (Dynamic Black Hole Effect)
    let vol = 0;
    if (audioStarted) {
        vol = mic.getLevel();
    }
    
    for (let s of stars) {
        s.update(vol);
        s.show();
    }

    // Floating Effect: The entire matrix floats up and down slowly
    let floatY = sin(frameCount * 0.01) * 20;
    translate(0, floatY, 0);

    // Always rotate slowly, accelerate with volume
    let rotationSpeed = 0.005 + vol * 0.1;
    angleY += rotationSpeed;
    angleX += 0.002;
    rotateY(angleY);
    rotateX(angleX);

    // Only analyze audio if started, otherwise show idle state
    if (audioStarted) {
        spectrum = fft.analyze();
    }

    let totalCubes = num * num * num;

    for (let i = 0; i < totalCubes; i++) {
        let pos = distFromCenter[i];

        let level = 0;
        if (audioStarted) {
            // Map spectrum index to sorted distance index
            let specIndex = floor(map(i, 0, totalCubes, 0, 150));
            level = spectrum[specIndex] || 0;
        } else {
            // Idle animation: subtle pulsing waves when waiting
            let d = pos.distance;
            level = map(sin(frameCount * 0.05 + d * 0.1), -1, 1, 0, 60);
        }

        grid[pos.i][pos.j][pos.k] = level;
    }

    // Center the grid
    let centerOffset = (num * size) / 2;
    let offset = size / 2 - (num / 2) * size;
    translate(offset, offset, offset);

    // Boot Animation Progress
    let bootProgress = 0;
    if (isBooting) {
        let elapsed = millis() - bootStartTime;
        bootProgress = elapsed / 2000; // 2 seconds duration
        if (bootProgress >= 1) {
            isBooting = false;
        }
    }

    // Draw Cubes
    for (let i = 0; i < num; i++) {
        for (let j = 0; j < num; j++) {
            for (let k = 0; k < num; k++) {

                let val = grid[i][j][k];

                // Force visibility during boot
                if (isBooting || val > minVal) {
                    push();
                    
                    // Black Hole Attraction Logic
                    let originalX = i * size;
                    let originalY = j * size;
                    let originalZ = k * size;
                    
                    // Calculate center of the grid in local coordinates
                    let cx = (num - 1) * size / 2;
                    let cy = (num - 1) * size / 2;
                    let cz = (num - 1) * size / 2;

                    // Attraction factor based on volume (0 to 1)
                    // Amplify volume effect
                    let attraction = map(vol, 0, 0.2, 0, 1.5, true); 
                    
                    // Interpolate position towards center
                    let x = lerp(originalX, cx, attraction);
                    let y = lerp(originalY, cy, attraction);
                    let z = lerp(originalZ, cz, attraction);

                    // Matrix Rain Boot Effect
                    if (isBooting) {
                        // Stagger the drop based on column (i, k)
                        let colDelay = (i + k) * 0.05;
                        let dropProgress = constrain((bootProgress - colDelay) * 2, 0, 1);
                        
                        // Ease out cubic
                        dropProgress = 1 - pow(1 - dropProgress, 3);
                        
                        // Start from high up (negative Y is up in WebGL usually, but let's check)
                        // Actually in p5 WebGL, Y+ is down. So we want them to fall from Y- (top).
                        let startY = -1000;
                        y = lerp(startY, y, dropProgress);
                    }

                    translate(x, y, z);

                    let alpha = map(val, minVal, 255, 20, 200);
                    strokeWeight(1.5);

                    // Color Palette Logic
                    if (isBooting) {
                        // Matrix Green Flash
                        stroke(0, 255, 0);
                        fill(0, 255, 0, 200);
                    } else if (val > 200) {
                        stroke(255, 0, 255); // Magenta
                        fill(255, 0, 255, alpha);
                    } else if (val > 120) {
                        stroke(0, 255, 255); // Cyan
                        fill(0, 255, 255, alpha / 2);
                    } else {
                        stroke(0, 255, 0, 100); // Matrix Green
                        noFill();
                    }

                    // Only draw if it's part of the boot sequence or has audio value
                    if (isBooting || val > minVal) {
                        box(size * 0.85);
                    }
                    pop();
                }
            }
        }
    }
}

function mousePressed() {
    if (!audioStarted) {
        userStartAudio().then(() => {
            mic.start();

            // Play background music
            if (bgMusic && bgMusic.isLoaded()) {
                bgMusic.setVolume(0.5);
                bgMusic.loop();
            }

            audioStarted = true;

            // Hide overlay
            const overlay = document.getElementById('overlay');
            if (overlay) overlay.style.display = 'none';

            // Show persistent control hints
            const hints = document.getElementById('control-hints');
            if (hints) hints.style.display = 'block';
        });
    }
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
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

        // Use Perlin noise for coordinates to create organic streams
        let r = map(noise(t), 0, 1, 200, 1500);
        let theta = map(noise(t + 100), 0, 1, 0, TWO_PI * 2);
        let phi = map(noise(t + 200), 0, 1, 0, PI);
        
        this.x = r * sin(phi) * cos(theta);
        this.y = r * sin(phi) * sin(theta);
        this.z = r * cos(phi);
        
        this.brightness = map(noise(t + 300), 0, 1, 100, 255);
        this.speed = map(noise(t + 400), 0, 1, 2, 10);
    }

    update(vol) {
        let speedMultiplier = 1 + vol * 50;
        
        // Simple movement towards origin
        this.x -= (this.x / 100) * this.speed * 0.1 * speedMultiplier;
        this.y -= (this.y / 100) * this.speed * 0.1 * speedMultiplier;
        this.z -= (this.z / 100) * this.speed * 0.1 * speedMultiplier;

        // If too close to center (event horizon), reset
        if (dist(this.x, this.y, this.z, 0, 0, 0) < 50) {
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