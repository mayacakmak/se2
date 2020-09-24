/*
* Control class from which different control interfaces will inherit from
*/
function Control(name, ee, target, transitionType) {
  this.name = name;
  Control.ee = ee;
  Control.target = target;

  Control.transitionType = transitionType;
  Control.firstClickPoint = null;

  // Ring is not used for all control,
  // but still there for dimension consistency
  Control.t_ring = new Ring();
  Control.t_handle = new Handle();
  Control.t_ghost = new Ghost();
  Control.t_xArrows = new HorizontalArrows(Ring.innerR + Ring.ringRadius);
  Control.t_yArrows = new VerticalArrows(Ring.innerR + Ring.ringRadius);
  Control.t_panel = new Panel();

  Control.f_ring = new Ring();
  Control.f_handle = new Handle();
  Control.f_ghost = new Ghost();
  Control.f_xArrows = new HorizontalArrows(Ring.innerR + Ring.ringRadius);
  Control.f_yArrows = new VerticalArrows(Ring.innerR + Ring.ringRadius);
  Control.f_panel = new Panel();

  Control.s_ring = new Ring();
  Control.s_handle = new Handle();
  Control.s_ghost = new Ghost();
  Control.s_xArrows = new HorizontalArrows(Ring.innerR + Ring.ringRadius);
  Control.s_yArrows = new VerticalArrows(Ring.innerR + Ring.ringRadius);
  Control.s_panel = new Panel();

  /*
  * Utility function to check if the end effector has reached the target
  */

  Control.checkEEatTarget = function () {
    Control.checkAtTarget(Control.ee);
  }

  Control.checkAtTarget = function (se2) {
    var targetSuccessColor = "#393";

    if (Control.target.isSame(se2))
      se2.setTempColor(targetSuccessColor);
    else
      se2.resetColor();
  }

  Control.checkSuccess = function () {
    if (Control.target.isSame(Control.ee)) success();
  }

  Control.getScreenSpaceRot = function (event, viewNum) {
    var newClickPoint = getMousePosition(event);
    var centerPoint = world_to_screen_space(ik_target, views[viewNum]);
    var a = newClickPoint.diff(Control.firstClickPoint);
    var aUnit = new Position(a.x / a.length(), a.y / a.length());
    var b = newClickPoint.diff(centerPoint);
    var c = Control.firstClickPoint.diff(centerPoint);
    var cUnitOrth = new Position(c.y / c.length(), -c.x / c.length());
    var alphaSign = -Math.sign(cUnitOrth.dot(b));
    var dist = aUnit.dot(b);
    var alpha1 = Math.asin(dist / b.length());
    var alpha2 = Math.asin((a.length() - dist) / c.length());
    var alpha = alphaSign * (alpha1 + alpha2);
    var alphaDeg = Math.round(180.0 * alpha / Math.PI);

    if (!isNaN(alpha)) {
      return alphaDeg;
    }
    return false;
  }

  Control.updateControlPositions = function () {
    var t_pose = world_to_screen_space(ik_target, views[1])
    Control.t_ring.setPose(t_pose);
    Control.t_xArrows.setPosition(t_pose);
    Control.t_yArrows.setPosition(t_pose);
    Control.t_handle.setPose(t_pose);

    var f_pose = world_to_screen_space(ik_target, views[0])
    Control.f_ring.setPose(f_pose);
    Control.f_xArrows.setPosition(f_pose);
    Control.f_yArrows.setPosition(f_pose);
    Control.f_handle.setPose(f_pose);
    
    var s_pose = world_to_screen_space(ik_target, views[3])
    Control.s_ring.setPose(s_pose);
    Control.s_xArrows.setPosition(s_pose);
    Control.s_yArrows.setPosition(s_pose);
    Control.s_handle.setPose(s_pose);
  }

}

/*
* Finite State Machine class to keep track of interface states for
* different interfaces.
*/
function FSM(states, transitions) {
  this.currentState = "cursor-free";
  this.states = states;
  this.transitions = transitions;

  this.emitEvent = function (eventName) {
    console.log("EVENT: " + eventName);
    for (var i = 0; i < this.transitions.length; i++) {
      if (transitions[i].event == eventName) {
        if (transitions[i].s0 == this.currentState) {
          var s0 = this.currentState;
          this.currentState = transitions[i].s1;
          console.log(s0 + " >> " + this.currentState);
          if (!offline)
            Database.logEvent({
              eventType: "StateTransition",
              prevState: s0,
              eventName: eventName,
              newState: this.currentState
            });
        }
      }
    }
  }
}

function Transition(s0, event, s1) {
  this.s0 = s0;
  this.event = event;
  this.s1 = s1;
}

/*
* Utility function to get mouse coordiantes from a mouse event
*/
function getMousePosition(event) {
  var ws = document.getElementById("workspace");
  var rect = ws.getBoundingClientRect();
  var mouseX = event.clientX - rect.left;
  var mouseY = event.clientY - rect.top;
  return new Position(mouseX, mouseY);
}


/*
* Utility function to get the 3d position of a object from the camera and mouse coordinates
*/
function screen_to_world_space(mousePos, view) {
  var x = map_range(mousePos.x, windowWidth * view.left, windowWidth * (view.left + view.width), -1, 1);
  var y = map_range(mousePos.y, windowHeight * (1 - view.bottom - view.height), windowHeight * (1 - view.bottom), 1, -1);
  return new THREE.Vector3(x, y, -1).unproject(view.camera);
}


/*
* Utility function to get the 2d position of a object from the camera and object coordinates
*/
function world_to_screen_space(object, view) {

  var vector = new THREE.Vector3();
  vector.setFromMatrixPosition(object.matrixWorld).project(view.camera);

  return new Pose(
    Math.round(map_range(vector.x, -1, 1, windowWidth * view.left, windowWidth * (view.left + view.width))), 
    Math.round(map_range(vector.y, 1, -1, windowHeight * (1 - view.bottom - view.height), windowHeight * (1 - view.bottom), limit_range = false)),
    0);
}

/*
* Utility class for the "ring" element for some of the controllers
*/
function Ring() {
  Ring.innerR = 40;
  Ring.ringRadius = 18;

  this.group = document.createElementNS("http://www.w3.org/2000/svg", "circle");
  this.group.setAttribute("id", "ring");
  this.group.setAttribute("r", Ring.innerR + Ring.ringRadius / 2);
  this.group.setAttribute("stroke-width", Ring.ringRadius);
  this.group.style.fill = "none";
  this.group.style.opacity = 0.75;
  this.group.setAttribute("stroke-dasharray", "30, 0.3");

  this.setPose = function (pose) {
    moveObject(this.group, pose.x, pose.y, pose.theta);
  }

  this.resetColor = function () {
    this.group.style.stroke = "#AAC";
  }

  this.highlight = function () {
    this.group.style.stroke = "#BBD";
  }

  this.resetColor();
}


/*
* Utility class for the "handle" element for dragging the end-effector in 2D
*/
function Handle() {

  this.group = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  this.group.setAttribute("id", "handle");
  this.group.setAttribute('x', 0);
  this.group.setAttribute('y', 0);
  this.group.setAttribute('r', SE3.lineLength + SE3.lineWidth);
  this.group.setAttribute('stroke-width', 0);
  this.group.setAttribute("fill-opacity", 0.5);

  this.setPose = function (pose) {
    moveObject(this.group, pose.x, pose.y, pose.theta);
  }

  this.resetColor = function () {
    this.group.setAttribute("fill", "#edb9d7");
  }

  this.highlight = function () {
    this.group.setAttribute("fill", "#fdc9e7");
  }

  this.resetColor();
}

/*
* Utility class for the "handle" element for dragging the end-effector in 2D
*/
function Panel() {

  Panel.width = 150;
  Panel.height = 150;
  this.group = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  this.group.setAttribute("id", "handle");
  this.group.setAttribute('x', 0); //ws.width-width
  this.group.setAttribute('y', 0);
  this.group.setAttribute('height', Panel.height);
  this.group.setAttribute('width', Panel.width);
  this.group.setAttribute('stroke-width', 0);
  this.group.setAttribute("fill", "#DDD");

  Panel.getCenterPose = function () {
    return new Pose(Panel.width / 2, Panel.height / 2, 0);
  }
}

/*
* Utility class for the count down timer element for the start of a cycle
*/
function Timer() {

  var ws = document.getElementById("workspace");
  var rect = ws.getBoundingClientRect();
  Panel.width = rect.width;
  Panel.height = rect.height;

  // This seems redundant but keeping it commented out for now
  // this.group = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  // this.group.setAttribute("id", "overlay");
  // this.group.setAttribute('x', 0);
  // this.group.setAttribute('y', 0);
  // this.group.setAttribute('height', Panel.height);
  // this.group.setAttribute('width', Panel.width);
  // this.group.setAttribute('stroke-width', 0);
  // this.group.setAttribute("fill", "#FFF");

  Timer.timer = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  Timer.timer.setAttribute("id", "timer");
  Timer.timer.setAttribute('x', Panel.width / 2);
  Timer.timer.setAttribute('y', Panel.height / 2);
  Timer.timer.setAttribute("fill", "#000");
  Timer.timer.setAttribute("style", "font-family:Varela Round, sans-serif; font-size: 100px;");
  Timer.timer.setAttribute("text-anchor", "middle");
  Timer.timer.setAttribute("dominant-baseline", "middle");

  Timer.button = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  Timer.button.setAttribute("id", "button");
  Timer.button.setAttribute('x', Panel.width / 4);
  Timer.button.setAttribute('y', 4 * Panel.height / 10);
  Timer.button.setAttribute('width', Panel.width / 2);
  Timer.button.setAttribute('height', Panel.height / 5);
  Timer.button.setAttribute('rx', 10);
  Timer.button.setAttribute("fill", "#FFF");
  Timer.button.setAttribute("stroke-width", 2);
  Timer.button.setAttribute("stroke", "#333");
  Timer.button.setAttribute("cursor", "pointer");
  Timer.button.setAttribute("onclick", "Timer.startTimer()");

  Timer.buttonText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  Timer.buttonText.setAttribute("id", "button-text");
  Timer.buttonText.setAttribute('x', Panel.width / 2);
  Timer.buttonText.setAttribute('y', Panel.height / 2);
  Timer.buttonText.setAttribute("fill", "#333");
  Timer.buttonText.setAttribute("style", "font-family:Varela Round, sans-serif; font-size: 42px;");
  Timer.buttonText.setAttribute("text-anchor", "middle");
  Timer.buttonText.setAttribute("dominant-baseline", "middle");
  Timer.buttonText.innerHTML = "I'm ready!";
  Timer.buttonText.setAttribute("cursor", "pointer");
  Timer.buttonText.setAttribute("onclick", "Timer.startTimer()");

  Timer.countText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  Timer.countText.setAttribute("id", "button-text");
  Timer.countText.setAttribute('x', 9 * Panel.width / 10);
  Timer.countText.setAttribute('y', Panel.height / 10);
  Timer.countText.setAttribute("fill", "#0275d8");
  Timer.countText.setAttribute("style", "font-family:Varela Round, sans-serif; font-size: 32px;");
  Timer.countText.setAttribute("text-anchor", "middle");
  Timer.countText.setAttribute("dominant-baseline", "middle");
  Timer.countText.innerHTML = "0/36";

  Timer.group = document.createElementNS('http://www.w3.org/2000/svg', 'g');

  Timer.timerDoneCallback = null;

  this.reset = function (addText) {
    Timer.setText("");
    Timer.showButton();
    Timer.setVisible(true);
    Timer.countText.innerHTML = addText;
  }

  Timer.startTimer = function () {
    console.log("Started timer");
    Timer.showText();

    let timerDuration = 3500;
    var countDownDate = new Date().getTime() + timerDuration;
    Timer.setText(Math.floor(timerDuration / 1000));
    // Update the count down every 1 second
    var x = setInterval(function () {
      // Get today's date and time
      var now = new Date().getTime();
      // Find the distance between now and the count down date
      var distance = countDownDate - now;
      // Time calculations for seconds
      var seconds = Math.floor((distance % (1000 * 60)) / 1000);
      Timer.setText(seconds);
      // If the count down is finished, write some text
      if (seconds <= 0) {
        clearInterval(x);
        Timer.setVisible(false);
        Timer.timerDoneCallback();
        // timer.setText("Go");
        // setTimeout(function () {
        // }, 1000)
      }
    }, 1000);
  }

  Timer.setText = function (text) {
    Timer.timer.innerHTML = text;
  }

  Timer.showButton = function () {
    while (Timer.group.lastChild)
      Timer.group.removeChild(Timer.group.lastChild);
    Timer.group.appendChild(Timer.button);
    Timer.group.appendChild(Timer.buttonText);
    Timer.group.appendChild(Timer.countText);
  }

  Timer.showText = function () {
    while (Timer.group.lastChild)
      Timer.group.removeChild(Timer.group.lastChild);
    Timer.group.appendChild(Timer.timer);
  }

  Timer.setVisible = function (isVisible) {
    var ws = document.getElementById("workspace");
    if (isVisible) {
      ws.appendChild(Timer.group);
    } else if (ws.contains(Timer.group)) {
      ws.removeChild(Timer.group);
    }
  }
}

/*
* Utility class for the "handle" element for dragging the end-effector in 2D
*/
function Ghost() {
  Ghost.color = "#edb9d7";
  SE3.call(this, "ghost", null, Ghost.color);

  this.setVisible = function (isVisible) {
    var ws = document.getElementById("workspace");
    if (isVisible)
      ws.appendChild(this.group);
    else if (ws.contains(this.group))
      ws.removeChild(this.group);
  }

}

function Arrow(id) {
  Arrow.arrowShaftLength = 16;
  Arrow.lipHeight = 6;
  Arrow.arrowheadLength = 20;
  Arrow.arrowLengthTot = Arrow.arrowShaftLength + Arrow.arrowheadLength;
  Arrow.arrowWidth = 20;

  Arrow.createArrow = function (arrow) {
    arrow.setAttribute("d", "M0," + (0) + " h" + Arrow.arrowShaftLength +
      "v" + (-Arrow.lipHeight) + "l" + Arrow.arrowheadLength + "," + (Arrow.lipHeight + (Arrow.arrowWidth / 2)) +
      "l" + (-Arrow.arrowheadLength) + "," + (Arrow.lipHeight + (Arrow.arrowWidth / 2)) +
      "v" + (-Arrow.lipHeight) + "h" + (-Arrow.arrowShaftLength) + "z");
  }

  Arrow.createRotationArrow = function (arrow) {
    let r1 = Arrow.arrowShaftLength * 2.5;
    let r2 = Arrow.arrowShaftLength * 2.5 - 2 * Arrow.arrowheadLength
      + 3 * Arrow.lipHeight;
    arrow.setAttribute("d",
      "M 0 0 " +
      "a " + r1 + " " + r1 + " 3 0 1 "
      + r1 + " " + r1 + " " +
      "l " + 1.5 * Arrow.lipHeight + " 0 " +
      "l -" + Arrow.arrowheadLength + " " + Arrow.arrowheadLength + " " +
      "l -" + Arrow.arrowheadLength + " -" + Arrow.arrowheadLength + " " +
      "l " + 1.5 * Arrow.lipHeight + " 0" +
      "a " + r2 + " " + r2 + " 0 0 0 -"
      + r2 + " -" + r2 + " " +
      "l 0 -" + Arrow.arrowheadLength);
  }

  this.group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  this.group.setAttribute('shape-rendering', 'inherit');
  this.group.setAttribute('pointer-events', 'all');
  this.group.setAttribute("id", id);
  this.group.style.opacity = 0.75;

  this.setPose = function (pose) {
    moveObject(this.group, pose.x, pose.y, pose.theta);
  }

  this.setPosition = function (pose) {
    moveObject(this.group, pose.x, pose.y, 0);
  }
}

/*
* Utility classes for arrows
*/
function VerticalArrows(arrowOffset) {
  Arrow.call(this, "yArrows");

  this.arrowUp = document.createElementNS(
    'http://www.w3.org/2000/svg', 'path');
  this.arrowDown = document.createElementNS(
    'http://www.w3.org/2000/svg', 'path');

  let arrows = [this.arrowUp, this.arrowDown];

  for (let arrow of arrows) {
    Arrow.createArrow(arrow);
    this.group.appendChild(arrow);
  }

  moveObject(this.arrowUp, Arrow.arrowWidth / 2, arrowOffset, 90);
  moveObject(this.arrowDown, -Arrow.arrowWidth / 2, -arrowOffset, -90);

  this.arrowUp.setAttribute("id", "arrowUp");
  this.arrowDown.setAttribute("id", "arrowDown");

  this.resetColor = function () {
    this.arrowUp.style.fill = "#cc070e";
    this.arrowDown.style.fill = "#cc070e";
  }

  this.highlight = function (element) {
    if (element == undefined) {
      this.arrowUp.style.fill = "#ed272e";
      this.arrowDown.style.fill = "#ed272e";
    }
    else {
      element.style.fill = "#ed272e";
    }
  }

  this.resetColor();

}

function RotateArrows(arrowOffset) {
  Arrow.call(this, "thetaArrows");

  this.arrowCW = document.createElementNS(
    'http://www.w3.org/2000/svg', 'path');
  this.arrowCCW = document.createElementNS(
    'http://www.w3.org/2000/svg', 'path');

  let arrows = [this.arrowCW, this.arrowCCW];

  for (let arrow of arrows) {
    Arrow.createRotationArrow(arrow);
    this.group.appendChild(arrow);
  }

  let arrowYOffset = Ring.innerR + Ring.ringRadius;

  moveObject(this.arrowCW, Panel.height / 6, -Panel.height / 2.2, 0);
  moveObject(this.arrowCCW, -Panel.height / 6, -Panel.height / 2.2, 0, true);

  this.arrowCW.setAttribute("id", "arrowCW");
  this.arrowCCW.setAttribute("id", "arrowCCW");

  this.resetColor = function () {
    this.arrowCW.style.fill = "#07cc0e";
    this.arrowCCW.style.fill = "#07cc0e";
  }

  this.highlight = function (element) {
    if (element == undefined) {
      this.arrowCW.style.fill = "#27ed2e";
      this.arrowCCW.style.fill = "#27ed2e";
    }
    else
      element.style.fill = "#27ed2e";
  }

  this.resetColor();

}

function HorizontalArrows(arrowOffset) {
  Arrow.call(this, "xArrows");

  this.arrowLeft = document.createElementNS(
    'http://www.w3.org/2000/svg', 'path');
  this.arrowRight = document.createElementNS(
    'http://www.w3.org/2000/svg', 'path');

  let arrows = [this.arrowLeft, this.arrowRight];

  for (let arrow of arrows) {
    Arrow.createArrow(arrow);
    this.group.appendChild(arrow);
  }

  moveObject(this.arrowLeft, arrowOffset, -Arrow.arrowWidth / 2, 0);
  moveObject(this.arrowRight, -arrowOffset, Arrow.arrowWidth / 2, 180);

  this.arrowLeft.setAttribute("id", "arrowLeft");
  this.arrowRight.setAttribute("id", "arrowRight");

  this.resetColor = function () {
    this.arrowLeft.style.fill = "#181acc";
    this.arrowRight.style.fill = "#181acc";
  }

  this.highlight = function (element) {
    if (element == undefined) {
      this.arrowLeft.style.fill = "#383aec";
      this.arrowRight.style.fill = "#383aec";
    }
    else {
      element.style.fill = "#383aec";
    }
  }

  this.resetColor();
}


/* Register callbacks for all relevant events.
  * All events will be handled by the same function (parameter Control.handleEvent),
  * however, we want to capture the different events on different elements.
  * The transitions given at constrution time will tell us which events matter 
  * for this particular interface.
  * The full list of interface events:
  * ee-press: Mouse pressed on the end effector
  * ee-release: Mouse released on the end effector
  * ring-press: Mouse pressed on the ring
  * ring-release: Mouse released on the ring
  ******
  * ee-click: Mouse clicked on the end effector
  * ring-click: Mouse clicked on the ring
  * arrow-press: Mouse pressed on the ring
  * arrow-release: Mouse released on the ring
  * arrow-click: Mouse clicked on the ring
*/

////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////
/////// STUFF below is deprecated or needs to be upgraded
////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////

function setupControlInterface() {
  var ws = document.getElementById("workspace");
  arrowsSix = null;

  if (controlTypes[control] === "drag") {
    // if (isOneTouch)
    //     ee.group.setAttributeNS(null, "onclick", "startDrag(event)");
    // else
    //ee.group.setAttributeNS(null, "onmousedown", "startDrag(event)");


  }
  else if (controlTypes[control] === "arrows") {
    createRing();
    createArrows();
    if (isOneTouch) {
      arrowRight.setAttribute("onclick", "startDrag(event, RIGHT)");
      arrowLeft.setAttribute("onclick", "startDrag(event, LEFT)");
      arrowUp.setAttribute("onclick", "startDrag(event, UP)");
      arrowDown.setAttribute("onclick", "startDrag(event, DOWN)");
    }
    else {
      arrowRight.setAttribute("onmousedown", "startDrag(event, RIGHT)");
      arrowLeft.setAttribute("onmousedown", "startDrag(event, LEFT)");
      arrowUp.setAttribute("onmousedown", "startDrag(event, UP)");
      arrowDown.setAttribute("onmousedown", "startDrag(event, DOWN)");
    }
  }
  else if (controlTypes[control] === "arrowsClick") {
    // no case for OneTouch at the moment
    createSixArrows();
    arrowRight.setAttribute("onmousedown", "startDrag(event, RIGHT)");
    arrowLeft.setAttribute("onmousedown", "startDrag(event, LEFT)");
    arrowUp.setAttribute("onmousedown", "startDrag(event, UP)");
    arrowDown.setAttribute("onmousedown", "startDrag(event, DOWN)");
    arrowCW.setAttribute("onmousedown", "startRotate2(event,CW)");
    arrowCCW.setAttribute("onmousedown", "startRotate2(event,CCW)");
  }
  else if (controlTypes[control] === "arrowsHover") {
    // no case for OneTouch
    createSixArrows();
    arrowRight.setAttribute("onmouseover", "startDrag(event, RIGHT)");
    arrowLeft.setAttribute("onmouseover", "startDrag(event, LEFT)");
    arrowUp.setAttribute("onmouseover", "startDrag(event, UP)");
    arrowDown.setAttribute("onmouseover", "startDrag(event, DOWN)");
    arrowCW.setAttribute("onmouseover", "startDrag(event,CW)");
    arrowCCW.setAttribute("onmouseover", "startDrag(event,CCW)");
  }
  else if (controlTypes[control] === "target") {
    createGhost();
    if (isOneTouch) {
      ws.setAttribute("onclick", "startGhost(event)");
    }
    else {
      ws.setAttribute("onmousedown", "startGhost(event)");
    }
  }
  else {
    console.error("Please select a valid control");
  }
}

function createTrajectoryArrows() {
  var ws = document.getElementById("workspace");
  trajArrows = [];
  trajNums = [];
  for (var i = 0; i < numTrajArrows; i++) {
    var angle = ((2 * Math.PI) / numTrajArrows) * i;
    var unitX = Math.cos(angle);
    var unitY = Math.sin(angle);
    var x = unitX * trajArrowLength;
    var y = unitY * trajArrowLength;

    var arrow = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    arrow.setAttribute('x1', 0);
    arrow.setAttribute('y1', 0);
    arrow.setAttribute('x2', x);
    arrow.setAttribute('y2', y);
    arrow.setAttribute('stroke', "red");
    arrow.setAttribute('stroke-width', lineThickness);
    arrow.setAttribute('id', (i + 1));
    arrow.setAttribute('value', String(unitX + "," + unitY));
    moveObject(arrow, ee.pose.x, ee.pose.y, ee.pose.theta);
    trajArrows.push(arrow);
    ws.appendChild(arrow);

    var num = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    num.setAttribute('x', x * 1.2);
    num.setAttribute('y', y * 1.2);
    num.style.fontSize = trajFontSize + "px";
    num.innerHTML = i;
    trajNums.push(num);
    ws.appendChild(num);
  }
}

function createGhost() {
  var ws = document.getElementById("workspace");
  ghost = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  ghost.setAttribute('x1', 0);
  ghost.setAttribute('y1', 0);
  ghost.setAttribute('x2', 0);
  ghost.setAttribute('y2', 0);
  ghost.setAttribute('stroke', "red");
  ghost.setAttribute('stroke-width', lineThickness);
  ws.appendChild(ghost);
}




function createArrows() {
  var ws = document.getElementById("workspace");

  arrowRight = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  arrowLeft = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  arrowUp = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  arrowDown = document.createElementNS('http://www.w3.org/2000/svg', 'path');

  arrows = [arrowRight, arrowLeft, arrowUp, arrowDown];

  arrows.forEach(function (arrow) {
    arrow.setAttribute("d", "M0," + (0) + " h" + arrowShaftLength + "v" + (-lipHeight) + "l" + arrowheadLength + "," + (lipHeight +
      (arrowWidth / 2)) + "l" + (-arrowheadLength) + "," +
      (lipHeight + (arrowWidth / 2)) + "v" + (-lipHeight) + "h" + (-arrowShaftLength) + "z");
  });

  arrowRight.style.fill = "#181acc";
  arrowLeft.style.fill = "#181acc";
  arrowUp.style.fill = "#cc070e";
  arrowDown.style.fill = "#cc070e";

  arrows.forEach(function (arrow) {
    ws.appendChild(arrow);
  });

  arrowRightXOffset = innerR + ringWidth;
  arrowRightYOffset = - arrowWidth / 2;
  arrowLeftXOffset = - (innerR + ringWidth);
  arrowLeftYOffset = arrowWidth / 2;
  arrowUpXOffset = - arrowWidth / 2;
  arrowUpYOffset = - (innerR + ringWidth);
  arrowDownXOffset = arrowWidth / 2;
  arrowDownYOffset = (innerR + ringWidth);

  // The transform attribute gets set in resetPose()
}

function createSixArrows() {
  var ws = document.getElementById("workspace");

  arrowRight = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  arrowLeft = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  arrowUp = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  arrowDown = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  arrowCW = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  arrowCCW = document.createElementNS('http://www.w3.org/2000/svg', 'path');

  arrowsSix = [arrowRight, arrowLeft, arrowUp, arrowDown, arrowCW, arrowCCW];

  arrowsSix.forEach(function (arrow) {
    arrow.setAttribute("d", "M0," + (0) + " h" + arrowShaftLength + "v" + (-lipHeight) + "l" + arrowheadLength + "," + (lipHeight +
      (arrowWidth / 2)) + "l" + (-arrowheadLength) + "," +
      (lipHeight + (arrowWidth / 2)) + "v" + (-lipHeight) + "h" + (-arrowShaftLength) + "z");
  });

  arrowRight.style.fill = "#181acc";
  arrowLeft.style.fill = "#181acc";
  arrowUp.style.fill = "#cc070e";
  arrowDown.style.fill = "#cc070e";
  arrowCW.style.fill = "#a442f4"; // when clicked = #bf42f4
  arrowCCW.style.fill = "#36bc3d";// for now when clicked = #4cef23

  arrowRightXOffset = innerR +
    Width;
  arrowRightYOffset = - arrowWidth / 2;
  arrowLeftXOffset = - (innerR + ringWidth);
  arrowLeftYOffset = arrowWidth / 2;
  arrowUpXOffset = - arrowWidth / 2;
  arrowUpYOffset = - (innerR + ringWidth);
  arrowDownXOffset = arrowWidth / 2;
  arrowDownYOffset = (innerR + ringWidth);
  arrowCWXOffset = Math.round((innerR + ringWidth - arrowWidth / 2) * 0.707) + arrowWidth / 2;
  arrowCWYOffset = - Math.round((innerR + ringWidth + arrowWidth / 2) * 0.707) - arrowWidth;
  arrowCCWXOffset = - Math.round((innerR + ringWidth + arrowWidth / 2) * 0.707) + arrowWidth / 2;
  arrowCCWYOffset = - Math.round((innerR + ringWidth - arrowWidth / 2) * 0.707) - arrowWidth;

  arrowsSix.forEach(function (arrow) {
    ws.appendChild(arrow);
  });

  // The transform attribute gets set in resetPose()
}


function startGhost(event) {
  var ws = document.getElementById("workspace");
  ghost.setAttribute("x1", 0);
  ghost.setAttribute("x2", 0);
  ghost.setAttribute("y1", 0);
  ghost.setAttribute("y2", 0);
  targetFixedX = e.offsetX;
  targetFixedY = e.offsetY;
  ws.setAttribute("onmousemove", "drawGhost(event)");
  if (isOneTouch) {
    ws.setAttribute("onclick", "targetMoveEE(event)");
  }
  else {
    ws.setAttribute("onmouseup", "targetMoveEE(event)");
  }
}


function drawGhost(event) {
  ghost.setAttribute('x1', targetFixedX);
  ghost.setAttribute('y1', targetFixedY);
  ghost.setAttribute('x2', e.offsetX);
  ghost.setAttribute('y2', e.offsetY);

  var deltaX = e.offsetX - targetFixedX;
  var deltaY = e.offsetY - targetFixedY;
  var angle = Math.atan2(deltaY, deltaX) * 180 / Math.PI;
  angle -= 90;
  if (angle > 180)
    angle -= 360;
  if (angle < -180)
    angle += 360;

  if (checkGoal(targetFixedX, targetFixedY, targetPos[0], targetPos[1], angle, targetRot)) {
    target.setAttribute("stroke-dasharray", "10, 5");
    target.style.stroke = targetSuccessColor;
  }
  else {
    target.removeAttribute("stroke-dasharray");
    target.style.stroke = targetColor;
  }
}

function targetMoveEE(event) {
  var ws = document.getElementById("workspace");
  ws.removeAttribute("onmousemove");
  target.removeAttribute("stroke-dasharray");
  pos = [targetFixedX, targetFixedY];
  var deltaX = e.offsetX - targetFixedX;
  var deltaY = e.offsetY - targetFixedY;
  var angle = Math.atan2(deltaY, deltaX) * 180 / Math.PI;
  angle -= 90;
  rot = angle;
  if (rot > 180)
    rot -= 360;
  if (rot < -180)
    rot += 360;

  updatePose();

  if (target.isSame(ee))
    success();

  // if(checkGoal(pos[0], pos[1], targetPos[0], targetPos[1], rot, targetRot)){
  //     success();
  // }


  if (isOneTouch)
    ws.setAttribute("onclick", "startGhost(event)");
}

function updatePose() {
  // Place the controllable end effector at the center of the workspace

  if (ring) {
    moveObject(ring, ee.pose.x, ee.pose.y, ee.pose.theta);
  }

  if (arrows) {
    moveObjectAndScale(arrowRight, pos[0] + arrowRightXOffset, pos[1] + arrowRightYOffset, 0, scale);
    moveObjectAndScale(arrowLeft, pos[0] + arrowLeftXOffset, pos[1] + arrowLeftYOffset, 180, scale);
    moveObjectAndScale(arrowUp, pos[0] + arrowUpXOffset, pos[1] + arrowUpYOffset, -90, scale);
    moveObjectAndScale(arrowDown, pos[0] + arrowDownXOffset, pos[1] + arrowDownYOffset, 90, scale);
  }

  if (arrowsSix) {
    var center = [105, 105];
    moveObjectAndScale(arrowRight, center[0] + arrowRightXOffset, center[1] + arrowRightYOffset, 0, scale);
    moveObjectAndScale(arrowLeft, center[0] + arrowLeftXOffset, center[1] + arrowLeftYOffset, 180, scale);
    moveObjectAndScale(arrowUp, center[0] + arrowUpXOffset, center[1] + arrowUpYOffset, -90, scale);
    moveObjectAndScale(arrowDown, center[0] + arrowDownXOffset, center[1] + arrowDownYOffset, 90, scale);
    arrowCCW.setAttribute("transform", "translate(" + (center[0] + arrowCCWXOffset) + " " + (center[1] + arrowCCWYOffset) + ") rotate(" + (135) + " " + 0 + " " + 0 + ") scale(" + scale + ")");
    arrowCW.setAttribute("transform", "translate(" + (center[0] + arrowCWXOffset) + " " + (center[1] + arrowCWYOffset) + ") rotate(" + (45) + " " + 0 + " " + 0 + ") scale(" + scale + ")");
  }
  /*
  if(trajArrows){
      trajArrows.forEach(function (arrow) {
          moveObject(arrow, pos[0], pos[1], 0);

      });
  }

  if(trajNums){
      trajNums.forEach(function (num) {
          moveObject(num, pos[0], pos[1], 0);
      });
  }*/


}


function startDrag(event, direction) {
  refPoint = getMousePosition(event);
  ee.startDrag();

  var ws = document.getElementById("workspace");


  // this is for controlType = "drag"
  if (direction == undefined) {
    //         ws.setAttributeNS(null, "onmousemove", "drag(event)");

    //         if (isOneTouch)
    //             ee.group.setAttributeNS(null, "onclick", "stopDrag(event)");
    //         else
    //             ws.setAttributeNS(null, "onmouseup", "stopDrag(event)");

    //ee.group.style.fill = "#9EE";
  }
  // This is for controlTypes involving arrows
  else {
    if (controlTypes[control] == "arrowsClick") {
      ws.setAttributeNS(null, "onmousedown", "drag(event, " + direction + ")");
    }
    if (controlTypes[control] == "arrowsHover") {
      ws.setAttributeNS(null, "onmouseover", "drag(event, " + direction + ")");
    }
    else {
      ws.setAttributeNS(null, "onmousemove", "drag(event, " + direction + ")");
    }
    if (direction == LEFT || direction == RIGHT) {
      event.target.style.fill = "#4a4aff"
    }
    else if (direction == UP || direction == DOWN) {
      event.target.style.fill = "#ff070e"
    }
    else if (direction == CW) {
      event.target.style.fill = "#bf42f4"
    }
    else if (direction == CCW) {
      event.target.style.fill = "#4cef23"
    }
    if (isOneTouch) {
      arrows.forEach(function (arrow) {
        arrow.setAttributeNS(null, "onclick", "stopDrag(event, " + direction + ")");
      });
      ws.setAttribute("onclick", "stopDrag(event, " + direction + ")");
      event.stopPropagation();
    }
    else {
      if (controlTypes[control] == "arrowsClick") {
        ws.setAttributeNS(null, "onmouseup", "stopDrag(event, " + direction + ")");
      }
      if (controlTypes[control] == "arrowsHover") {
        ws.setAttributeNS(null, "onmouseout", "stopDrag(event, " + direction + ")");
      }
      ws.setAttributeNS(null, "onmouseup", "stopDrag(event, " + direction + ")");
    }
  }

}

function startRotate(event) {
  refPoint = getMousePosition(event);
  ee.startRotate();

  var ws = document.getElementById("workspace");
  ws.setAttributeNS(null, "onmousemove", "rotate(event)");

  if (isOneTouch) {
    ring.setAttributeNS(null, "onclick", "stopRotate(event)");
    ws.setAttribute("onclick", "stopRotate(event)");
    event.stopPropagation();
  }
  else
    ws.setAttributeNS(null, "onmouseup", "stopRotate(event)");
  ring.style.stroke = "#99E";
}


function drag(event, direction) {
  var newPoint = getMousePosition(event);
  var a = newPoint.diff(refPoint);

  if (controlTypes[control] == "arrowsClick" || controlTypes[control] == "arrowsHover") {
    var delta = 3;
    if (direction == LEFT || direction == UP) {
      a = new Position(-delta, -delta);
    }
    else {
      a = new Position(delta, delta);
    }
  }

  if (direction == undefined) {
    ee.translateBy(a);
  }
  else if (direction == RIGHT || direction == LEFT) {
    pos = [startPos[0] + a[0], startPos[1]];
  } else if (direction == UP || direction == DOWN) {
    pos = [startPos[0], startPos[1] + a[1]];
  } else {
    console.error("Bad direction");
  }
  //updatePose();
}

// Check if target is reached
function checkGoal(currPoseX, currPoseY, goalPoseX, goalPoseY, currRot, goalRot) {
  var xErr = Math.abs(currPoseX - goalPoseX);
  var yErr = Math.abs(currPoseY - goalPoseY);
  var rotErr = Math.abs(currRot - goalRot);

  return (xErr < threshold && yErr < threshold && rotErr < threshold);
}

function rotate(event, direction) {
  var newPoint = null;
  var delta = 3;
  if (direction == undefined) {
    newPoint = getMousePosition(event);
  }
  else if (direction == CW) {
    newPoint = new Position(ee.pose.x + 2 * delta, ee.pose.y - delta);
    refPoint = new Position(ee.pose.x + 1, ee.pose.y - 1);
  }
  else if (direction == CCW) {
    newPoint = [ee.pose.x + 2 * delta, ee.pose.y + delta];
    refPoint = new Position(ee.pose.x + 1, ee.pose.y + 1);
  }
  // This was the original rotate method with the undefined direction part

}


function stopDrag(event, direction) {
  if (ee.isTranslating) {
    var ws = document.getElementById("workspace");
    ws.removeAttributeNS(null, "onmousemove");

    if (direction == undefined) {
      if (isOneTouch) {
        ee.group.setAttributeNS(null, "onclick", "startDrag(event)");
      }
      else {
        ws.removeAttributeNS(null, "onmouseup");
      }
    } else {

      if (isOneTouch) {
        arrowRight.setAttributeNS(null, "onclick", "startDrag(event, RIGHT)");
        arrowLeft.setAttributeNS(null, "onclick", "startDrag(event, LEFT)");
        arrowUp.setAttributeNS(null, "onclick", "startDrag(event, UP)");
        arrowDown.setAttributeNS(null, "onclick", "startDrag(event, DOWN)");
      }
      else {
        ws.removeAttributeNS(null, "onmouseup");
      }
      arrowRight.style.fill = "#181acc";
      arrowLeft.style.fill = "#181acc";
      arrowUp.style.fill = "#cc070e";
      arrowDown.style.fill = "#cc070e";
    }

    if (target.isSame(ee))
      success();
    // ee.group.style.fill = "#ACC";
    ee.stopMoving();
  }
}

function stopRotate(event, direction) {
  if (ee.isRotating) {
    var ws = document.getElementById("workspace");
    ws.removeAttributeNS(null, "onmousemove");
    if (isOneTouch) {
      ring.setAttributeNS(null, "onclick", "startRotate(event)");
      ws.removeAttributeNS(null, "onclick");
    }
    else
      ws.removeAttributeNS(null, "onmouseup");
    ee.stopMoving();
    // arrowCW.style.fill = "#a442f4";
    // arrowCCW.style.fill = "#36bc3d";
    ring.style.stroke = "#AAC";
    if (target.isSame(ee))
      success();
  }
}

function moveObjectAndScale(object, x, y, theta, scale) {
  object.setAttribute("transform", "translate(" + x + " " + y + ") rotate(" + theta + " " + 0 + " " + 0 + ") scale(" + scale + ")");
  // This is where you can log the object, and how it is moving
}

