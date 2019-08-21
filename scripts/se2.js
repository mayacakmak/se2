/*
* Position class to represent 2D points and do simple
* operations on them
*/
function Position(x, y) {
  this.x = x;
  this.y = y;

  this.dot = function(other) {
      return (this.x*other.x)+(this.y*other.y);
  }

  this.diff = function(other) {
      return new Position(this.x-other.x, this.y-other.y);
  }

  this.length = function() {
      return Math.sqrt(Math.pow(this.x,2) + Math.pow(this.y,2));
  }

  this.dist = function(other) {
      return Math.sqrt(Math.pow((this.x-other.x),2) 
                       + Math.pow((this.y-other.y),2));
  }
}

/*
* Pose class to represent SE2 poses
*/
function Pose(x, y, theta) {

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

  this.threshold = 3;
  
  this.isSame = function(pose) {
    var xErr = Math.abs(this.x-pose.x);
    var yErr = Math.abs(this.y-pose.y);
    var rotErr = Math.abs(this.theta-pose.theta);
    return (xErr < this.threshold && 
            yErr < this.threshold && 
            rotErr < this.threshold);
  }

  this.getPosition = function() {
    return new Position(this.x, this.y);
  }
}

/*
* Constructor for SE2 element class
*/
function SE2(name, pose, color) {
  this.pose = pose;
  this.color = color;
  
  SE2.lineLength = 35;
  SE2.lineWidth = 5;
  
  // Create the "dot" that indicates the center (x, y) of the element
  this.circle = document.createElementNS('http://www.w3.org/2000/svg','circle');
  this.circle.setAttribute('x', 0);
  this.circle.setAttribute('y', 0);
  this.circle.setAttribute('r', '6');
  this.circle.setAttribute('stroke-width','1');
  this.circle.setAttribute("fill", color);
  this.circle.setAttribute("stroke", color);

  // Create the line that indicates the rotation of the element
  this.line = document.createElementNS('http://www.w3.org/2000/svg','line');
  this.line.setAttribute('id','line2');
  this.line.setAttribute('x1','0');
  this.line.setAttribute('y1','0');
  this.line.setAttribute('x2', SE2.lineLength);
  this.line.setAttribute('y2','0');
  this.line.setAttribute('stroke-width', SE2.lineWidth);
  this.line.setAttribute('stroke-linecap','round');
  this.line.setAttribute("stroke", color);
  
  // Group them together
  this.group = document.createElementNS('http://www.w3.org/2000/svg','g');
  this.group.setAttribute('shape-rendering', 'inherit');
  this.group.setAttribute('pointer-events', 'all');
  this.group.appendChild(this.circle);
  this.group.appendChild(this.line);
  this.group.setAttribute("id", name);
  this.group.style.opacity = 0.75;

  this.addToWorkspace = function() {
    var ws = document.getElementById("workspace");
    ws.appendChild(this.group);
  }
  
  this.removeFromWorkspace = function() {
    var ws = document.getElementById("workspace");
    ws.removeChild(this.group);
  }
  
  this.setPose = function(pose) {
    this.pose = pose;
    this.moveNow();
  }

  this.setRotation = function(rotDeg) {
    this.pose.theta = rotDeg;
    this.moveNow();
  }

  this.setPosition = function(position) {
    this.pose.x = position.x;
    this.pose.y = position.y;
    this.moveNow();
  }

  this.moveNow = function() {
    this.group.setAttribute("transform", 
                            "translate(" + this.pose.x + " " +
                            this.pose.y + ") rotate(" + 
                            this.pose.theta + " " + 0 + " " + 0 + ")");
  }

  this.setTempColor = function(color) {
    this.circle.setAttribute("fill", color);
    this.circle.setAttribute("stroke", color);
    this.line.setAttribute("stroke", color);
  }
  
  this.resetColor = function() {
    this.circle.setAttribute("fill", this.color);
    this.circle.setAttribute("stroke", this.color);
    this.line.setAttribute("stroke", this.color);
  }
  
  this.isSame = function(other) {
    return this.pose.isSame(other.pose);
  }
  
  this.getPosition = function() {
    return this.pose.getPosition();
  }
}

/*
* Constructor for moveable SE2, inherits SE2
*/
function moveableSE2(name, pose, color, hasHandle) {
  SE2.call(this, name, pose, color);
  
  this.startPose = null;
  this.isMoving = false;
  this.isTranslating = false;
  this.isRotating = false;
  
  this.startTranslating = function () {
    this.startPose = new Pose(this.pose.x, this.pose.y, this.pose.theta);
    this.isMoving = true;
    this.isTranslating = true;
  }
  
  this.startRotating = function() {
    this.startPose = new Pose(this.pose.x, this.pose.y, this.pose.theta);
    this.isMoving = true;
    this.isRotating = true;
  }
  
  this.stopMoving = function() {
    this.isMoving = false;
    this.isTranslating = false;
    this.isRotating = false;
  }

  this.rotateBy = function(degDiff) {
    this.pose.theta = this.startPose.theta + degDiff;
    if (this.pose.theta > 180)
      this.pose.theta -= 360;
    if (this.pose.theta < -180)
      this.pose.theta += 360;    
  }
  
  this.translateBy = function(positionDiff) {
    this.pose.x = this.startPose.x + positionDiff.x;
    this.pose.y = this.startPose.y + positionDiff.y;
  }

  this.translateXBy = function(positionDiff) {
    this.pose.x = this.startPose.x + positionDiff.x;
  }

  this.translateYBy = function(positionDiff) {
    this.pose.y = this.startPose.y + positionDiff.y;
  }
}

/*
* Utility function to move an entity to a desired SE2 pose
*/
function moveObject(object, x, y, theta, isFlip) {
    let transform = "translate(" + x + " " + y + ") "+
      "rotate(" + theta + " " + 0 + " " + 0 + ")";
    if (isFlip)
      transform += " scale(-1, 1)";
    object.setAttribute("transform", transform);
}

