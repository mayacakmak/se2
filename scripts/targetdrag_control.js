/*
* Target drag type Controller class
*/
function TargetDragControl(ee, target, transitionType) {
  Control.call(this, "target", ee, target, transitionType);

  Control.fsm = new FSM(["cursor-free", "cursor-anchored"],
    [new Transition("cursor-free", "cursor-press", "cursor-anchored"),
    new Transition("cursor-anchored", "cursor-release", "cursor-free")]);

  Control.initialize = function (eePose) {
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

  Control.unregisterEvents = function () {
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
  Control.handleEvent = function (event) {

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

    if (fsmEvent == "cursor-release") {
      Control.ee.threejs_object_ghost.visible = false;

      Control.ee.threejs_object.position.x = Control.ee.threejs_object_ghost.position.x;
      Control.ee.threejs_object.position.y = Control.ee.threejs_object_ghost.position.y;
      Control.ee.threejs_object.position.z = Control.ee.threejs_object_ghost.position.z;

      Control.ee.threejs_object.rotation.x = Control.ee.threejs_object_ghost.rotation.x;
      Control.ee.threejs_object.rotation.y = Control.ee.threejs_object_ghost.rotation.y;
      Control.ee.threejs_object.rotation.z = Control.ee.threejs_object_ghost.rotation.z;

      //Control.checkAtTarget(Control.ghost);
      //Control.checkEEatTarget();
      window.setTimeout(Control.checkSuccess, 200);
    }

    if (fsmEvent == "cursor-press") {
      Control.firstClickPoint = getMousePosition(event);
      switch (selectedView) {
        case "top":
          var newPos = screen_to_world_space(Control.firstClickPoint, views[1]);
          console.log(Control.firstClickPoint, newPos, Control.ee.threejs_object_ghost.position)
          Control.ee.threejs_object_ghost.position.x = newPos.x;
          Control.ee.threejs_object_ghost.position.z = newPos.z;
          Control.ee.threejs_object_ghost.visible = true;
          break;
        case "front":
          var newPos = screen_to_world_space(Control.firstClickPoint, views[0]);
          Control.ee.threejs_object_ghost.position.z = newPos.z;
          Control.ee.threejs_object_ghost.position.y = newPos.y;
          Control.ee.threejs_object_ghost.visible = true;
          break;
        case "side":
          var newPos = screen_to_world_space(Control.firstClickPoint, views[3]);
          Control.ee.threejs_object_ghost.position.x = newPos.x;
          Control.ee.threejs_object_ghost.position.y = newPos.y;
          Control.ee.threejs_object_ghost.visible = true;
          break;
      }
      //Control.checkAtTarget(Control.ghost);
    }

    if (fsmEvent != null)
      Control.fsm.emitEvent(fsmEvent);

  }

  /*
  * Static callback function that will be called every time the mouse is moved
  * on the workspace and will translate that mouse movement to meaningful input
  * based on the state of the FSM.
  */
  Control.update = function (event) {
    //var mousePos = getMousePosition(event);

    if (Control.fsm.currentState == "cursor-free") {
      return false;
    }
    else if (Control.fsm.currentState == "cursor-anchored") {
      var newClickPoint = getMousePosition(event);

      var centerPoint;
      switch (selectedView) {
        case "top":
          centerPoint = world_to_screen_space(Control.ee.threejs_object_ghost, views[1]);
          break;
        case "front":
          centerPoint = world_to_screen_space(Control.ee.threejs_object_ghost, views[0]);
          break;
        case "side":
          centerPoint = world_to_screen_space(Control.ee.threejs_object_ghost, views[3]);
          break;
      }

      var deltaX = newClickPoint.x - centerPoint.x;
      var deltaY = newClickPoint.y - centerPoint.y;
      var angle = Math.atan2(deltaY, deltaX) * 180 / Math.PI;
      //angle -= 90;
      if (angle > 180)
        angle -= 360;
      if (angle < -180)
        angle += 360;

      if (!isNaN(angle)) {
        switch (selectedView) {
          case "top":
            rot = -angle * DEG_TO_RAD;
            if (worldRotation)
              rotateAroundWorldAxis(Control.ee.threejs_object_ghost, Y_AXIS, rot - Control.ee.threejs_object_ghost.rotation.y);
            else
              Control.ee.threejs_object_ghost.rotation.y = -angle*DEG_TO_RAD;
            break;
          case "front":
            rot = -(angle + 90) * DEG_TO_RAD;
            if (worldRotation)
              rotateAroundWorldAxis(Control.ee.threejs_object_ghost, X_AXIS, rot - Control.ee.threejs_object_ghost.rotation.x);
            else
              Control.ee.threejs_object_ghost.rotation.x = -(angle+90)*DEG_TO_RAD;
            break;
          case "side":
            rot = -angle * DEG_TO_RAD;
            if (worldRotation)
              rotateAroundWorldAxis(Control.ee.threejs_object_ghost, Z_AXIS, rot - Control.ee.threejs_object_ghost.rotation.z);
            else
              Control.ee.threejs_object_ghost.rotation.z = -angle*DEG_TO_RAD;
            break;
        }
        Control.updateControlPositions();
        // Control.checkAtTarget(Control.ghost);

        // Control.checkEEatTarget();
      }
    }
    else
      console.log("Invalid state.");
    return true;
  }
}

