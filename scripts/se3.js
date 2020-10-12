const DEG_TO_RAD = Math.PI / 180;
const X_AXIS = new THREE.Vector3(1, 0, 0);
const Y_AXIS = new THREE.Vector3(0, 1, 0);
const Z_AXIS = new THREE.Vector3(0, 0, 1);

function rotateAroundWorldAxis(obj, axis, radians) {
  axis = axis.clone();
  obj.updateMatrixWorld();

  let rotWorldMatrix = new THREE.Matrix4();
  rotWorldMatrix.makeRotationAxis(axis.normalize(), radians);
  rotWorldMatrix.multiply(obj.matrix);
  obj.matrix = rotWorldMatrix;
  obj.setRotationFromMatrix(obj.matrix);
}

function getRotationComponentAboutAxis(rotation, direction) {
  var rotationAxis = new THREE.Vector3(rotation.x, rotation.y, rotation.z);
  var dotProd = direction.clone().dot(rotationAxis);
  var projection = direction.clone().multiplyScalar(dotProd); 

  var twist = new THREE.Quaternion(projection.x, projection.y, projection.z, rotation.w).normalize();

  if (dotProd < 0.0) {
    twist.x = -twist.x;
    twist.y = -twist.y;
    twist.z = -twist.z;
    twist.w = -twist.w;
  }
  console.log(twist)
  return 2*Math.acos(twist.w);
}

function intersect(obj1, obj2) {
  obj1.updateMatrixWorld();
  obj1.geometry.computeBoundingBox();
  obj2.updateMatrixWorld();
  obj2.geometry.computeBoundingBox();

  var bounding1 = obj1.geometry.boundingBox.clone();
  bounding1.applyMatrix4(obj1.matrixWorld);
  var bounding2 = obj2.geometry.boundingBox.clone();
  bounding2.applyMatrix4(obj2.matrixWorld);

  return bounding1.isIntersectionBox(bounding2);

}

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
      rotErr < rotThreshold / 2);
  }

  this.getPosition = function () {
    return new Position(this.x, this.y);
  }
}

/*
* Constructor for SE3 element class
*/
function SE3(name, pose, color, threejs_object, threejs_object_ghost, posThreshold = 0, rotThreshold = 0) {
  this.pose = pose;
  this.color = color;
  this.threejs_object = threejs_object;
  this.threejs_object_ghost = threejs_object_ghost;

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
    if (kinematics)
      dae.getObjectByName(arm_link_name).traverseDepth(function (obj, i) { if (obj.material) { obj.material.color.setHex(color); } }, 0);
  }

  this.resetColor = function () {
    if (kinematics)
      dae.getObjectByName(arm_link_name).traverseDepth(function (obj, i) { if (obj.material) { obj.material.color.setHex(0xCCCCCC); } }, 0);
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
function moveableSE3(name, pose, color, threejs_object, threejs_object_ghost, hasHandle) {
  SE3.call(this, name, pose, color, threejs_object, threejs_object_ghost, 0, 0);

  this.startPose;
  this.startRot = {
    x: 0,
    y: 0,
    z: 0
  };
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
    if (worldRotation){
      this.startRot.x = getRotationComponentAboutAxis(this.threejs_object.quaternion, X_AXIS) / DEG_TO_RAD;
      this.startRot.y = getRotationComponentAboutAxis(this.threejs_object.quaternion, Y_AXIS) / DEG_TO_RAD;
      this.startRot.z = getRotationComponentAboutAxis(this.threejs_object.quaternion, Z_AXIS) / DEG_TO_RAD;
    }
    else {
      this.startRot.x = this.threejs_object.rotation.x / DEG_TO_RAD;
      this.startRot.y = this.threejs_object.rotation.y / DEG_TO_RAD;
      this.startRot.z = this.threejs_object.rotation.z / DEG_TO_RAD;
    }
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
    rot = ((this.startRot.x - rot) % 360) * DEG_TO_RAD;
    this.threejs_object.updateMatrixWorld();

    if (worldRotation) {
      rotateAroundWorldAxis(this.threejs_object, X_AXIS, rot-getRotationComponentAboutAxis(this.threejs_object.quaternion, X_AXIS));
    } else {
      this.threejs_object.rotation.x = rot;
    }
  }

  this.rotateYBy = function (rot) {
    rot = ((this.startRot.y - rot) % 360) * DEG_TO_RAD;
    this.threejs_object.updateMatrixWorld();

    if (worldRotation) {
      rotateAroundWorldAxis(this.threejs_object, Y_AXIS, rot-getRotationComponentAboutAxis(this.threejs_object.quaternion, Y_AXIS));
    } else {
      this.threejs_object.rotation.y = rot;
    }
  }

  this.rotateZBy = function (rot) {
    rot = ((this.startRot.z - rot) % 360) * DEG_TO_RAD;
    this.threejs_object.updateMatrixWorld();

    if (worldRotation) {
      rotateAroundWorldAxis(this.threejs_object, Z_AXIS, rot-getRotationComponentAboutAxis(this.threejs_object.quaternion, Z_AXIS));
    } else {
      this.threejs_object.rotation.z = rot;
    }
  }
}

function SE3Target(color, pos, rot, dim) {
  var geo = new THREE.BoxGeometry(dim.x, dim.y, dim.z);
  var mat = new THREE.MeshLambertMaterial({ color: color });
  this.threejs_object = new THREE.Mesh(geo, mat);
  this.threejs_object.position.copy(pos);
  this.threejs_object.rotation.copy(rot);
  scene.add(this.threejs_object)

  this.isSame = function (se3) {
    var ee_threejs_object = se3.threejs_object;
    var l_finger = ee_threejs_object.getObjectByName("l_finger_mesh");
    var r_finger = ee_threejs_object.getObjectByName("r_finger_mesh");
    var finger_between = ee_threejs_object.getObjectByName("finger_between");

    return intersect(this.threejs_object, finger_between) && !(intersect(this.threejs_object, l_finger) || intersect(this.threejs_object, r_finger));
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