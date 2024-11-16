/**
 * Global constants
 * These constants can be modified to change the look, shape or animation of the speedometer
 */
const CANVAS_SIZE = { width: 500, height: 500 };

const START_ANGLE = 135;
const END_ANGLE = 405;
const NEEDLE_ANGLE = 335;

const NUMBER_OF_SMALL_STEPS = 4;
const NUMBER_OF_BIG_STEPS = 11;
const STEP_TEXT_SIZE = 12; // text size in px

const NEEDLE_WIDTH = 6;

const SPEED_VALUE_TEXT = "72";
const SPEED_VALUE_SUBTEXT = "km/h";
const SPEED_VALUE_TEXT_SIZE = 50;
const SPEED_VALUE_SUBTEXT_SIZE = 30;

const ANIMATION_SPEED = 1; // number of degrees to move the needle per frame

const COLORS = {
  range: "lightgray",
  highlight: "#944be3",
  needle: "black",
};

/**
 * Non configurable global constants
 */
const SWEEP_ANGLE = END_ANGLE - START_ANGLE;
const SMALL_STEP_INCREMENT_ANGLE =
  SWEEP_ANGLE / ((NUMBER_OF_SMALL_STEPS + 1) * (NUMBER_OF_BIG_STEPS - 1));
const BIG_STEP_INCREMENT_ANGLE = SWEEP_ANGLE / (NUMBER_OF_BIG_STEPS - 1);

/** @type {HTMLCanvasElement} */
const mainCanvas = document.getElementById("main-canvas");

// Set fixed height and width for the canvas
mainCanvas.width = CANVAS_SIZE.width;
mainCanvas.height = CANVAS_SIZE.height;
const mainCtx = mainCanvas.getContext("2d");

/** @type {HTMLCanvasElement} */
const layeredCanvas = document.getElementById("layered-canvas");

// Set fixed height and width for the canvas
layeredCanvas.width = CANVAS_SIZE.width;
layeredCanvas.height = CANVAS_SIZE.height;
const layeredCtx = layeredCanvas.getContext("2d");

// Center coordinates
const cetnerCoordinates = [mainCanvas.width / 2, mainCanvas.height / 2];
const [centerX, centerY] = cetnerCoordinates;

/**
 * --------------------------------------------------
 * Helper functions to make life easier
 * --------------------------------------------------
 */

/**
 * Converts angle in degrees to angle in radians
 * @param {number} degree - The angle in degrees
 * @returns {number} - The angle in radians
 */
function convertDegreeToRadians(degree) {
  return (degree * Math.PI) / 180;
}

/**
 * Function to calculate the offset co-ordinates of a point based on an angle and a distance
 * @param {[number, number]} cetnerCoordinates - The center point of the arc
 * @param {number} angle - The angle in degrees
 * @param {number} distance - The distance to offset
 * @returns {[number, number]} - the offset coordinates
 */
function angleToOffset([x, y], angle, distance) {
  const angleInRadians = convertDegreeToRadians(angle);
  const offsetX = x + distance * Math.cos(angleInRadians);
  const offsetY = y + distance * Math.sin(angleInRadians);

  return [offsetX, offsetY];
}

/**
 * Function to draw a visible dot on the screen
 * The size of the dot is defined by the size parameter
 * @param {CanvasRenderingContext2D} ctx - The canvas to draw on
 * @param {[number, number]} coordinates - The coordinates of the dot
 * @param {{ size: number, color: string }} properties - Configuration
 */
function drawDot(ctx, [x, y], { size = 5, color = "black" }) {
  ctx.beginPath();

  ctx.arc(x, y, size, 0, Math.PI * 2); // Drawing the arc

  ctx.fillStyle = color;
  ctx.fill(); // Solid filling the arc

  ctx.closePath();
}

/**
 * Funcion to draw a line from pointA to pointB
 * @param {CanvasRenderingContext2D} ctx - The canvas to draw on
 * @param {[number, number]} startCoordinates - The line starting coordinates
 * @param {[number, number]} endCoordinates - The line ending coordinates
 * @param {{ color: string, strokeWidth: number }} properties - Configuration
 */
function drawLine(
  ctx,
  [x1, y1],
  [x2, y2],
  { color = "black", strokeWidth = 2 }
) {
  ctx.beginPath();

  ctx.moveTo(x1, y1); // line start
  ctx.lineTo(x2, y2); // line end

  ctx.strokeStyle = color;
  ctx.lineWidth = strokeWidth;
  ctx.stroke();

  ctx.closePath();
}

/**
 * Function to draw an arc from angleA to angleB.
 * Can be configured to be drawn in clockwise or coutner-clockwise.
 * All angles are to be in DEGREES.
 * @param {CanvasRenderingContext2D} ctx - The canvas to draw on
 * @param {[number, number]} cetnerCoordinates - The center point of the arc
 * @param {number} radius - the radius of the arc
 * @param {number} startAngle - start angle of the arc in DEGREES
 * @param {number} sweepAngle - end angle of the arc in DEGREES
 * @param {{ color: string, strokeWidth: number, counterClockwise: boolean }} properties - Configuration
 */
function drawArc(
  ctx,
  [x, y],
  radius,
  startAngle,
  sweepAngle,
  { color = "black", strokeWidth = 2, counterClockwise = true }
) {
  startAngle = convertDegreeToRadians(startAngle);
  sweepAngle = convertDegreeToRadians(sweepAngle);

  ctx.beginPath();

  ctx.arc(x, y, radius, startAngle, sweepAngle, counterClockwise);

  ctx.strokeStyle = color;
  ctx.lineWidth = strokeWidth;
  ctx.stroke();

  ctx.closePath();
}

/**
 * Function to render/draw text on the canvas.
 * @param {CanvasRenderingContext2D} ctx - The canvas to draw on
 * @param {[number, number]} coordinates - The coordinates of the center of the text
 * @param {string} text - The text to draw
 * @param {{ size: string, color: string, fontFamily: string }} properties - Configuration
 */
function drawText(
  ctx,
  [x, y],
  text,
  { size = "12px", color = "black", fontFamily = "Arial" }
) {
  ctx.font = `${size} ${fontFamily}`; // Set font size and font family
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
}

/**
 * Function to create a triangle on the canvas using the coordinates of its vertices.
 * @param {CanvasRenderingContext2D} ctx - The canvas to draw on
 * @param {[[number, number], [number, number], [number, number]]} coordinates - The coordinates of the vertices of the triangle
 * @param {{ color: string }} properties - Configuration
 */
function drawTriangle(
  ctx,
  [[x1, y1], [x2, y2], [x3, y3]],
  { color = "black" }
) {
  ctx.beginPath();

  ctx.moveTo(x1, y1); // First vertex (x1, y1)
  ctx.lineTo(x2, y2); // Second vertex (x2, y2)
  ctx.lineTo(x3, y3); // Third vertex (x3, y3)

  ctx.closePath(); // Connects back to the first vertex

  ctx.fillStyle = color;
  ctx.fill();
}

/**
 * --------------------------------------------------
 * Rendering the speedometer
 * --------------------------------------------------
 */

function draw(needleAngle = NEEDLE_ANGLE, textValue = SPEED_VALUE_TEXT) {
  drawArc(mainCtx, cetnerCoordinates, centerX * 0.7, START_ANGLE, END_ANGLE, {
    color: COLORS.range,
    counterClockwise: false,
    strokeWidth: 2,
  });

  drawArc(mainCtx, cetnerCoordinates, centerX * 0.75, START_ANGLE, END_ANGLE, {
    color: COLORS.range,
    counterClockwise: false,
    strokeWidth: 20,
  });

  drawArc(
    mainCtx,
    cetnerCoordinates,
    centerX * 0.75,
    START_ANGLE,
    needleAngle,
    {
      color: COLORS.highlight,
      counterClockwise: false,
      strokeWidth: 20,
    }
  );

  // Small value lines
  for (
    let angle = START_ANGLE;
    angle <= END_ANGLE;
    angle += SMALL_STEP_INCREMENT_ANGLE
  ) {
    const [startOffsetX, startOffsetY] = angleToOffset(
      [centerX, centerY],
      Math.abs(angle),
      centerX * 0.7
    );
    const [endOffsetX, endOffSetY] = angleToOffset(
      [centerX, centerY],
      Math.abs(angle),
      centerX * 0.65
    );

    drawLine(mainCtx, [startOffsetX, startOffsetY], [endOffsetX, endOffSetY], {
      color: COLORS.needle,
      strokeWidth: 1,
    });
  }

  // Drawing hightlights
  for (
    let hightlightNumber = 0;
    hightlightNumber < NUMBER_OF_BIG_STEPS;
    hightlightNumber++
  ) {
    const angle = START_ANGLE + BIG_STEP_INCREMENT_ANGLE * hightlightNumber;

    const startOffset = angleToOffset([centerX, centerY], angle, centerX * 0.7);
    const endOffset = angleToOffset([centerX, centerY], angle, centerX * 0.575);

    drawLine(mainCtx, startOffset, endOffset, {
      color: COLORS.needle,
      strokeWidth: 2,
    });

    const textOffset = angleToOffset(
      [centerX, centerY],
      Math.abs(angle),
      centerX * 0.5
    );
    const centeredTextOffset = [
      textOffset[0] - STEP_TEXT_SIZE / 2,
      textOffset[1] + STEP_TEXT_SIZE / 2,
    ];

    drawText(mainCtx, centeredTextOffset, hightlightNumber * 10, {
      size: `${STEP_TEXT_SIZE}px`,
      color: COLORS.needle,
    });
  }

  // Drawing the needle
  drawDot(mainCtx, cetnerCoordinates, {
    color: COLORS.needle,
    size: 10,
  });

  const needleVertex1 = angleToOffset(
    cetnerCoordinates,
    needleAngle + 90,
    NEEDLE_WIDTH
  );
  const needleVertex2 = angleToOffset(
    cetnerCoordinates,
    needleAngle - 90,
    NEEDLE_WIDTH
  );

  const needleVertex3 = angleToOffset(
    [centerX, centerY],
    needleAngle,
    centerX * 0.75
  );

  drawTriangle(mainCtx, [needleVertex1, needleVertex2, needleVertex3], {
    color: COLORS.needle,
  });

  drawText(
    mainCtx,
    [
      centerX - ((SPEED_VALUE_TEXT_SIZE / 2) * textValue.length) / 2,
      centerY - (SPEED_VALUE_TEXT_SIZE / 2) * -3,
    ],
    parseFloat(textValue),
    {
      color: COLORS.needle,
      size: `${SPEED_VALUE_TEXT_SIZE}px`,
    }
  );

  drawText(
    mainCtx,
    [
      centerX -
        ((SPEED_VALUE_SUBTEXT_SIZE / 2) * SPEED_VALUE_SUBTEXT.length) / 2,
      centerY - (SPEED_VALUE_TEXT_SIZE / 2) * -4.5,
    ],
    SPEED_VALUE_SUBTEXT,
    {
      color: COLORS.needle,
      size: `${SPEED_VALUE_SUBTEXT_SIZE}px`,
    }
  );
}

/**
 * --------------------------------------------------
 * Animating the speedometer
 * --------------------------------------------------
 */
let animationStart = START_ANGLE;
let textStartValue = 0;

function animate() {
  mainCtx.clearRect(0, 0, mainCanvas.width, mainCanvas.height); // Clear canvas before each frame
  draw(animationStart, Math.round(textStartValue).toString());

  animationStart += ANIMATION_SPEED;
  textStartValue +=
    (((NUMBER_OF_BIG_STEPS - 1) * 10) / SWEEP_ANGLE) * ANIMATION_SPEED;

  if (animationStart <= NEEDLE_ANGLE) {
    requestAnimationFrame(animate);
  }
}

animate();
