/*
Original Logic by Patt Vira (Sound Mini Series EP5)
Modified for Microphone Input & Retro Style
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

function setup() {
    canvas = createCanvas(800, 500, WEBGL);
    canvas.parent("p5-canvas-container");
    mic = new p5.AudioIn();
    fft = new p5.FFT(0.8, 1024);
    fft.setInput(mic);

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

    // Always rotate slowly
    rotateY(frameCount * 0.005);
    rotateX(frameCount * 0.002);

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
    let offset = size / 2 - (num / 2) * size;
    translate(offset, offset, offset);

    // Draw Cubes
    for (let i = 0; i < num; i++) {
        for (let j = 0; j < num; j++) {
            for (let k = 0; k < num; k++) {

                let val = grid[i][j][k];

                if (val > minVal) {
                    push();
                    translate(i * size, j * size, k * size);

                    let alpha = map(val, minVal, 255, 20, 200);
                    strokeWeight(1.5);

                    // Color Palette Logic
                    if (val > 200) {
                        stroke(255, 0, 255); // Magenta
                        fill(255, 0, 255, alpha);
                    } else if (val > 120) {
                        stroke(0, 255, 255); // Cyan
                        fill(0, 255, 255, alpha / 2);
                    } else {
                        stroke(0, 255, 0, 100); // Matrix Green
                        noFill();
                    }

                    box(size * 0.85);
                    pop();
                }
            }
        }
    }
}

function mousePressed() {
    if (!audioStarted) {
        userStartAudio();
        mic.start();
        audioStarted = true;

        // Hide overlay
        const overlay = document.getElementById('overlay');
        if (overlay) overlay.style.display = 'none';
    }
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
}