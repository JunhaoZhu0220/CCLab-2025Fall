// CCLab Mini Project - 9.R Particle World Template

let NUM_OF_PARTICLES = 50;
let MAX_OF_PARTICLES = 500;

let particles = [];
let currentBaseHue = 0;
let generationTargetCount = 0;
let bgMusic;
let started = false; // 标记是否已经开始

function preload() {
  bgMusic = loadSound('assets/bg-music.wav');
}

function setup() {
  let canvas = createCanvas(800, 500);
  canvas.parent("p5-canvas-container");
  background(0);
  frameRate(30);
  angleMode(DEGREES);
  ellipseMode(CENTER);
  colorMode(HSL, 100);
  currentBaseHue = random(100);
  bgMusic.setVolume(0.5);
}

function draw() {
  background(0, 0, 0, 4);
  translate(width / 2, height / 2);
  if (!started) {
    push();
    fill(255);
    textAlign(CENTER, CENTER);
    textSize(24);
    text("ENDLESS", 0, 0);
    pop();
    return;
  }

  particles.sort((a, b) => a.y - b.y);

  for (let i = particles.length - 1; i >= 0; i--) {
    let p = particles[i];
    p.update();
    p.display();

    if (p.isDead()) {
      particles.splice(i, 1);
    }
  }

  if (particles.length === 0 && generationTargetCount === 0) {
    currentBaseHue = random(100);
    generationTargetCount = NUM_OF_PARTICLES;
  }

  if (generationTargetCount > 0 && particles.length < MAX_OF_PARTICLES) {
    particles.push(new Particle(currentBaseHue));
    generationTargetCount--;
  }
}

function mousePressed() {
  // 用户点击后开始
  if (!started) {
    started = true;
    userStartAudio(); // 启用音频
    bgMusic.loop(); // 开始播放音乐
    generationTargetCount = NUM_OF_PARTICLES; // 开始生成粒子
  }
}


class Particle {
  constructor(baseHue) {
    this.t = random(360);
    this.speed = 1.5;

    this.a = width / 3;
    this.x = 0;
    this.y = 0;

    this.baseDia = random(10, 60);
    this.strokeW = random(0.1, 1);

    this.hue = baseHue + random(-7, 7);
    if (this.hue < 0) {
      this.hue += 100;
    } else if (this.hue > 100) {
      this.hue -= 100;
    }
    this.age = 0;
    this.maxLifespan = random(150, 250);
    this.lifeAlpha = 0.0;
    this.perspectiveScale = 1.0;
    this.perspectiveLight = 50;
    this.perspectiveStroke = 1.0;
    this.finalLightness = 0;
  }

  update() {
    this.t += this.speed;
    this.age += 1;
    this.a = width / 3;
    this.updatePosition();
    this.updateLifecycle();
    this.updatePerspective();

    this.finalLightness = this.perspectiveLight * this.lifeAlpha;
  }

  updatePosition() {
    let currentT = this.t;
    this.x = this.a * sqrt(2) * cos(currentT) / (pow(sin(currentT), 2) + 1);
    this.y = this.a * sqrt(2) * cos(currentT) * sin(currentT) / (pow(sin(currentT), 2) + 1);
  }

  updateLifecycle() {
    let fadeInDuration = this.maxLifespan * 0.2;
    let fadeOutStartTime = this.maxLifespan * 0.7;

    if (this.age < fadeInDuration) {
      this.lifeAlpha = map(this.age, 0, fadeInDuration, 0, 1);
    } else if (this.age > fadeOutStartTime) {
      this.lifeAlpha = map(this.age, fadeOutStartTime, this.maxLifespan, 1, 0);
    } else {
      this.lifeAlpha = 1.0;
    }
  }

  updatePerspective() {
    let yRange = this.a / 2;

    this.perspectiveScale = map(this.y, -yRange, yRange, 0.5, 1.5);
    this.perspectiveLight = map(this.y, -yRange, yRange, 50, 80);
    this.perspectiveStroke = map(this.y, -yRange, yRange, this.strokeW * 0.4, this.strokeW * 1.3);
  }

  display() {
    push();
    translate(this.x, this.y);

    noFill();
    stroke(this.hue, 80, this.finalLightness);
    strokeWeight(this.perspectiveStroke);

    let base = this.baseDia * this.perspectiveScale;
    circle(0, 0, base * 0.3);
    circle(0, 0, base * 0.8);
    circle(0, 0, base);

    pop();
  }

  isDead() {
    return this.age > this.maxLifespan;
  }
}