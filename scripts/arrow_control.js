/*
* Arrow type Controller class
*/
function ArrowControl(ee, target, transitionType) {
  Control.call(this, "arrow", ee, target, transitionType);

  Control.fsm = new FSM(["cursor-free", "translating-x", "translating-y", "rotating"],
    [new Transition("cursor-free", "x-arrow-press", "translating-x"),
    new Transition("cursor-free", "y-arrow-press", "translating-y"),
    new Transition("cursor-free", "ring-press", "rotating"),
    new Transition("translating-x", "x-arrow-release", "cursor-free"),
    new Transition("translating-y", "y-arrow-release", "cursor-free"),
    new Transition("rotating", "ring-release", "cursor-free")]);

  Control.initialize = function (eePose) {

    var ws = document.getElementById("workspace");

    // Register events
    if (Control.transitionType == "click") {
      Control.t_xArrows.group.addEventListener("click", Control.handleEvent);
      Control.t_yArrows.group.addEventListener("click", Control.handleEvent);
      Control.t_ring.group.addEventListener("click", Control.handleEvent);

      Control.f_xArrows.group.addEventListener("click", Control.handleEvent);
      Control.f_yArrows.group.addEventListener("click", Control.handleEvent);
      Control.f_ring.group.addEventListener("click", Control.handleEvent);

      Control.s_xArrows.group.addEventListener("click", Control.handleEvent);
      Control.s_yArrows.group.addEventListener("click", Control.handleEvent);
      Control.s_ring.group.addEventListener("click", Control.handleEvent);
      ws.addEventListener("click", Control.handleEvent);
    }
    else {
      Control.t_xArrows.group.addEventListener("mousedown", Control.handleEvent);
      Control.t_xArrows.group.addEventListener("mouseup", Control.handleEvent);
      Control.t_yArrows.group.addEventListener("mousedown", Control.handleEvent);
      Control.t_yArrows.group.addEventListener("mouseup", Control.handleEvent);
      Control.t_ring.group.addEventListener("mousedown", Control.handleEvent);
      Control.t_ring.group.addEventListener("mouseup", Control.handleEvent);

      Control.f_xArrows.group.addEventListener("mousedown", Control.handleEvent);
      Control.f_xArrows.group.addEventListener("mouseup", Control.handleEvent);
      Control.f_yArrows.group.addEventListener("mousedown", Control.handleEvent);
      Control.f_yArrows.group.addEventListener("mouseup", Control.handleEvent);
      Control.f_ring.group.addEventListener("mousedown", Control.handleEvent);
      Control.f_ring.group.addEventListener("mouseup", Control.handleEvent);

      Control.s_xArrows.group.addEventListener("mousedown", Control.handleEvent);
      Control.s_xArrows.group.addEventListener("mouseup", Control.handleEvent);
      Control.s_yArrows.group.addEventListener("mousedown", Control.handleEvent);
      Control.s_yArrows.group.addEventListener("mouseup", Control.handleEvent);
      Control.s_ring.group.addEventListener("mousedown", Control.handleEvent);
      Control.s_ring.group.addEventListener("mouseup", Control.handleEvent);
      ws.addEventListener("mouseup", Control.handleEvent);
    }

    // Add elements to workspace
    ws.appendChild(Control.t_ring.group);
    Control.t_ring.setPose(eePose);
    ws.appendChild(Control.t_xArrows.group);
    ws.appendChild(Control.t_yArrows.group);
    Control.t_xArrows.setPose(eePose);
    Control.t_yArrows.setPose(eePose);

    ws.style.cursor = "default";
    Control.t_ring.group.style.cursor = "pointer";
    Control.t_xArrows.group.style.cursor = "pointer";
    Control.t_yArrows.group.style.cursor = "pointer";

    ws.appendChild(Control.f_ring.group);
    Control.f_ring.setPose(eePose);
    ws.appendChild(Control.f_xArrows.group);
    ws.appendChild(Control.f_yArrows.group);
    Control.f_xArrows.setPose(eePose);
    Control.f_yArrows.setPose(eePose);

    ws.style.cursor = "default";
    Control.f_ring.group.style.cursor = "pointer";
    Control.f_xArrows.group.style.cursor = "pointer";
    Control.f_yArrows.group.style.cursor = "pointer";

    ws.appendChild(Control.s_ring.group);
    Control.s_ring.setPose(eePose);
    ws.appendChild(Control.s_xArrows.group);
    ws.appendChild(Control.s_yArrows.group);
    Control.s_xArrows.setPose(eePose);
    Control.s_yArrows.setPose(eePose);

    ws.style.cursor = "default";
    Control.s_ring.group.style.cursor = "pointer";
    Control.s_xArrows.group.style.cursor = "pointer";
    Control.s_yArrows.group.style.cursor = "pointer";

    Control.updateControlPositions();
  }

  Control.unregisterEvents = function () {
    var ws = document.getElementById("workspace");
    if (Control.transitionType == "click") {
      Control.xArrows.group.removeEventListener("mousedown", Control.handleEvent);
      Control.xArrows.group.removeEventListener("mouseup", Control.handleEvent);
      Control.yArrows.group.removeEventListener("mousedown", Control.handleEvent);
      Control.yArrows.group.removeEventListener("mouseup", Control.handleEvent);
      Control.ring.group.removeEventListener("mousedown", Control.handleEvent);
      Control.ring.group.removeEventListener("mouseup", Control.handleEvent);
      ws.removeEventListener("mouseup", Control.handleEvent);
    }
    else {
      Control.xArrows.group.removeEventListener("click", Control.handleEvent);
      Control.yArrows.group.removeEventListener("click", Control.handleEvent);
      Control.ring.group.removeEventListener("click", Control.handleEvent);
      ws.removeEventListener("click", Control.handleEvent);
    }
  }

  /*
  * Static callback function for different events that this Controller
  * cares about (i.e. results in FSM state changes)
  */
  Control.handleEvent = function (event) {
    Control.firstClickPoint = getMousePosition(event);

    if (event.target.id != "workspace")
      event.stopPropagation();

    let fsmEvent = null;
    if (event.type == "mouseup") {
      if (event.target.id == "workspace") {
        if (Control.fsm.currentState == "translating-x")
          fsmEvent = "x-arrow-release";
        else if (Control.fsm.currentState == "translating-y")
          fsmEvent = "y-arrow-release";
        else if (Control.fsm.currentState == "rotating")
          fsmEvent = "ring-release";
      }
      else if (event.target.id == "ring") {
        fsmEvent = "ring-release";
      }
      else if (event.target.parentNode.id == "xArrows") {
        if (Control.fsm.currentState == "translating-x")
          fsmEvent = "x-arrow-release";
        else
          fsmEvent = "ring-release";
      }
      else if (event.target.parentNode.id == "yArrows") {
        if (Control.fsm.currentState == "translating-y")
          fsmEvent = "y-arrow-release";
        else
          fsmEvent = "ring-release";
      }
    } else if (event.type == "mousedown") {
      if (event.target.id == "ring")
        fsmEvent = "ring-press";
      else if (event.target.parentNode.id == "xArrows")
        fsmEvent = "x-arrow-press";
      else if (event.target.parentNode.id == "yArrows")
        fsmEvent = "y-arrow-press";
    } else if (event.type == "click") {
      if (event.target.id == "button" ||
        event.target.id == "button-text") {
        // Do nothing
      }
      else if (event.target.id == "workspace") {
        if (Control.fsm.currentState == "translating-x")
          fsmEvent = "x-arrow-release";
        else if (Control.fsm.currentState == "translating-y")
          fsmEvent = "y-arrow-release";
        else if (Control.fsm.currentState == "rotating")
          fsmEvent = "ring-release";
      }
      else if (event.target.id == "ring") {
        if (Control.fsm.currentState == "cursor-free")
          fsmEvent = "ring-press";
        else if (Control.fsm.currentState == "rotating")
          fsmEvent = "ring-release";
      }
      else if (event.target.parentNode.id == "xArrows") {
        if (Control.fsm.currentState == "cursor-free")
          fsmEvent = "x-arrow-press";
        else if (Control.fsm.currentState == "translating-x")
          fsmEvent = "x-arrow-release";
        else
          fsmEvent = "ring-release";
      }
      else if (event.target.parentNode.id == "yArrows") {
        if (Control.fsm.currentState == "cursor-free")
          fsmEvent = "y-arrow-press";
        else if (Control.fsm.currentState == "translating-y")
          fsmEvent = "y-arrow-release";
        else
          fsmEvent = "ring-release";
      }
    }

    // One time things to do during FSM transitions
    if (fsmEvent == "x-arrow-release" ||
      fsmEvent == "y-arrow-release" ||
      fsmEvent == "ring-release")
      window.setTimeout(Control.checkSuccess, 200);

    if (fsmEvent == "ring-press")
      Control.ee.startRotating();
    if (fsmEvent == "x-arrow-press" ||
      fsmEvent == "y-arrow-press")
      Control.ee.startTranslating();

    if (fsmEvent != null)
      Control.fsm.emitEvent(fsmEvent);

  }

  /*
  * Static callback function that will be called every time the mouse is moved
  * on the workspace and will translate that mouse movement to meaningful input
  * based on the state of the FSM.
  */
  Control.update = function (event) {
    switch (selectedView) {
      case "top":
        Control.t_ring.resetColor();
        Control.t_xArrows.resetColor();
        Control.t_yArrows.resetColor();

        if (Control.fsm.currentState == "cursor-free") {
          if (event.target.parentNode.id == 'xArrows') {
            //Highlight horizontal arrows
            Control.t_xArrows.highlight();
          }
          else if (event.target.parentNode.id == 'yArrows') {
            //Highlight vertical arrows
            Control.t_yArrows.highlight();
          }
          else if (event.target.id == 'ring') {
            //Highlight ring
            Control.t_ring.highlight();
          }
          return false;
        }
        else if (Control.fsm.currentState == "translating-x") {
          Control.ee.translateXBy(Control.firstClickPoint, getMousePosition(event), 1);
          Control.t_xArrows.highlight();
        }
        else if (Control.fsm.currentState == "translating-y") {
          Control.ee.translateZBy(Control.firstClickPoint, getMousePosition(event), 1);
          Control.t_yArrows.highlight();
        }
        else if (Control.fsm.currentState == "rotating") {
          Control.t_ring.highlight();
          var rot = Control.getScreenSpaceRot(event);
          if (rot)
            Control.ee.rotateYBy(rot);
        }
        else
          console.log("Invalid state.");
        break;
      case "front":
        Control.f_ring.resetColor();
        Control.f_xArrows.resetColor();
        Control.f_yArrows.resetColor();

        if (Control.fsm.currentState == "cursor-free") {
          if (event.target.parentNode.id == 'xArrows') {
            //Highlight horizontal arrows
            Control.f_xArrows.highlight();
          }
          else if (event.target.parentNode.id == 'yArrows') {
            //Highlight vertical arrows
            Control.f_yArrows.highlight();
          }
          else if (event.target.id == 'ring') {
            //Highlight ring
            Control.f_ring.highlight();
          }
          return false;
        }
        else if (Control.fsm.currentState == "translating-x") {
          Control.ee.translateZBy(Control.firstClickPoint, getMousePosition(event), 0);
          Control.f_xArrows.highlight();
        }
        else if (Control.fsm.currentState == "translating-y") {
          Control.ee.translateYBy(Control.firstClickPoint, getMousePosition(event), 0);
          Control.f_yArrows.highlight();
        }
        else if (Control.fsm.currentState == "rotating") {
          Control.f_ring.highlight();
          var rot = Control.getScreenSpaceRot(event);
          if (rot)
            Control.ee.rotateXBy(rot);
        }
        else
          console.log("Invalid state.");
        break;
      case "side":
        Control.s_ring.resetColor();
        Control.s_xArrows.resetColor();
        Control.s_yArrows.resetColor();

        if (Control.fsm.currentState == "cursor-free") {
          if (event.target.parentNode.id == 'xArrows') {
            //Highlight horizontal arrows
            Control.s_xArrows.highlight();
          }
          else if (event.target.parentNode.id == 'yArrows') {
            //Highlight vertical arrows
            Control.s_yArrows.highlight();
          }
          else if (event.target.id == 'ring') {
            //Highlight ring
            Control.s_ring.highlight();
          }
          return false;
        }
        else if (Control.fsm.currentState == "translating-x") {
          Control.ee.translateXBy(Control.firstClickPoint, getMousePosition(event), 3);
          Control.s_xArrows.highlight();
        }
        else if (Control.fsm.currentState == "translating-y") {
          Control.ee.translateYBy(Control.firstClickPoint, getMousePosition(event), 3);
          Control.s_yArrows.highlight();
        }
        else if (Control.fsm.currentState == "rotating") {
          Control.s_ring.highlight();
          var rot = Control.getScreenSpaceRot(event);
          if (rot)
            Control.ee.rotateZBy(rot);
        }
        else
          console.log("Invalid state.");
        break;
    }

    Control.updateControlPositions();

    //Control.checkEEatTarget();

    return true;
  }
}
