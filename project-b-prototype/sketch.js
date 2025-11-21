/**
 * OOP Refactor of Oscilloscope Art
 * separated into SoundEngine, Oscilloscope, and UserInterface classes.
 */


function setup() {
  let canvas = createCanvas(800, 500);
  canvas.parent("p5-canvas-container");
  background(0);
  colorMode(HSB, 360, 100, 100, 1.0);

  // Instantiate our objects
  let engine = new SoundEngine();
  let scope = new Oscilloscope();
  let ui = new UserInterface();
}

function draw() {
  // 1. Update Audio Engine based on mouse
  engine.update();

  // 2. Draw the Visuals
  // We pass the engine's data (waveform, playing state) to the scope
  scope.draw(engine.getWaveform(), engine.isPlaying());

  // 3. Draw UI
  ui.display(engine);
}

function mousePressed() {
  engine.togglePlay();
}

function keyPressed() {
  if (key === 'h' || key === 'H') {
    ui.toggleVisibility();
  }
  if (key === 't' || key === 'T') {
    engine.switchType();
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  background(0);
}

// ==========================================
// CLASS: SoundEngine
// Handles Oscillator and FFT analysis
// ==========================================
class SoundEngine {
  constructor() {
    this.types = ['sine', 'triangle', 'sawtooth', 'square'];
    this.typeIndex = 0;
    this.playing = false;

    // p5.Sound objects
    this.osc = new p5.Oscillator(this.types[this.typeIndex]);
    this.osc.amp(0);
    this.fft = new p5.FFT(0.8, 1024);
  }

  update() {
    if (this.playing) {
      // Map Mouse X -> Frequency (60Hz to 800Hz)
      let freq = map(mouseX, 0, width, 60, 800);
      this.osc.freq(freq, 0.1);

      // Map Mouse Y -> Amplitude (Volume)
      // height -> 0 (quiet), 0 -> 0.5 (loud)
      let amp = map(mouseY, height, 0, 0, 0.5);
      this.osc.amp(amp, 0.05);
    }
  }

  togglePlay() {
    if (!this.playing) {
      userStartAudio();
      this.osc.start();
      this.playing = true;
    } else {
      this.osc.stop();
      this.playing = false;
    }
  }

  switchType() {
    this.typeIndex = (this.typeIndex + 1) % this.types.length;
    this.osc.setType(this.types[this.typeIndex]);
  }

  // Getters
  isPlaying() { return this.playing; }
  getWaveform() { return this.fft.waveform(); }
  getTypeName() { return this.types[this.typeIndex]; }
  getCurrentFreq() { return floor(map(mouseX, 0, width, 60, 800)); }
}

// ==========================================
// CLASS: Oscilloscope
// Handles Lissajous math and Rendering
// ==========================================
class Oscilloscope {
  constructor() {
    this.t = 0; // Time variable for rotation
  }

  draw(waveform, isPlaying) {
    // Update time
    this.t += isPlaying ? 0.01 : 0.002;

    // 1. Draw Background Trails (Ghosting)
    blendMode(BLEND);
    noStroke();
    fill(0, 0, 0, 0.15);
    rect(0, 0, width, height);

    // 2. Prepare for Glowing Draw
    blendMode(ADD);
    
    // Calculate Shape Parameters
    let f1 = map(mouseX, 0, width, 1, 10);
    let f2 = map(mouseY, 0, height, 1, 10);
    let hue = map(mouseX, 0, width, 0, 360);
    let baseAmp = min(width, height) / 3.5;

    // Draw 3 layers: Glow, Body, Core
    let styles = [
      { weight: 20, alpha: 0.1, sat: 80, bright: 100 }, // Outer Glow
      { weight: 6,  alpha: 0.4, sat: 90, bright: 100 }, // Inner Color
      { weight: 2,  alpha: 1.0, sat: 0,  bright: 100 }  // White Core
    ];

    for (let s of styles) {
      this.drawLayer(s, hue, f1, f2, baseAmp, waveform, isPlaying);
    }
  }

  drawLayer(style, hue, f1, f2, amp, waveform, isPlaying) {
    strokeWeight(style.weight);
    stroke(hue, style.sat, style.bright, style.alpha);
    noFill();
    
    beginShape();
    let resolution = 500;
    
    for (let i = 0; i < resolution; i++) {
      let p = i / resolution;
      
      // Audio Reactivity Logic
      let audioMod = 0;
      if (isPlaying && waveform.length > 0) {
        let waveIndex = floor(map(i, 0, resolution, 0, waveform.length - 1));
        audioMod = waveform[waveIndex] * 150;
      }

      // Lissajous Math
      let angle1 = (p * TWO_PI * f1) + this.t;
      let angle2 = (p * TWO_PI * f2) + this.t;

      let x = width / 2 + cos(angle1) * (amp + audioMod);
      let y = height / 2 + sin(angle2) * (amp + audioMod);

      vertex(x, y);
    }
    endShape(CLOSE);
  }
}

// ==========================================
// CLASS: UserInterface
// Handles text and instructions
// ==========================================
class UserInterface {
  constructor() {
    this.visible = true;
  }

  toggleVisibility() {
    this.visible = !this.visible;
  }

  display(engine) {
    if (!this.visible) return;

    blendMode(BLEND);
    noStroke();
    textAlign(CENTER);
    
    // Status Text
    if (engine.isPlaying()) {
       fill(0, 0, 100);
       text("PLAYING (" + engine.getTypeName().toUpperCase() + ")", width/2, 40);
    } else {
       fill(0, 0, 100);
       textSize(18);
       text("CLICK TO START OSCILLATOR", width/2, height/2);
       textSize(12);
    }

    // Footer Info
    textAlign(LEFT);
    fill(120, 80, 80); 
    textSize(12);
    textFont('Courier New');
    
    text(`FREQ: ${engine.getCurrentFreq()}Hz | TYPE: ${engine.getTypeName()}`, 20, height - 60);
    text("MOUSE X: Frequency + Color", 20, height - 45);
    text("MOUSE Y: Amplitude + Shape", 20, height - 30);
    text("KEYS: 'T' switch wave | 'H' toggle UI", 20, height - 15);
  }
}