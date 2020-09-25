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
    
    Control.t_ring.group.addEventListener("click", Control.handleEvent);
    ws.appendChild(Control.t_ring.group);
    Control.t_ring.setPose(eePose);
    Control.t_ring.group.style.cursor = "crosshair";

    Control.f_ring.group.addEventListener("click", Control.handleEvent);
    ws.appendChild(Control.f_ring.group);
    Control.f_ring.setPose(eePose);
    Control.f_ring.group.style.cursor = "crosshair";

    Control.s_ring.group.addEventListener("click", Control.handleEvent);
    ws.appendChild(Control.s_ring.group);
    Control.s_ring.setPose(eePose);
    Control.s_ring.group.style.cursor = "crosshair";

    ws.style.cursor = "crosshair";
    Control.updateControlPositions();
  }
  
  Control.unregisterEvents = function() {
    var ws = document.getElementById("workspace");
    ws.removeEventListener("click", Control.handleEvent);

    Control.t_ring.group.removeEventListener("click", Control.handleEvent);
    Control.f_ring.group.removeEventListener("click", Control.handleEvent);
    Control.s_ring.group.removeEventListener("click", Control.handleEvent);
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
        var centerPoint;
        switch (selectedView) {
          case "top":
            centerPoint = world_to_screen_space(Control.ee.threejs_object, views[1]);
            break;
          case "front":
            centerPoint = world_to_screen_space(Control.ee.threejs_object, views[0]);
            break;
          case "side":
            centerPoint = world_to_screen_space(Control.ee.threejs_object, views[3]);
            break;
        }

        // Set rotation
        var deltaX = Control.firstClickPoint.x - centerPoint.x;
        var deltaY = Control.firstClickPoint.y - centerPoint.y;
        var angle = Math.atan2(deltaY, deltaX) * 180 / Math.PI;
        //angle -= 90;
        if (angle > 180)
            angle -= 360;
        if (angle < -180)
            angle += 360;

        if (!isNaN(angle)) {
          switch (selectedView) {
            case "top":
              Control.ee.threejs_object.rotation.y = -angle*DEG_TO_RAD;
              break;
            case "front":
              Control.ee.threejs_object.rotation.x = -(angle+90)*DEG_TO_RAD;
              break;
            case "side":
              Control.ee.threejs_object.rotation.z = -angle*DEG_TO_RAD;
              break;
          }
        }
      }
      else {
        switch (selectedView) {
          case "top":
            var newPos = screen_to_world_space(Control.firstClickPoint, views[1]);
            Control.ee.threejs_object.position.x = newPos.x;
            Control.ee.threejs_object.position.z = newPos.z;
            break;
          case "front":
            var newPos = screen_to_world_space(Control.firstClickPoint, views[0]);
            Control.ee.threejs_object.position.y = newPos.y;
            Control.ee.threejs_object.position.z = newPos.z;
            break;
          case "side":
            var newPos = screen_to_world_space(Control.firstClickPoint, views[3]);
            Control.ee.threejs_object.position.x = newPos.x;
            Control.ee.threejs_object.position.y = newPos.y;
            break;
        }

      }
      
      //Control.checkEEatTarget();

      // Refresh the position of the ik_target
      Control.ee.threejs_object.updateMatrixWorld();
      Control.updateControlPositions();
      
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
    Control.t_ring.resetColor();
    Control.f_ring.resetColor();
    Control.s_ring.resetColor();
    if (Control.fsm.currentState == "cursor-free") {
      if (event.target.id == 'ring'){
        switch (selectedView) {
          case "top":
            Control.t_ring.highlight();
            break;
          case "front":
            Control.f_ring.highlight();
            break;
          case "side":
            Control.s_ring.highlight();
            break;
        }
      }
      return false;
    }
    else
      console.log("Invalid state.");
    return true;
  }
}

