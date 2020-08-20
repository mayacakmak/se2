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
    var rotErr = Math.abs(mod(this.theta, 360) - mod(pose.theta,360));
    return (distErr < posThreshold &&
      rotErr < rotThreshold/2);
  }

  this.getPosition = function () {
    return new Position(this.x, this.y);
  }
}

/*
* Constructor for SE2 element class
*/
function SE2(name, pose, color, posThreshold = 0, rotThreshold = 0) {
  this.pose = pose;
  this.color = color;

  this.posThreshold = posThreshold;
  this.rotThreshold = rotThreshold;

  SE2.lineLength = 35;
  SE2.lineWidth = 5;

  if (posThreshold > SE2.lineLength - 5) {
    throw `Position threshold  ${posThreshold} cannot be greater than [SE2.lineLength - 5] (${SE2.lineLength -5})`;
  }
  
  if (rotThreshold > 180) {
    throw `Rotation threshold  ${rotThreshold} cannot be greater than 180`;
  }
 
  // Create the "dot" that indicates the center (x, y) of the element
  this.dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  this.dot.setAttribute('x', 0);
  this.dot.setAttribute('y', 0);
  this.dot.setAttribute('r', '6');
  this.dot.setAttribute('stroke-width', '1');
  this.dot.setAttribute("fill", color);
  this.dot.setAttribute("stroke", color);

  // Create the line that indicates the rotation of the element
  this.line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  this.line.setAttribute('id', 'line2');
  this.line.setAttribute('x1', '0');
  this.line.setAttribute('y1', '0');
  this.line.setAttribute('x2', SE2.lineLength);
  this.line.setAttribute('y2', '0');
  this.line.setAttribute('stroke-width', SE2.lineWidth);
  this.line.setAttribute('stroke-linecap', 'round');
  this.line.setAttribute("stroke", color);

  // Create the wedge to visualze flexible rotations
  this.wedge = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  /* Adjust the size of the wedge based on the flexible position
  this.wedge.setAttribute("d", generateWedgeString((SE2.lineWidth + this.posThreshold)/2, 0, -this.rotThreshold/2, this.rotThreshold/2, SE2.lineLength));
  this.wedge.setAttribute('stroke-width', SE2.lineWidth + this.posThreshold);
  */
 
  this.wedge.setAttribute("d", generateWedgeString(SE2.lineWidth/2, 0, -this.rotThreshold/2, this.rotThreshold/2, SE2.lineLength));
  this.wedge.setAttribute('stroke-width', SE2.lineWidth);

  this.wedge.setAttribute('stroke-linecap', 'round');
  this.wedge.setAttribute("fill", "#DDD");
  this.wedge.setAttribute("stroke", "#DDD");
  //this.wedge.style.opacity = 0.5;

  // Create the cirlce to visualze flexible positions
  this.circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  this.circle.setAttribute('x', 0);
  this.circle.setAttribute('y', 0);
  this.circle.setAttribute('r', this.posThreshold);
  this.circle.setAttribute('stroke-width', '1');
  this.circle.setAttribute("fill", "#DDD");
  this.circle.setAttribute("stroke", "#DDD");
  //this.circle.style.opacity = 0.5;

  // Group them together
  this.group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  this.group.setAttribute('shape-rendering', 'inherit');
  this.group.setAttribute('pointer-events', 'all');
  if (this.rotThreshold > 5) {
    this.group.appendChild(this.wedge);
  }
  if (this.posThreshold > 5) {
    this.group.appendChild(this.circle);
  }
  this.group.appendChild(this.dot);
  this.group.appendChild(this.line);
  this.group.setAttribute("id", name);
  
  var ws = document.getElementById("workspace");
  this.size = ws.getBoundingClientRect();

  this.addToWorkspace = function () {
    var ws = document.getElementById("workspace");
    ws.appendChild(this.group);
  }

  this.removeFromWorkspace = function () {
    var ws = document.getElementById("workspace");
    ws.removeChild(this.group);
  }

  // We don't want the MoveableSE2 to also have a wedge and circle, this function is used to remove them
  this.disableFlexiblePose = function () {
    if (this.rotThreshold > 5) {
      this.group.removeChild(this.wedge);
    }
    if (this.posThreshold > 5) {
      this.group.removeChild(this.circle);
    }
  }

  this.setPose = function (pose) {
    this.pose = pose;
    this.moveNow();
  }

  this.setRotation = function (rotDeg) {
    this.pose.theta = rotDeg;
    this.moveNow();
  }

  this.setPosition = function (position) {
    this.pose.x = position.x;
    this.pose.y = position.y;
    this.moveNow();
  }

  this.moveNow = function () {
    // We want to limit the possible positions of the target within the bounds of the workspace
    this.group.setAttribute("transform",
      "translate(" + this.pose.x + " " +
      this.pose.y + ") rotate(" +
      this.pose.theta + " " + 0 + " " + 0 + ")");
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
* Constructor for moveable SE2, inherits SE2
*/
function moveableSE2(name, pose, color, hasHandle) {
  SE2.call(this, name, pose, color, 0, 0);

  this.startPose = null;
  this.isMoving = false;
  this.isTranslating = false;
  this.isRotating = false;

  // Disable the arc and circle for flexible pose
  this.disableFlexiblePose();

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
    this.pose.x = Math.min(Math.max(0, this.startPose.x + positionDiff.x), this.size.width);
  }

  this.translateYBy = function (positionDiff) {
    this.pose.y = Math.min(Math.max(0, this.startPose.y + positionDiff.y), this.size.height);
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