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
  dancer = new PickleRick(width / 2, height / 2);
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
class PickleRick {
  constructor(startX, startY) {
    this.x = startX;
    this.y = startY;
    this.bodyCol = color(95, 151, 78);
    this.eyeSize = 30;
    this.eyeCol = color('white');
    this.pupilCol = color(0);

    // add properties for your dancer here:
    this.twistSpeed = 0.05;
    this.twistAmplitude = 15;
    this.bodyWaviness = 0.05;
    // ---
  }
  update() {
    // update properties here to achieve
    // your dancer's desired moves and behaviour
  }
  display() {
    // the push and pop, along with the translate 
    // places your whole dancer object at this.x and this.y.
    // you may change its position on line 19 to see the effect.
    push();
    translate(this.x, this.y);

    // ******** //
    // ⬇️ draw your dancer from here ⬇️
    
    this.drawBody(0,0);
    this.drawEye(0,0); 

    // ⬆️ draw your dancer above ⬆️
    // ******** //

    // the next function draws a SQUARE and CROSS
    // to indicate the approximate size and the center point
    // of your dancer.
    // it is using "this" because this function, too, 
    // is a part if your Dancer object.
    // comment it out or delete it eventually.
    this.drawReferenceShapes();

    pop();
  }

  drawBody(bodyX, bodyY){
    fill(this.bodyCol);
    noStroke();

    let bodyWidth = 60;
    let topY = bodyY - 75;
    let bottomY = bodyY + 75;
    let step = 5;

    let topWaveOffset = sin(topY * this.bodyWaviness + frameCount * this.twistSpeed) * this.twistAmplitude;
    let bottomWaveOffset = sin(bottomY * this.bodyWaviness + frameCount * this.twistSpeed) * this.twistAmplitude;
    
    beginShape();
    vertex(bodyX + bodyWidth / 2 + topWaveOffset, topY);
    for (let y = topY + step; y <= bottomY; y += step) {
      let waveOffset = sin(y * this.bodyWaviness + frameCount * this.twistSpeed) * this.twistAmplitude;
      vertex(bodyX + bodyWidth / 2 + waveOffset, y);
    }
    vertex(bodyX - bodyWidth / 2 + bottomWaveOffset, bottomY);
    for (let y = bottomY - step; y >= topY; y -= step) {
      let waveOffset = sin(y * this.bodyWaviness + frameCount * this.twistSpeed) * this.twistAmplitude;
      vertex(bodyX - bodyWidth / 2 + waveOffset, y);
    }
    endShape(CLOSE);
    ellipse(bodyX + topWaveOffset, topY, bodyWidth, 50);
    ellipse(bodyX + bottomWaveOffset, bottomY, bodyWidth, 50);
    rectMode(CORNER);
  }

  drawFace() {
    fill(this.faceCol);
    ellipse(-40, -20, 80);
  }

  drawEye(eyeX, eyeY) {
    // Eye
    fill(this.eyeCol);
    ellipse(eyeX, eyeY, this.eyeSize);
    // Pupil
    fill(this.pupilCol);
    ellipse(eyeX, eyeY, 1);
  }

  drawMouth(){
  }

  drawReferenceShapes() {
    noFill();
    stroke(255, 0, 0);
    line(-5, 0, 5, 0);
    line(0, -5, 0, 5);
    stroke(255);
    rect(-100, -100, 200, 200);
    fill(255);
    stroke(0);
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