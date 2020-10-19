/*
* Target drag type Controller class
*/
function TargetDragControl(ee, target, transitionType) {
  Control.call(this, "target", ee, target, transitionType);
  
  Control.fsm = new FSM(["cursor-free", "cursor-anchored"], 
    [new Transition("cursor-free", "cursor-press", "cursor-anchored"),
    new Transition("cursor-anchored", "cursor-release", "cursor-free")]);
  
  Control.initialize = function(eePose) {
    // Register events
    var ws = document.getElementById("workspace");
    if (Control.transitionType == "click")
      ws.addEventListener("click", Control.handleEvent);
    else {
      ws.addEventListener("mousedown", Control.handleEvent);
      ws.addEventListener("mouseup", Control.handleEvent);
    }
    ws.style.cursor = "crosshair";
  }
  
  Control.unregisterEvents = function() {
    var ws = document.getElementById("workspace");
    if (Control.transitionType == "click")
      ws.removeEventListener("click", Control.handleEvent);
    else {
      ws.removeEventListener("mousedown", Control.handleEvent);
      ws.removeEventListener("mouseup", Control.handleEvent);
    }
  }

  /*
  * Static callback function for different events that this Controller
  * cares about (i.e. results in FSM state changes)
  */
  Control.handleEvent = function(event) {

    if (event.target.id != "workspace")
      event.stopPropagation();

    let fsmEvent = null;

    if (event.type == "mouseup") {
      fsmEvent = "cursor-release";
    } else if (event.type == "mousedown") {
      fsmEvent = "cursor-press";
    } else if (event.type == "click") {
      if (Control.fsm.currentState == "cursor-free")
        fsmEvent = "cursor-press";
      else
        fsmEvent = "cursor-release";
    }

    if(fsmEvent == "cursor-release") {
      Control.ghost.setVisible(false);
      Control.ee.setPose(Control.ghost.pose);
      Control.ee.moveNow();
      Control.checkAtTarget(Control.ghost);
      Control.checkEEatTarget();
      window.setTimeout(Control.checkSuccess, 200);
    }

    if (fsmEvent == "cursor-press") {
      Control.firstClickPoint = getMousePosition(event);
      Control.ghost.setPose(Control.ee.pose);
      Control.ghost.setPosition(Control.firstClickPoint);
      Control.ghost.setVisible(true);
      Control.checkAtTarget(Control.ghost);
    }

    if(fsmEvent != null)
      Control.fsm.emitEvent(fsmEvent);

  }

  /*
  * Static callback function that will be called every time the mouse is moved
  * on the workspace and will translate that mouse movement to meaningful input
  * based on the state of the FSM.
  */
  Control.update = function(event) {
    //var mousePos = getMousePosition(event);
    
    if (Control.fsm.currentState == "cursor-free") {
      return false;
    }
    else if (Control.fsm.currentState == "cursor-anchored") {
      var newClickPoint = getMousePosition(event);
      var centerPoint = Control.ghost.pose.getPosition();

      var deltaX = newClickPoint.x - centerPoint.x;
      var deltaY = newClickPoint.y - centerPoint.y;
      var angle = Math.atan2(deltaY, deltaX) * 180 / Math.PI;
      //angle -= 90;
      if (angle > 180)
          angle -= 360;
      if (angle < -180)
          angle += 360;

      if (!isNaN(angle)) {
        Control.ghost.setRotation(angle);
        Control.checkAtTarget(Control.ghost);
        // Control.checkEEatTarget();
      }
    }
    else
      console.log("Invalid state.");
    return true;
  } 
}

