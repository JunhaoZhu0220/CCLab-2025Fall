/*
  Check our the GOAL and the RULES of this exercise at the bottom of this file.
  
  After that, follow these steps before you start coding:

  1. rename the dancer class to reflect your name (line 35).
  2. adjust line 20 to reflect your dancer's name, too.
  3. run the code and see if a square (your dancer) appears on the canvas.
  4. start coding your dancer inside the class that has been prepared for you.
  5. have fun.
*/

let dancer;

function setup() {
  // no adjustments in the setup function needed...
  let canvas = createCanvas(windowWidth, windowHeight);
  canvas.parent("p5-canvas-container");

  // ...except to adjust the dancer's name on the next line:
  dancer = new CactusDancer(width / 2, height / 2);
}

function draw() {
  // you don't need to make any adjustments inside the draw loop
  background(0);
  drawFloor(); // for reference only

  dancer.update();
  dancer.display();
}

// You only code inside this class.
// Start by giving the dancer your name, e.g. LeonDancer.
class CactusDancer {
  constructor(startX, startY) {
    this.x = startX;
    this.y = startY;
    // Three colors for the pot
    this.potCol1 = color(177, 102, 51);
    this.potCol2 = color(199, 135, 77);
    this.potCol3 = color(211, 154, 98);
    // Color for the cactus body
    this.cactusCol = color(90, 141, 23);
    // Color for spikes
    this.spikeCol = color('red');

    // Body sway parameters
    this.swayAngle = 0;
    this.swaySpeed = 0.05;
    this.swayAmount = 0.15;

    // Arm movement parameters
    this.armLength = 80;
    this.armWaveAmplitude = 10;
    this.armWaveSegments = 30;




  }
  update() {
    this.swayAngle += this.swaySpeed;
  }

  display() {
    // the push and pop, along with the translate 
    // places your whole dancer object at this.x and this.y.
    // you may change its position on line 19 to see the effect.
    push();
    translate(this.x, this.y);

    // ******** //
    // ⬇️ draw your dancer from here ⬇️

    push();
    translate(0, 40);
    rotate(sin(this.swayAngle) * this.swayAmount);
    translate(0, -40);
    this.drawCactusBody(0, -10);
    this.drawArms(0, 0);
    // Left Eye
    this.drawEyes(-10, -30);
    // Right Eye
    this.drawEyes(10, -30);
    // Mouth
    this.drawMouth(0, 5);
    // Spikes
    this.drawSpikesRight(30, -50);
    this.drawSpikesRight(30, -40);
    this.drawSpikesRight(30, -30);
    this.drawSpikesLeft(-30, -50);
    this.drawSpikesLeft(-30, -40);
    this.drawSpikesLeft(-30, -30);
    pop();

    this.drawPot(0, 40);

    // ⬆️ draw your dancer above ⬆️
    // ******** //


    pop();
  }

  drawPot(potX, potY) {
    noStroke();
    let steps = 50;

    rectMode(CORNER);
    for (let i = 0; i < steps; i++) {
      let t = i / steps;
      let c;

      if (t < 0.5) {
        c = lerpColor(this.potCol1, this.potCol2, t * 2);
      } else {
        c = lerpColor(this.potCol2, this.potCol3, (t - 0.5) * 2);
      }

      fill(c);
      let x = potX - 60 + (120 / steps) * i;
      let w = 120 / steps + 1;
      rect(x, potY - 10, w, 20);
    }

    for (let i = 0; i < steps; i++) {
      let t = i / steps;
      let c;

      if (t < 0.5) {
        c = lerpColor(this.potCol1, this.potCol2, t * 2);
      } else {
        c = lerpColor(this.potCol2, this.potCol3, (t - 0.5) * 2);
      }

      fill(c);

      let topLeft = potX - 55 + (110 / steps) * i;
      let topRight = potX - 55 + (110 / steps) * (i + 1);
      let bottomLeft = potX - 40 + (80 / steps) * i;
      let bottomRight = potX - 40 + (80 / steps) * (i + 1);

      quad(topLeft, potY + 10, topRight, potY + 10, bottomRight, potY + 60, bottomLeft, potY + 60);
    }

    rectMode(CORNER);

  }

  drawCactusBody(bodyX, bodyY) {
    noStroke();
    fill(this.cactusCol);
    rectMode(CENTER);
    rect(bodyX, bodyY, 60, 150, 80);
    rectMode(CORNER);
  }

  drawArms(bodyX, bodyY) {
    strokeWeight(20);
    stroke(this.cactusCol);
    noFill();
    // Left Arm
    beginShape();
    for (let i = 0; i <= this.armWaveSegments; i++) {
      let t = i / this.armWaveSegments;
      let x = bodyX - t * this.armLength;
      let y = bodyY + sin(t * PI * 2 + this.swayAngle * 2) * this.armWaveAmplitude;
      vertex(x, y);
    }
    endShape();
    // Right Arm
    beginShape();
    for (let i = 0; i <= this.armWaveSegments; i++) {
      let t = i / this.armWaveSegments;
      let x = bodyX + t * this.armLength;
      let y = bodyY + cos(t * PI * 2 + PI + this.swayAngle * 2) * this.armWaveAmplitude;
      vertex(x, y);
    }
    endShape();
  }

  drawEyes(eyeX, eyeY) {
    fill(0);
    noStroke();
    ellipse(eyeX, eyeY, 8, 8);
  }

  drawMouth(mouthX, mouthY) {
    stroke(0);
    strokeWeight(2);
    ellipse(mouthX, mouthY, 20, 20);
    
  }

  drawSpikesRight(spikeX, spikeY) {
    noStroke();
    fill(this.spikeCol);
    triangle(spikeX, spikeY, spikeX, spikeY + 5, spikeX + 20, spikeY + 2.5);
  }

  drawSpikesLeft(spikeX, spikeY) {
    noStroke();
    fill(this.spikeCol);
    triangle(spikeX, spikeY, spikeX, spikeY + 5, spikeX - 20, spikeY + 2.5);
  }
}




/*
GOAL:
The goal is for you to write a class that produces a dancing being/creature/object/thing. In the next class, your dancer along with your peers' dancers will all dance in the same sketch that your instructor will put together. 

RULES:
For this to work you need to follow one rule: 
  - Only put relevant code into your dancer class; your dancer cannot depend on code outside of itself (like global variables or functions defined outside)
  - Your dancer must perform by means of the two essential methods: update and display. Don't add more methods that require to be called from outside (e.g. in the draw loop).
  - Your dancer will always be initialized receiving two arguments: 
    - startX (currently the horizontal center of the canvas)
    - startY (currently the vertical center of the canvas)
  beside these, please don't add more parameters into the constructor function 
  - lastly, to make sure our dancers will harmonize once on the same canvas, please don't make your dancer bigger than 200x200 pixels. 
*/