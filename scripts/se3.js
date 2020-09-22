const DEG_TO_RAD = Math.PI / 180;
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

  this.startPose;
  this.startRot;
  this.isMoving = false;
  this.isTranslating = false;
  this.isRotating = false;


  this.startTranslating = function () {
    var viewNum;
    switch (selectedView) {
      case "top":
        viewNum = 1;
        break;
      case "front":
        viewNum = 0;
        break;
      case "side":
        viewNum = 3;
        break;
    }
    this.startPose = world_to_screen_space(this.threejs_object, views[viewNum]);
    this.isMoving = true;
    this.isTranslating = true;
  }

  this.startRotating = function () {
    this.startRot = this.threejs_object.rotation;
    this.isMoving = true;
    this.isRotating = true;
  }

  this.stopMoving = function () {
    this.isMoving = false;
    this.isTranslating = false;
    this.isRotating = false;
  }

  this.getLoc = function (firstClickPoint, newPoint, viewNum) {
    var a = newPoint.diff(firstClickPoint).sum(this.startPose);
    return screen_to_world_space(a, views[viewNum]);
  }

  this.translateXBy = function (firstClickPoint, newPoint, viewNum) {
    this.threejs_object.position.x = this.getLoc(firstClickPoint, newPoint, viewNum).x;
  }

  this.translateYBy = function (firstClickPoint, newPoint, viewNum) {
    this.threejs_object.position.y = this.getLoc(firstClickPoint, newPoint, viewNum).y;
  }

  this.translateZBy = function (firstClickPoint, newPoint, viewNum) {
    this.threejs_object.position.z = this.getLoc(firstClickPoint, newPoint, viewNum).z;
  }
  
  this.rotateXBy = function (rot) {
    this.threejs_object.rotation.x = this.startRot.x + (rot * DEG_TO_RAD);
  }

  this.rotateYBy = function (rot) {
    this.threejs_object.rotation.y = this.startRot.y + (rot * DEG_TO_RAD);
  }

  this.rotateZBy = function (rot) {
    this.threejs_object.rotation.z = this.startRot.z + (rot * DEG_TO_RAD);
    //moveObject(Control.s_ring.group, this.pose.x, this.pose.y, this.threejs_object.rotation.z/DEG_TO_RAD);
    //console.log(this.threejs_object.rotation.z/DEG_TO_RAD, rot);
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