/*
* Position class to represent 2D points and do simple
* operations on them
*/
function Position(x, y) {
  this.x = x;
  this.y = y;

  this.dot = function (other) {
    return (this.x * other.x) + (this.y * other.y);
  }

  this.diff = function (other) {
    return new Position(this.x - other.x, this.y - other.y);
  }

  this.sum = function (other) {
    return new Position(this.x + other.x, this.y + other.y);
  }

  this.length = function () {
    return Math.sqrt(Math.pow(this.x, 2) + Math.pow(this.y, 2));
  }

  this.dist = function (other) {
    return Math.sqrt(Math.pow((this.x - other.x), 2)
      + Math.pow((this.y - other.y), 2));
  }
}

/*
* Pose class to represent SE2 poses
*/
function Pose(x, y, theta, posThreshold = 5, rotThreshold = 5) {

  if (x == undefined)
    this.x = 0;
  else
    this.x = x;

  if (y == undefined)
    this.y = 0;
  else
    this.y = y;

  if (theta == undefined)
    this.theta = 0;
  else
    this.theta = theta;

  this.isSame = function (pose, rotThreshold = 5, posThreshold = 5) {
    var myPosition = this.getPosition();
    var distErr = myPosition.dist(pose);
    var rotErr = angleDistance(this.theta, pose.theta);
    return (distErr < posThreshold &&
      rotErr < rotThreshold/2);
  }

  this.getPosition = function () {
    return new Position(this.x, this.y);
  }
}

/*
* Constructor for SE3 element class
*/
function SE3(name, pose, color, threejs_object, posThreshold = 0, rotThreshold = 0) {
  this.pose = pose;
  this.color = color;
  this.threejs_object = threejs_object;

  this.posThreshold = posThreshold;
  this.rotThreshold = rotThreshold;

  SE3.lineLength = 35;
  SE3.lineWidth = 5;

  /*
  if (posThreshold > SE3.lineLength - 5) {
    throw `Position threshold  ${posThreshold} cannot be greater than [SE2.lineLength - 5] (${SE3.lineLength -5})`;
  }
  
  if (rotThreshold > 180) {
    throw `Rotation threshold  ${rotThreshold} cannot be greater than 180`;
  }
  */

  this.setPose = function (pose) {
    this.pose = pose;
  }

  this.setRotation = function (rotDeg) {
    this.pose.theta = rotDeg;
  }

  this.setPosition = function (position) {
    this.pose.x = position.x;
    this.pose.y = position.y;
  }

  this.setTempColor = function (color) {
    this.dot.setAttribute("fill", color);
    this.dot.setAttribute("stroke", color);
    this.line.setAttribute("stroke", color);
  }

  this.resetColor = function () {
    this.dot.setAttribute("fill", this.color);
    this.dot.setAttribute("stroke", this.color);
    this.line.setAttribute("stroke", this.color);
  }

  this.isSame = function (other) {
    return this.pose.isSame(other.pose, this.rotThreshold, this.posThreshold);
  }

  this.getPosition = function () {
    return this.pose.getPosition();
  }
}

/*
* Constructor for moveable SE3, inherits SE3
*/
function moveableSE3(name, pose, color, threejs_object, hasHandle) {
  SE3.call(this, name, pose, color, threejs_object, 0, 0);

  this.startPose = null;
  this.isMoving = false;
  this.isTranslating = false;
  this.isRotating = false;

  this.startTranslating = function () {
    this.startPose = new Pose(this.pose.x, this.pose.y, this.pose.theta);
    this.isMoving = true;
    this.isTranslating = true;
  }

  this.startRotating = function () {
    this.startPose = new Pose(this.pose.x, this.pose.y, this.pose.theta);
    this.isMoving = true;
    this.isRotating = true;
  }

  this.stopMoving = function () {
    this.isMoving = false;
    this.isTranslating = false;
    this.isRotating = false;
  }

  this.rotateBy = function (degDiff) {
    this.pose.theta = this.startPose.theta + degDiff;
    if (this.pose.theta > 180)
      this.pose.theta -= 360;
    if (this.pose.theta < -180)
      this.pose.theta += 360;
  }

  this.translateBy = function (positionDiff) {
    this.pose.x = Math.min(Math.max(0, this.startPose.x + positionDiff.x), this.size.width);
    this.pose.y = Math.min(Math.max(0, this.startPose.y + positionDiff.y), this.size.height);
  }

  this.translateXBy = function (positionDiff) {
    this.pose.x = this.startPose.x + positionDiff.x;
  }

  this.translateYBy = function (positionDiff) {
    this.pose.y = this.startPose.y + positionDiff.y;
  }

  this.translateZBy = function (positionDiff) {
    this.pose.y = 0, this.startPose.y + positionDiff.y;
  }
}

/*
* Utility function to move an entity to a desired SE2 pose
*/
function moveObject(object, x, y, theta, isFlip) {
  let transform = "translate(" + x + " " + y + ") " +
    "rotate(" + theta + " " + 0 + " " + 0 + ")";
  if (isFlip)
    transform += " scale(-1, 1)";
  object.setAttribute("transform", transform);
}

/*
* Utility function to generate a SVG path for a wedge (https://stackoverflow.com/a/17309908/6454085)
*/
function generateWedgeString(startX, startY, startAngle, endAngle, radius) {
  var x1 = startX + radius * Math.cos(Math.PI * startAngle / 180);
  var y1 = startY + radius * Math.sin(Math.PI * startAngle / 180);
  var x2 = startX + radius * Math.cos(Math.PI * endAngle / 180);
  var y2 = startY + radius * Math.sin(Math.PI * endAngle / 180);

  var pathString = "M" + startX + " " + startY + " L" + x1 + " " + y1 + " A" + radius + " " + radius + " 0 0 1 " + x2 + " " + y2 + " z";

  return pathString;

}

/*
* Utility function calculate the modulus of two numbers. The default modulus in does not work correctly for negative numbers
*/
function mod(n, m) {
  return ((n % m) + m) % m;
}

function angleDistance(alpha, beta) {
  var phi = mod(Math.abs(beta - alpha), 360);       // This is either the distance or 360 - distance
  var distance = ((phi > 180) ? 360 - phi : phi);
  return distance;
}