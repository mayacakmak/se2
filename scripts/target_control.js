/*
* Target type Controller class
*/
function TargetControl(ee, target) {
  Control.call(this, "target", ee, target);
  
  Control.fsm = new FSM(["cursor-free"], 
    [new Transition("cursor-free", "cursor-click", "cursor-free")]);
  
  Control.initialize = function(eePose) {
    // Register event listeners
    var ws = document.getElementById("workspace");
    ws.addEventListener("click", Control.handleEvent);
    Control.ring.group.addEventListener("click", Control.handleEvent);

    ws.appendChild(Control.ring.group);
    Control.ring.setPose(eePose);

    ws.style.cursor = "crosshair";
    Control.ring.group.style.cursor = "crosshair";
  }
  
  Control.unregisterEvents = function() {
    var ws = document.getElementById("workspace");
    ws.removeEventListener("click", Control.handleEvent);
    Control.ring.group.removeEventListener("click", Control.handleEvent);
  }

  /*
  * Static callback function for different events that this Controller
  * cares about (i.e. results in FSM state changes)
  */
  Control.handleEvent = function(event) {

    if (event.target.id != "workspace")
      event.stopPropagation();

    if (event.type == "click") {
      Control.firstClickPoint = getMousePosition(event);
      if (event.target.id == "ring") {
        // Set rotation
        var centerPoint = Control.ee.pose.getPosition();
        var deltaX = Control.firstClickPoint.x - centerPoint.x;
        var deltaY = Control.firstClickPoint.y - centerPoint.y;
        var angle = Math.atan2(deltaY, deltaX) * 180 / Math.PI;
        //angle -= 90;
        if (angle > 180)
            angle -= 360;
        if (angle < -180)
            angle += 360;

        if (!isNaN(angle)) {
          Control.ee.setRotation(angle);
        }
      }
      else {
        // Set position
        Control.ee.setPosition(Control.firstClickPoint);
        Control.ring.setPose(Control.ee.pose);
      }
      Control.checkEEatTarget();
      Control.fsm.emitEvent("cursor-click");
      window.setTimeout(Control.checkSuccess, 200);
    }
  }

  /*
  * Static callback function that will be called every time the mouse is moved
  * on the workspace and will translate that mouse movement to meaningful input
  * based on the state of the FSM.
  */
  Control.update = function(event) {
    Control.ring.resetColor();
    if (Control.fsm.currentState == "cursor-free") {
      if (event.target.id == 'ring'){
        //Highlight ring
        Control.ring.highlight();
      }
      return false;
    }
    else
      console.log("Invalid state.");
    return true;
  }
}

