/*
Template for IMA's Creative Coding Lab 

Project A: Generative Creatures
CCLaboratories Biodiversity Atlas 
*/

let bodyX, bodyY; // X, Y position of the central combined body
let positiveX, positiveY, positiveVX, positiveVY; // Position (X,Y) and Velocity (VX,VY) for the positive (red) creature
let negativeX, negativeY, negativeVX, negativeVY; // Position (X,Y) and Velocity (VX,VY) for the negative (blue) creature

let positiveExists = false; // Tracks if the positive creature has been created
let negativeExists = false; // Tracks if the negative creature has been created
let haveStopped = false; // Tracks if the two creatures have combined into one
let isSeparating = false; // NEW: Tracks if creatures are in post-hit separation mode
let separationControlIsPositive = false; // NEW: Tracks which creature (left) is mouse-controlled

let powerLevel = 0; // Current energy level, increases by collecting charges
const MAX_POWER_LEVEL = 20; // The maximum power level achievable
const POWER_DECAY_RATE = 0.02; // How fast the power level drains over time
let baseLightningChance = 0.02; // Minimum chance to shoot lightning (at power 0)
let maxLightningChance = 0.2; // Maximum chance to shoot lightning (at max power)

let charge1X, charge1Y, charge1Active;
let charge2X, charge2Y, charge2Active;
let charge3X, charge3Y, charge3Active;
let charge4X, charge4Y, charge4Active;
let charge5X, charge5Y, chargeTeam;
const CHARGE_SIZE = 20; // Visual size of the charge orbs

// Red charges for separation
let redCharge1X, redCharge1Y, redCharge1Active;
let redCharge2X, redCharge2Y, redCharge2Active;

let finalAngle = 0; // The angle the creatures lock into when they combine
const finalDistance = 100; // How close the creatures need to be to combine
let branchLength = 100; // The MAX length (in steps) of a lightning bolt
let stepSize = 6; // The length of each small segment of a lightning bolt
const attractionForce = 0.3; // How strongly the creatures pull on each other
const damping = 0.97; // Friction/drag to slow the creatures down (value < 1)
const CREATURE_RADIUS = 50; // NEW: Half of the creature's bodySize (100)

function setup() {
  let canvas = createCanvas(800, 500);
  canvas.parent("p5-canvas-container");
  bodyX = width / 2;
  bodyY = height / 2;
  initializeCharges();
  initializeRedCharges();
}

function mousePressed() {
  if (haveStopped) {
    return;
  }

  if (isSeparating) {
    return;
  }

  // Constrain spawn position to be inside the canvas
  let clampedMouseX = constrain(mouseX, CREATURE_RADIUS, width - CREATURE_RADIUS);
  let clampedMouseY = constrain(mouseY, CREATURE_RADIUS, height - CREATURE_RADIUS);

  // State 1: No creatures exist. Create the first one (randomly red or blue).
  if (!positiveExists && !negativeExists) {
    if (random(1) < 0.5) {
      positiveExists = true;
      positiveX = clampedMouseX;
      positiveY = clampedMouseY;
      positiveVX = 0;
      positiveVY = 0;
    } else {
      negativeExists = true;
      negativeX = clampedMouseX;
      negativeY = clampedMouseY;
      negativeVX = 0;
      negativeVY = 0;
    }
    // State 2: One creature exists. Create the second one.
  } else if (positiveExists && !negativeExists) {
    negativeExists = true;
    negativeX = clampedMouseX;
    negativeY = clampedMouseY;
    negativeVX = 0;
    negativeVY = 0;
  } else if (!positiveExists && negativeExists) {
    positiveExists = true;
    positiveX = clampedMouseX;
    positiveY = clampedMouseY;
    positiveVX = 0;
    positiveVY = 0;
  }
}

function draw() {
  noStroke();
  fill(10, 0, 40, 90);
  rect(0, 0, width, height);

  if (!haveStopped) {
    drawCharges();
    drawRedCharges();
  }

  if (positiveExists && negativeExists) {
    if (!haveStopped) {
      let dx = negativeX - positiveX;
      let dy = negativeY - positiveY;
      let distance = sqrt(dx * dx + dy * dy);

      if (isSeparating) {
        let clampedMouseX = constrain(mouseX, CREATURE_RADIUS, width - CREATURE_RADIUS);
        let clampedMouseY = constrain(mouseY, CREATURE_RADIUS, height - CREATURE_RADIUS);

        if (separationControlIsPositive) {
          positiveX = lerp(positiveX, clampedMouseX, 0.1);
          positiveY = lerp(positiveY, clampedMouseY, 0.1);
          positiveVX = 0;
          positiveVY = 0;
        } else {
          negativeX = lerp(negativeX, clampedMouseX, 0.1);
          negativeY = lerp(negativeY, clampedMouseY, 0.1);
          negativeVX = 0;
          negativeVY = 0;
        }
        let reAttractDistance = finalDistance + 50;
        if (distance > reAttractDistance) {
          isSeparating = false;
        }
      } else {
        if (distance > 1) {
          let directionX = dx / distance;
          let directionY = dy / distance;
          // Apply force to positive creature (pulling it towards negative)
          positiveVX += directionX * attractionForce;
          positiveVY += directionY * attractionForce;
          // Apply opposite force to negative creature
          negativeVX -= directionX * attractionForce;
          negativeVY -= directionY * attractionForce;
        }
      }

      if (!isSeparating || !separationControlIsPositive) {
        positiveVX *= damping;
        positiveVY *= damping;
      }
      if (!isSeparating || separationControlIsPositive) {
        negativeVX *= damping;
        negativeVY *= damping;
      }

      if (!isSeparating || !separationControlIsPositive) {
        positiveX += positiveVX;
        positiveY += positiveVY;
      }
      if (!isSeparating || separationControlIsPositive) {
        negativeX += negativeVX;
        negativeY += negativeVY;
      }

      // Positive Creature (Red)
      if (positiveX < CREATURE_RADIUS) {
        positiveX = CREATURE_RADIUS;
        positiveVX *= -1;
      } else if (positiveX > width - CREATURE_RADIUS) {
        positiveX = width - CREATURE_RADIUS;
        positiveVX *= -1;
      }
      if (positiveY < CREATURE_RADIUS) {
        positiveY = CREATURE_RADIUS;
        positiveVY *= -1;
      } else if (positiveY > height - CREATURE_RADIUS) {
        positiveY = height - CREATURE_RADIUS;
        positiveVY *= -1;
      }

      // Negative Creature (Blue)
      if (negativeX < CREATURE_RADIUS) {
        negativeX = CREATURE_RADIUS;
        negativeVX *= -1;
      } else if (negativeX > width - CREATURE_RADIUS) {
        negativeX = width - CREATURE_RADIUS;
        negativeVX *= -1;
      }
      if (negativeY < CREATURE_RADIUS) {
        negativeY = CREATURE_RADIUS;
        negativeVY *= -1;
      } else if (negativeY > height - CREATURE_RADIUS) {
        negativeY = height - CREATURE_RADIUS;
        negativeVY *= -1;
      }

      let angleToNegative = atan2(negativeY - positiveY, negativeX - positiveX);
      let angleToPositive = atan2(positiveY - negativeY, positiveX - negativeX);
      drawCreature(positiveX, positiveY, color(255, 100, 100), angleToNegative);
      drawCreature(negativeX, negativeY, color(100, 100, 255), angleToPositive);

      // If they get close enough, they combine
      if (distance <= finalDistance && !isSeparating) {
        haveStopped = true;
        bodyX = (positiveX + negativeX) / 2;
        bodyY = (positiveY + negativeY) / 2;
        finalAngle = atan2(negativeY - positiveY, negativeX - positiveX);
      }
      // --- STATE 2: CREATURES ARE COMBINED ---
    } else {
      powerLevel = max(0, powerLevel - POWER_DECAY_RATE);

      // Draw all the combined-state effects
      drawCombinedState();
      drawLightning();
      drawInternalArcs();
      drawCharges();
      drawRedCharges();
      checkCollisions();
    }
    // --- STATE 0: WAITING FOR CREATURES ---
  } else {
    textSize(20);
    fill(255, 200);
    textAlign(CENTER, CENTER);
    if (!positiveExists && !negativeExists) {
      text(
        "Click anywhere to create the first creature.",
        width / 2,
        height / 2
      );
    } else {
      text("Click again to create the second creature.", width / 2, height / 2);
    }
    // Draw the first creature if it exists
    if (positiveExists) {
      drawCreature(positiveX, positiveY, color(255, 100, 100), 0);
    }
    // Draw the second creature if it exists
    if (negativeExists) {
      drawCreature(negativeX, negativeY, color(100, 100, 255), 0);
    }
  }
}


function initializeRedCharges() {
  redCharge1X = random(width);
  redCharge1Y = random(height);
  redCharge1Active = true;
  redCharge2X = random(width);
  redCharge2Y = random(height);
  redCharge2Active = true;
}

function drawRedCharges() {
  if (redCharge1Active) drawSingleRedCharge(redCharge1X, redCharge1Y);
  if (redCharge2Active) drawSingleRedCharge(redCharge2X, redCharge2Y);
}


function drawSingleRedCharge(x, y) {
  push();
  translate(x, y);
  let pulse = sin(frameCount * 0.1);
  let glowAlpha = map(pulse, -1, 1, 100, 255);
  let glowSize = map(pulse, -1, 1, CHARGE_SIZE, CHARGE_SIZE * 1.5);
  noStroke();
  fill(255, 100, 100, glowAlpha / 3);
  circle(0, 0, glowSize);
  fill(255, 150, 150, glowAlpha);
  circle(0, 0, CHARGE_SIZE);
  pop();
}


function separateCreatures(chargeX, chargeY) {
  powerLevel = 0;
  haveStopped = false;
  isSeparating = true;

  let knockbackForce = 15;
  let knockbackAngle;

  if (positiveX < negativeX) {
    separationControlIsPositive = true;
    knockbackAngle = atan2(negativeY - chargeY, negativeX - chargeX);
    negativeVX = cos(knockbackAngle) * knockbackForce;
    negativeVY = sin(knockbackAngle) * knockbackForce;
    positiveVX = 0;
    positiveVY = 0;
  } else {
    separationControlIsPositive = false;
    knockbackAngle = atan2(positiveY - chargeY, positiveX - chargeX);
    positiveVX = cos(knockbackAngle) * knockbackForce;
    positiveVY = sin(knockbackAngle) * knockbackForce;
    negativeVX = 0;
    negativeVY = 0;
  }
}


function checkCollisions() {
  let collisionDist = 60 + CHARGE_SIZE / 2;
  if (charge1Active && dist(bodyX, bodyY, charge1X, charge1Y) < collisionDist) {
    powerLevel = min(powerLevel + 1, MAX_POWER_LEVEL);
    charge1X = random(width);
    charge1Y = random(height);
  }
  if (charge2Active && dist(bodyX, bodyY, charge2X, charge2Y) < collisionDist) {
    powerLevel = min(powerLevel + 1, MAX_POWER_LEVEL);
    charge2X = random(width);
    charge2Y = random(height);
  }
  if (charge3Active && dist(bodyX, bodyY, charge3X, charge3Y) < collisionDist) {
    powerLevel = min(powerLevel + 1, MAX_POWER_LEVEL);
    charge3X = random(width);
    charge3Y = random(height);
  }
  if (charge4Active && dist(bodyX, bodyY, charge4X, charge4Y) < collisionDist) {
    powerLevel = min(powerLevel + 1, MAX_POWER_LEVEL);
    charge4X = random(width);
    charge4Y = random(height);
  }
  if (charge5Active && dist(bodyX, bodyY, charge5X, charge5Y) < collisionDist) {
    powerLevel = min(powerLevel + 1, MAX_POWER_LEVEL);
    charge5X = random(width);
    charge5Y = random(height);
  }


  if (haveStopped) {
    if (
      redCharge1Active &&
      dist(bodyX, bodyY, redCharge1X, redCharge1Y) < collisionDist
    ) {
      separateCreatures(redCharge1X, redCharge1Y);
      redCharge1X = random(width);
      redCharge1Y = random(height);
    }
    if (
      redCharge2Active &&
      dist(bodyX, bodyY, redCharge2X, redCharge2Y) < collisionDist
    ) {
      separateCreatures(redCharge2X, redCharge2Y);
      redCharge2X = random(width);
      redCharge2Y = random(height);
    }
  }
}

function drawInternalArcs() {
  let fromColor = color(255, 255, 100, 150);
  let toColor = color(255, 100, 255, 200);
  let powerRatio = powerLevel / MAX_POWER_LEVEL;
  let currentColor = lerpColor(fromColor, toColor, powerRatio);
  if (random(1) < 0.2) {
    let prevX = positiveX;
    let prevY = positiveY;
    let targetX = negativeX;
    let targetY = negativeY;

    let dx = targetX - prevX;
    let dy = targetY - prevY;
    let distance = sqrt(dx * dx + dy * dy);
    let segments = 10;

    noFill();
    stroke(currentColor);
    strokeWeight(random(1, 2.5));

    beginShape();
    vertex(prevX, prevY); // Loop through the segments

    for (let i = 1; i < segments; i++) {
      let t = i / segments;
      let currentX = lerp(prevX, targetX, t);
      let currentY = lerp(prevY, targetY, t);
      let offsetMagnitude = distance * 0.2 * sin(t * PI);
      currentX += (dy / distance) * random(-offsetMagnitude, offsetMagnitude);
      currentY -= (dx / distance) * random(-offsetMagnitude, offsetMagnitude);
      vertex(currentX, currentY);
    }
    vertex(targetX, targetY);
    endShape();
  }
}

function drawLightning() {
  let powerRatio = powerLevel / MAX_POWER_LEVEL;
  let currentLightningChance = lerp(
    baseLightningChance,
    maxLightningChance,
    powerRatio
  );

  if (random(1) < currentLightningChance) {
    // Color of lightning scales with power
    let fromColor = color(255);
    let toColor = color(255, 50, 255);
    let lightningColor = lerpColor(fromColor, toColor, powerRatio);

    let auraBranches = int(random(15, 25));
    for (let i = 0; i < auraBranches; i++) {
      let startX = random(1) < 0.5 ? positiveX : negativeX;
      let startY = random(1) < 0.5 ? positiveY : negativeY;
      let x = startX + random(-10, 10);
      let y = startY + random(-10, 10);
      let prevX = x;
      let prevY = y;
      let angle = random(TWO_PI);
      noFill();
      let shortBranchLength = int(random(5, 20));
      for (let j = 0; j < shortBranchLength; j++) {
        angle += random(-1, 1); // Wiggle
        x += cos(angle) * stepSize * 0.8;
        y += sin(angle) * stepSize * 0.8;
        stroke(200, 200, 255, 80);
        strokeWeight(random(1, 2.5));
        line(prevX, prevY, x, y);
        prevX = x;
        prevY = y;
      }
    }
    let minMainBranches = int(lerp(1, 5, powerRatio));
    let maxMainBranches = int(lerp(3, 8, powerRatio));
    let mainBranches = int(random(minMainBranches, maxMainBranches + 1));
    let currentBranchLength = int(lerp(20, branchLength, powerRatio));

    let targetX = mouseX;
    let targetY = mouseY;
    for (let i = 0; i < mainBranches; i++) {
      let startNodeX = random(1) < 0.5 ? positiveX : negativeX;
      let startNodeY = random(1) < 0.5 ? positiveY : negativeY;
      let x = startNodeX + random(-15, 15);
      let y = startNodeY + random(-15, 15);
      let prevX = x;
      let prevY = y;
      let angle = atan2(targetY - y, targetX - x) + random(-0.2, 0.2);
      noFill();

      for (let j = 0; j < currentBranchLength; j++) {
        angle += random(-0.8, 0.8);
        x += cos(angle) * stepSize;
        y += sin(angle) * stepSize;
        let lightningColorWithAlpha = color(
          red(lightningColor),
          green(lightningColor),
          blue(lightningColor),
          100
        );
        stroke(lightningColorWithAlpha);
        strokeWeight(random(2, 4));
        line(prevX, prevY, x, y);
        stroke(lightningColor);
        strokeWeight(random(1, 2));
        line(prevX, prevY, x, y);
        prevX = x;
        prevY = y;
        if (
          dist(x, y, targetX, targetY) < 20 ||
          x > width ||
          x < 0 ||
          y > height ||
          y < 0
        ) {
          break;
        }
      }
    }
  }
}

//Initializes the 5 collectible charges with random positions.
function initializeCharges() {
  charge1X = random(width);
  charge1Y = random(height);
  charge1Active = true;
  charge2X = random(width);
  charge2Y = random(height);
  charge2Active = true;
  charge3X = random(width);
  charge3Y = random(height);
  charge3Active = true;
  charge4X = random(width);
  charge4Y = random(height);
  charge4Active = true;
  charge5X = random(width);
  charge5Y = random(height);
  charge5Active = true;
}

function drawCharges() {
  if (charge1Active) drawSingleCharge(charge1X, charge1Y);
  if (charge2Active) drawSingleCharge(charge2X, charge2Y);
  if (charge3Active) drawSingleCharge(charge3X, charge3Y);
  if (charge4Active) drawSingleCharge(charge4X, charge4Y);
  if (charge5Active) drawSingleCharge(charge5X, charge5Y);
}

function drawSingleCharge(x, y) {
  push();
  translate(x, y);
  let pulse = sin(frameCount * 0.1);
  let glowAlpha = map(pulse, -1, 1, 100, 255);
  let glowSize = map(pulse, -1, 1, CHARGE_SIZE, CHARGE_SIZE * 1.5);
  noStroke();
  fill(255, 255, 150, glowAlpha / 3);
  circle(0, 0, glowSize);
  fill(255, 255, 200, glowAlpha);
  circle(0, 0, CHARGE_SIZE);
  pop();
}

function drawCombinedState() {
  let clampedMouseX = constrain(mouseX, CREATURE_RADIUS, width - CREATURE_RADIUS);
  let clampedMouseY = constrain(mouseY, CREATURE_RADIUS, height - CREATURE_RADIUS);

  bodyX = lerp(bodyX, clampedMouseX, 0.05);
  bodyY = lerp(bodyY, clampedMouseY, 0.05);
  let halfDist = finalDistance / 2;
  positiveX = bodyX - cos(finalAngle) * halfDist;
  positiveY = bodyY - sin(finalAngle) * halfDist;
  negativeX = bodyX + cos(finalAngle) * halfDist;
  negativeY = bodyY + sin(finalAngle) * halfDist;

  let powerRatio = powerLevel / MAX_POWER_LEVEL;
  let fromColor = color(0, 0, 0, 100);
  let toColor = color(255, 0, 255, 200);
  let auraColor = lerpColor(fromColor, toColor, powerRatio);
  let auraSize = lerp(120, 200, powerRatio);

  noStroke();
  fill(auraColor);
  circle(bodyX, bodyY, auraSize);

  let pupilPos = calculatePupilOffset(bodyX, bodyY, mouseX, mouseY, 12.5);

  drawCreature(
    positiveX,
    positiveY,
    color(255, 100, 100),
    finalAngle,
    pupilPos.x,
    pupilPos.y
  );
  drawCreature(
    negativeX,
    negativeY,
    color(100, 100, 255),
    finalAngle + PI,
    -pupilPos.x,
    -pupilPos.y
  );
}

function calculatePupilOffset(centerX, centerY, targetX, targetY, maxOffset) {
  let dx = targetX - centerX;
  let dy = targetY - centerY;
  let distance = sqrt(dx * dx + dy * dy);
  let offsetX = dx;
  let offsetY = dy;
  if (distance > maxOffset) {
    offsetX = (dx / distance) * maxOffset;
    offsetY = (dy / distance) * maxOffset;
  }
  return {
    x: offsetX,
    y: offsetY,
  };
}

function drawCreature(
  x,
  y,
  bodycolor,
  creatureAngle,
  pupilOffsetX = 0,
  pupilOffsetY = 0
) {
  push();
  translate(x, y);
  rotate(creatureAngle);
  drawbody(100, bodycolor);
  draweye(50);
  drawpupil(25, pupilOffsetX, pupilOffsetY);
  pop();
}

function drawbody(bodySize, bodycolor) {
  fill(bodycolor);
  stroke(0);
  strokeWeight(2);
  circle(0, 0, bodySize);
  fill(100);
  stroke(0);
  strokeWeight(2);
  rect(0, -bodySize / 2, bodySize / 2, bodySize);
}

function draweye(eyeSize) {
  fill(255);
  stroke(0);
  strokeWeight(2);
  circle(0, 0, eyeSize);
}

function drawpupil(pupilSize, x, y) {
  fill(0);
  noStroke();
  circle(x, y, pupilSize);
}
