/*
* Panel type Controller class
*/
function PanelControl(ee, target, transitionType) {
  Control.call(this, "target", ee, target, transitionType);

  Control.xArrows = new HorizontalArrows(Panel.width/8);
  Control.yArrows = new VerticalArrows(Panel.height/8);
  Control.thetaArrows = new RotateArrows();
  
  Control.fsm = new FSM(["cursor-free", "moving-left", "moving-right",
    "moving-up", "moving-down", "rotating-cw", "rotating-ccw"],
    [new Transition("cursor-free", "cursor-click", "cursor-free"),
    new Transition("cursor-free", "press-left", "moving-left"),
    new Transition("moving-left", "release-left", "cursor-free"),
    new Transition("cursor-free", "press-right", "moving-right"),
    new Transition("moving-right", "release-right", "cursor-free"),
    new Transition("cursor-free", "press-up", "moving-up"),
    new Transition("moving-up", "release-up", "cursor-free"),
    new Transition("cursor-free", "press-down", "moving-down"),
    new Transition("moving-down", "release-down", "cursor-free"),
    new Transition("cursor-free", "press-cw", "rotating-cw"),
    new Transition("rotating-cw", "release-cw", "cursor-free"),
    new Transition("cursor-free", "press-ccw", "rotating-ccw"),
    new Transition("rotating-ccw", "release-ccw", "cursor-free")]);
  
  Control.initialize = function(eePose) {
    var ws = document.getElementById("workspace");

    // Register events
    if (Control.transitionType == "click") {
      ws.addEventListener("click", Control.handleEvent);
    }
    else {
      ws.addEventListener("mouseup", Control.handleEvent);
      ws.addEventListener("mousedown", Control.handleEvent);
    }

    // Add necessary elements to the workspace
    ws.appendChild(Control.panel.group);
    ws.appendChild(Control.xArrows.group);
    ws.appendChild(Control.yArrows.group);
    ws.appendChild(Control.thetaArrows.group);
    let arrowPose = Panel.getCenterPose();
    Control.thetaArrows.setPose(arrowPose);
    arrowPose.y = arrowPose.y + 10;
    Control.xArrows.setPose(arrowPose);
    Control.yArrows.setPose(arrowPose);

    // Set the different cursor types for each element
    ws.style.cursor = "default";
    Control.xArrows.arrowLeft.style.cursor = "pointer";
    Control.xArrows.arrowRight.style.cursor = "pointer";
    Control.yArrows.arrowUp.style.cursor = "pointer";
    Control.yArrows.arrowDown.style.cursor = "pointer";
    Control.thetaArrows.arrowCW.style.cursor = "pointer";
    Control.thetaArrows.arrowCCW.style.cursor = "pointer";
  }
  
  Control.unregisterEvents = function() {
    var ws = document.getElementById("workspace");
    if (Control.transitionType == "click") {
      ws.removeEventListener("click", Control.handleEvent);
    }
    else {
      ws.removeEventListener("mouseup", Control.handleEvent);
      ws.removeEventListener("mousedown", Control.handleEvent);
    }
  }

  /*
  * Static callback function for different events that this Controller
  * cares about (i.e. results in FSM state changes)
  */
  Control.minSpeed = 1;
  Control.minRotSpeed = 1;
  Control.maxSpeed = ((Control.transitionType == "press/release") ? 20 : 10);
  Control.maxRotSpeed = ((Control.transitionType == "press/release") ? 10 : 5);
  Control.currentSpeed = Control.minSpeed;
  Control.currentRotSpeed = Control.minRotSpeed;

  Control.handleEvent = function(event) {

    if (event.target.id != "workspace")
      event.stopPropagation();

    if (event.type == "click") {
      Control.currentSpeed = Control.minSpeed;
      Control.currentRotSpeed = Control.minRotSpeed;
      
      if (event.target.id == "arrowLeft") {
        if (Control.fsm.currentState == "moving-left") {
          // If we are already moving left, release-left to stop
          Control.fsm.emitEvent("release-left");
        } else {
          // If we are not moving left, first make sure that we are not moving any other direction
          Control.fsm.emitEvent("release-right");
          Control.fsm.emitEvent("release-up");
          Control.fsm.emitEvent("release-down");
          Control.fsm.emitEvent("release-cw");
          
          // Then start moving left
          Control.fsm.emitEvent("press-left");
        }
      }
      else if (event.target.id == "arrowRight") {
        if (Control.fsm.currentState == "moving-right") {
          Control.fsm.emitEvent("release-right");
        } else {
          Control.fsm.emitEvent("release-left");
          Control.fsm.emitEvent("release-up");
          Control.fsm.emitEvent("release-down");
          Control.fsm.emitEvent("release-cw");
          Control.fsm.emitEvent("release-ccw");
          
          Control.fsm.emitEvent("press-right");
        }
      }
      else if (event.target.id == "arrowUp") {
        if (Control.fsm.currentState == "moving-up") {
          Control.fsm.emitEvent("release-up");
        } else {
          Control.fsm.emitEvent("release-right");
          Control.fsm.emitEvent("release-left");
          Control.fsm.emitEvent("release-down");
          Control.fsm.emitEvent("release-cw");
          Control.fsm.emitEvent("release-ccw");
          
          Control.fsm.emitEvent("press-up");
        }
      }
      else if (event.target.id == "arrowDown") {
        if (Control.fsm.currentState == "moving-down") {
          Control.fsm.emitEvent("release-down");
        } else {
          Control.fsm.emitEvent("release-right");
          Control.fsm.emitEvent("release-up");
          Control.fsm.emitEvent("release-left");
          Control.fsm.emitEvent("release-cw");
          Control.fsm.emitEvent("release-ccw");
          
          Control.fsm.emitEvent("press-down");
        }
      }
      else if (event.target.id == "arrowCW") {
        if (Control.fsm.currentState == "rotating-cw") {
          Control.fsm.emitEvent("release-cw");
        } else {
          Control.fsm.emitEvent("release-right");
          Control.fsm.emitEvent("release-up");
          Control.fsm.emitEvent("release-down");
          Control.fsm.emitEvent("release-left");
          Control.fsm.emitEvent("release-ccw");
          
          Control.fsm.emitEvent("press-cw");
        }
      }
      else if (event.target.id == "arrowCCW") {
        if (Control.fsm.currentState == "rotating-ccw") {
          Control.fsm.emitEvent("release-ccw");
        } else {
          Control.fsm.emitEvent("release-right");
          Control.fsm.emitEvent("release-up");
          Control.fsm.emitEvent("release-down");
          Control.fsm.emitEvent("release-cw");
          Control.fsm.emitEvent("release-left");
          
          Control.fsm.emitEvent("press-ccw");
        }
      }
      window.setTimeout(Control.checkSuccess, 200);
    }
    else if (event.type == "mousedown") {
      Control.currentSpeed = Control.minSpeed;
      Control.currentRotSpeed = Control.minRotSpeed;
      let fsmEvent = null;
      if (event.target.id == "arrowLeft")
        fsmEvent = "press-left";
      else if (event.target.id == "arrowRight")
        fsmEvent = "press-right";
      else if (event.target.id == "arrowUp")
        fsmEvent = "press-up";
      else if (event.target.id == "arrowDown")
        fsmEvent = "press-down";
      else if (event.target.id == "arrowCW")
        fsmEvent = "press-cw";
      else if (event.target.id == "arrowCCW")
        fsmEvent = "press-ccw";

      if (fsmEvent != null)
        Control.fsm.emitEvent(fsmEvent);
    }
    else if (event.type == "mouseup") {
      let fsmEvent = null;
      if (event.target.id == "arrowLeft")
        fsmEvent = "release-left";
      else if (event.target.id == "arrowRight")
        fsmEvent = "release-right";
      else if (event.target.id == "arrowUp")
        fsmEvent = "release-up";
      else if (event.target.id == "arrowDown")
        fsmEvent = "release-down";
      else if (event.target.id == "arrowCW")
        fsmEvent = "release-cw";
      else if (event.target.id == "arrowCCW")
        fsmEvent = "release-ccw";

      if (fsmEvent != null)
        Control.fsm.emitEvent(fsmEvent);
      window.setTimeout(Control.checkSuccess, 200);
    }
  }

  /*
  * Static callback function that will be called every time the mouse is moved
  * on the workspace and will translate that mouse movement to meaningful input
  * based on the state of the FSM.
  */
  Control.update = function(event) {
    Control.xArrows.resetColor();
    Control.yArrows.resetColor();
    Control.thetaArrows.resetColor();

    if (Control.fsm.currentState == "cursor-free") {

      if (event.target.id == 'arrowLeft')
        Control.xArrows.highlight(Control.xArrows.arrowLeft);
      else if (event.target.id == 'arrowRight')
        Control.xArrows.highlight(Control.xArrows.arrowRight);
      else if (event.target.id == 'arrowUp')
        Control.yArrows.highlight(Control.yArrows.arrowUp);
      else if (event.target.id == 'arrowDown')
        Control.yArrows.highlight(Control.yArrows.arrowDown);
      else if (event.target.id == 'arrowCW')
        Control.thetaArrows.highlight(Control.thetaArrows.arrowCW);
      else if (event.target.id == 'arrowCCW')
        Control.thetaArrows.highlight(Control.thetaArrows.arrowCCW);

    }
  }

  Control.clockUpdate = function(event) {
    var acceleration = ((Control.transitionType == "press/release") ? 1 : 0.5);

    if (Control.fsm.currentState == "moving-left") {
      Control.ee.startTranslating();
      Control.ee.translateBy(new Position(Control.currentSpeed, 0));
      Control.ee.moveNow();
      if (Control.currentSpeed < Control.maxSpeed)
        Control.currentSpeed += acceleration;
        
    }
    else if (Control.fsm.currentState == "moving-right") {
      Control.ee.startTranslating();
      Control.ee.translateBy(new Position(-Control.currentSpeed, 0));
      Control.ee.moveNow();
      if (Control.currentSpeed < Control.maxSpeed)
        Control.currentSpeed += acceleration;
    }
    else if (Control.fsm.currentState == "moving-up") {
      Control.ee.startTranslating();
      Control.ee.translateBy(new Position(0, Control.currentSpeed));
      Control.ee.moveNow();
      if (Control.currentSpeed < Control.maxSpeed)
        Control.currentSpeed += acceleration;
    }
    else if (Control.fsm.currentState == "moving-down") {
      Control.ee.startTranslating();
      Control.ee.translateBy(new Position(0, -Control.currentSpeed));
      Control.ee.moveNow();
      if (Control.currentSpeed < Control.maxSpeed)
        Control.currentSpeed += acceleration;
    }
    else if (Control.fsm.currentState == "rotating-cw") {
      Control.ee.startRotating();
      Control.ee.rotateBy(Control.currentRotSpeed);
      Control.ee.moveNow();
      if (Control.currentRotSpeed < Control.maxRotSpeed)
        Control.currentRotSpeed += acceleration;
    }
    else if (Control.fsm.currentState == "rotating-ccw") {
      Control.ee.startRotating();
      Control.ee.rotateBy(-Control.currentRotSpeed);
      Control.ee.moveNow();
      if (Control.currentRotSpeed < Control.maxRotSpeed)
        Control.currentRotSpeed += acceleration;
    }
    Control.checkEEatTarget();
  }
}

