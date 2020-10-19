/*
* Panel type Controller class
*/
function PanelControl(ee, target, transitionType) {
  Control.call(this, "target", ee, target, transitionType);

  Control.t_xArrows = new HorizontalArrows(Panel.width/8);
  Control.t_yArrows = new VerticalArrows(Panel.height/8);
  Control.t_thetaArrows = new RotateArrows();
  
  Control.f_xArrows = new HorizontalArrows(Panel.width/8);
  Control.f_yArrows = new VerticalArrows(Panel.height/8);
  Control.f_thetaArrows = new RotateArrows();
  
  Control.s_xArrows = new HorizontalArrows(Panel.width/8);
  Control.s_yArrows = new VerticalArrows(Panel.height/8);
  Control.s_thetaArrows = new RotateArrows();
  
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
    ws.appendChild(Control.t_panel.group);
    ws.appendChild(Control.t_yArrows.group);
    ws.appendChild(Control.t_xArrows.group);
    ws.appendChild(Control.t_thetaArrows.group);
    let t_arrowPose = Panel.getCenterPose();
    Control.t_thetaArrows.setPose(t_arrowPose);
    t_arrowPose.y = t_arrowPose.y + 10;
    Control.t_xArrows.setPose(t_arrowPose);
    Control.t_yArrows.setPose(t_arrowPose);
    
    Control.t_xArrows.arrowLeft.style.cursor = "pointer";
    Control.t_xArrows.arrowRight.style.cursor = "pointer";
    Control.t_yArrows.arrowUp.style.cursor = "pointer";
    Control.t_yArrows.arrowDown.style.cursor = "pointer";
    Control.t_thetaArrows.arrowCW.style.cursor = "pointer";
    Control.t_thetaArrows.arrowCCW.style.cursor = "pointer";
    
    ws.appendChild(Control.f_panel.group);
    ws.appendChild(Control.f_yArrows.group);
    ws.appendChild(Control.f_xArrows.group);
    ws.appendChild(Control.f_thetaArrows.group);
    Control.f_panel.setPose(new Pose(0, windowHeight/2, 0));

    let f_arrowPose = Panel.getCenterPose();
    f_arrowPose.y += windowHeight/2;
    Control.f_thetaArrows.setPose(f_arrowPose);
    f_arrowPose.y = f_arrowPose.y + 10;
    Control.f_xArrows.setPose(f_arrowPose);
    Control.f_yArrows.setPose(f_arrowPose);
    
    Control.f_xArrows.arrowLeft.style.cursor = "pointer";
    Control.f_xArrows.arrowRight.style.cursor = "pointer";
    Control.f_yArrows.arrowUp.style.cursor = "pointer";
    Control.f_yArrows.arrowDown.style.cursor = "pointer";
    Control.f_thetaArrows.arrowCW.style.cursor = "pointer";
    Control.f_thetaArrows.arrowCCW.style.cursor = "pointer";
    
    ws.appendChild(Control.s_panel.group);
    ws.appendChild(Control.s_xArrows.group);
    ws.appendChild(Control.s_yArrows.group);
    ws.appendChild(Control.s_thetaArrows.group);
    Control.s_panel.setPose(new Pose(windowWidth/2, 0, 0));

    let s_arrowPose = Panel.getCenterPose();
    s_arrowPose.x += windowWidth / 2;
    Control.s_thetaArrows.setPose(s_arrowPose);
    s_arrowPose.y = s_arrowPose.y + 10;
    Control.s_xArrows.setPose(s_arrowPose);
    Control.s_yArrows.setPose(s_arrowPose);
    
    Control.s_xArrows.arrowLeft.style.cursor = "pointer";
    Control.s_xArrows.arrowRight.style.cursor = "pointer";
    Control.s_yArrows.arrowUp.style.cursor = "pointer";
    Control.s_yArrows.arrowDown.style.cursor = "pointer";
    Control.s_thetaArrows.arrowCW.style.cursor = "pointer";
    Control.s_thetaArrows.arrowCCW.style.cursor = "pointer";

    // Set the different cursor types for each element
    ws.style.cursor = "default";
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
      Control.ee.startTranslating();
      Control.ee.startRotating();
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

      Control.currentSpeed = Control.minSpeed;
      Control.currentRotSpeed = Control.minRotSpeed;

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
    switch (selectedView) {
      case "top":
        Control.t_xArrows.resetColor();
        Control.t_yArrows.resetColor();
        Control.t_thetaArrows.resetColor();
    
        if (Control.fsm.currentState == "cursor-free") {
    
          if (event.target.id == 'arrowLeft')
            Control.t_xArrows.highlight(Control.t_xArrows.arrowLeft);
          else if (event.target.id == 'arrowRight')
            Control.t_xArrows.highlight(Control.t_xArrows.arrowRight);
          else if (event.target.id == 'arrowUp')
            Control.t_yArrows.highlight(Control.t_yArrows.arrowUp);
          else if (event.target.id == 'arrowDown')
            Control.t_yArrows.highlight(Control.t_yArrows.arrowDown);
          else if (event.target.id == 'arrowCW')
            Control.t_thetaArrows.highlight(Control.t_thetaArrows.arrowCW);
          else if (event.target.id == 'arrowCCW')
            Control.t_thetaArrows.highlight(Control.t_thetaArrows.arrowCCW);
    
        }
        break;
      case "front":
        Control.f_xArrows.resetColor();
        Control.f_yArrows.resetColor();
        Control.f_thetaArrows.resetColor();
    
        if (Control.fsm.currentState == "cursor-free") {
    
          if (event.target.id == 'arrowLeft')
            Control.f_xArrows.highlight(Control.f_xArrows.arrowLeft);
          else if (event.target.id == 'arrowRight')
            Control.f_xArrows.highlight(Control.f_xArrows.arrowRight);
          else if (event.target.id == 'arrowUp')
            Control.f_yArrows.highlight(Control.f_yArrows.arrowUp);
          else if (event.target.id == 'arrowDown')
            Control.f_yArrows.highlight(Control.f_yArrows.arrowDown);
          else if (event.target.id == 'arrowCW')
            Control.f_thetaArrows.highlight(Control.f_thetaArrows.arrowCW);
          else if (event.target.id == 'arrowCCW')
            Control.f_thetaArrows.highlight(Control.f_thetaArrows.arrowCCW);
    
        }
        break;
      case "side":
        Control.s_xArrows.resetColor();
        Control.s_yArrows.resetColor();
        Control.s_thetaArrows.resetColor();
    
        if (Control.fsm.currentState == "cursor-free") {
    
          if (event.target.id == 'arrowLeft')
            Control.s_xArrows.highlight(Control.s_xArrows.arrowLeft);
          else if (event.target.id == 'arrowRight')
            Control.s_xArrows.highlight(Control.s_xArrows.arrowRight);
          else if (event.target.id == 'arrowUp')
            Control.s_yArrows.highlight(Control.s_yArrows.arrowUp);
          else if (event.target.id == 'arrowDown')
            Control.s_yArrows.highlight(Control.s_yArrows.arrowDown);
          else if (event.target.id == 'arrowCW')
            Control.s_thetaArrows.highlight(Control.s_thetaArrows.arrowCW);
          else if (event.target.id == 'arrowCCW')
            Control.s_thetaArrows.highlight(Control.s_thetaArrows.arrowCCW);
    
        }
        break;
    }
  }

  Control.clockUpdate = function(event) {
    var acceleration = ((Control.transitionType == "press/release") ? 1 : 0.5);

    switch (selectedView) {
      case "top":
        if (Control.fsm.currentState == "moving-left") {
          Control.ee.startTranslating();
          Control.ee.translateXBy(new Position(0, 0), new Position(Control.currentSpeed, 0), 1);
          if (Control.currentSpeed < Control.maxSpeed)
            Control.currentSpeed += acceleration;
        }
        else if (Control.fsm.currentState == "moving-right") {
          Control.ee.startTranslating();
          Control.ee.translateXBy(new Position(0, 0), new Position(-Control.currentSpeed, 0), 1);
          if (Control.currentSpeed < Control.maxSpeed)
            Control.currentSpeed += acceleration;
        }
        else if (Control.fsm.currentState == "moving-up") {
          Control.ee.startTranslating();
          Control.ee.translateZBy(new Position(0, 0), new Position(0, Control.currentSpeed), 1);
          if (Control.currentSpeed < Control.maxSpeed)
            Control.currentSpeed += acceleration;
        }
        else if (Control.fsm.currentState == "moving-down") {
          Control.ee.startTranslating();
          Control.ee.translateZBy(new Position(0, 0), new Position(0, -Control.currentSpeed), 1);
          if (Control.currentSpeed < Control.maxSpeed)
            Control.currentSpeed += acceleration;
        }
        else if (Control.fsm.currentState == "rotating-cw") {
          Control.ee.startRotating();
          Control.ee.rotateYBy(Control.currentRotSpeed);
          if (Control.currentRotSpeed < Control.maxRotSpeed)
            Control.currentRotSpeed += acceleration;
        }
        else if (Control.fsm.currentState == "rotating-ccw") {
          Control.ee.startRotating();
          Control.ee.rotateYBy(-Control.currentRotSpeed);
          if (Control.currentRotSpeed < Control.maxRotSpeed)
            Control.currentRotSpeed += acceleration;
        }
        break;
      case "front":
        if (Control.fsm.currentState == "moving-left") {
          Control.ee.startTranslating();
          Control.ee.translateZBy(new Position(0, 0), new Position(Control.currentSpeed, 0), 0);
          if (Control.currentSpeed < Control.maxSpeed)
            Control.currentSpeed += acceleration;
        }
        else if (Control.fsm.currentState == "moving-right") {
          Control.ee.startTranslating();
          Control.ee.translateZBy(new Position(0, 0), new Position(-Control.currentSpeed, 0), 0);
          if (Control.currentSpeed < Control.maxSpeed)
            Control.currentSpeed += acceleration;
        }
        else if (Control.fsm.currentState == "moving-up") {
          Control.ee.startTranslating();
          Control.ee.translateYBy(new Position(0, 0), new Position(0, Control.currentSpeed), 0);
          if (Control.currentSpeed < Control.maxSpeed)
            Control.currentSpeed += acceleration;
        }
        else if (Control.fsm.currentState == "moving-down") {
          Control.ee.startTranslating();
          Control.ee.translateYBy(new Position(0, 0), new Position(0, -Control.currentSpeed), 0);
          if (Control.currentSpeed < Control.maxSpeed)
            Control.currentSpeed += acceleration;
        }
        else if (Control.fsm.currentState == "rotating-cw") {
          Control.ee.startRotating();
          Control.ee.rotateXBy(Control.currentRotSpeed);
          if (Control.currentRotSpeed < Control.maxRotSpeed)
            Control.currentRotSpeed += acceleration;
        }
        else if (Control.fsm.currentState == "rotating-ccw") {
          Control.ee.startRotating();
          Control.ee.rotateXBy(-Control.currentRotSpeed);
          if (Control.currentRotSpeed < Control.maxRotSpeed)
            Control.currentRotSpeed += acceleration;
        }
        break;
      case "side":
        if (Control.fsm.currentState == "moving-left") {
          Control.ee.startTranslating();
          Control.ee.translateXBy(new Position(0, 0), new Position(Control.currentSpeed, 0), 3);
          if (Control.currentSpeed < Control.maxSpeed)
            Control.currentSpeed += acceleration;
        }
        else if (Control.fsm.currentState == "moving-right") {
          Control.ee.startTranslating();
          Control.ee.translateXBy(new Position(0, 0), new Position(-Control.currentSpeed, 0), 3);
          if (Control.currentSpeed < Control.maxSpeed)
            Control.currentSpeed += acceleration;
        }
        else if (Control.fsm.currentState == "moving-up") {
          Control.ee.startTranslating();
          Control.ee.translateYBy(new Position(0, 0), new Position(0, Control.currentSpeed), 3);
          if (Control.currentSpeed < Control.maxSpeed)
            Control.currentSpeed += acceleration;
        }
        else if (Control.fsm.currentState == "moving-down") {
          Control.ee.startTranslating();
          Control.ee.translateYBy(new Position(0, 0), new Position(0, -Control.currentSpeed), 3);
          if (Control.currentSpeed < Control.maxSpeed)
            Control.currentSpeed += acceleration;
        }
        else if (Control.fsm.currentState == "rotating-cw") {
          Control.ee.startRotating();
          Control.ee.rotateZBy(Control.currentRotSpeed);
          if (Control.currentRotSpeed < Control.maxRotSpeed)
            Control.currentRotSpeed += acceleration;
        }
        else if (Control.fsm.currentState == "rotating-ccw") {
          Control.ee.startRotating();
          Control.ee.rotateZBy(-Control.currentRotSpeed);
          if (Control.currentRotSpeed < Control.maxRotSpeed)
            Control.currentRotSpeed += acceleration;
        }
        break;
    }

    //Control.checkEEatTarget();
  }
}

