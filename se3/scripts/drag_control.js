/*
* Drag type Controller class
*/
function DragControl(ee, target, transitionType) {
  Control.call(this, "drag", ee, target, transitionType);
  
  Control.fsm = new FSM(["cursor-free", "translating", "rotating"], 
    [new Transition("cursor-free", "ee-press", "translating"),
    new Transition("cursor-free", "ring-press", "rotating"),
    new Transition("translating", "ee-release", "cursor-free"),
    new Transition("rotating", "ring-release", "cursor-free")]);

  Control.initialize = function(eePose) {

    var ws = document.getElementById("workspace");

    // Register event listeners
    if (Control.transitionType == "click") {
      Control.t_handle.group.addEventListener("click", Control.handleEvent);
      Control.t_ring.group.addEventListener("click", Control.handleEvent);

      Control.f_handle.group.addEventListener("click", Control.handleEvent);
      Control.f_ring.group.addEventListener("click", Control.handleEvent);

      Control.s_handle.group.addEventListener("click", Control.handleEvent);
      Control.s_ring.group.addEventListener("click", Control.handleEvent);
      ws.addEventListener("click", Control.handleEvent);
    } else {
      Control.t_handle.group.addEventListener("mousedown", Control.handleEvent);
      Control.t_handle.group.addEventListener("mouseup", Control.handleEvent);
      Control.t_ring.group.addEventListener("mousedown", Control.handleEvent);
      Control.t_ring.group.addEventListener("mouseup", Control.handleEvent);

      Control.f_handle.group.addEventListener("mousedown", Control.handleEvent);
      Control.f_handle.group.addEventListener("mouseup", Control.handleEvent);
      Control.f_ring.group.addEventListener("mousedown", Control.handleEvent);
      Control.f_ring.group.addEventListener("mouseup", Control.handleEvent);
      
      Control.s_handle.group.addEventListener("mousedown", Control.handleEvent);
      Control.s_handle.group.addEventListener("mouseup", Control.handleEvent);
      Control.s_ring.group.addEventListener("mousedown", Control.handleEvent);
      Control.s_ring.group.addEventListener("mouseup", Control.handleEvent);
      ws.addEventListener("mouseup", Control.handleEvent);
    }

    // Add elements to workspace
    ws.appendChild(Control.t_ring.group);
    Control.t_ring.setPose(eePose);    
    ws.appendChild(Control.t_handle.group);
    Control.t_handle.setPose(eePose);    

    Control.t_ring.group.style.cursor = "pointer";
    Control.t_handle.group.style.cursor = "pointer";
    
    ws.appendChild(Control.f_ring.group);
    Control.f_ring.setPose(eePose);    
    ws.appendChild(Control.f_handle.group);
    Control.f_handle.setPose(eePose);    

    Control.f_ring.group.style.cursor = "pointer";
    Control.f_handle.group.style.cursor = "pointer";
    
    ws.appendChild(Control.s_ring.group);
    Control.s_ring.setPose(eePose);    
    ws.appendChild(Control.s_handle.group);
    Control.s_handle.setPose(eePose);    

    Control.s_ring.group.style.cursor = "pointer";
    Control.s_handle.group.style.cursor = "pointer";

    ws.style.cursor = "default";
    Control.updateControlPositions();
  }

  Control.unregisterEvents = function() {
    var ws = document.getElementById("workspace");
    if (Control.transitionType == "click") {
      Control.t_handle.group.removeEventListener("click", Control.handleEvent);
      Control.t_ring.group.removeEventListener("click", Control.handleEvent);

      Control.f_handle.group.removeEventListener("click", Control.handleEvent);
      Control.f_ring.group.removeEventListener("click", Control.handleEvent);

      Control.s_handle.group.removeEventListener("click", Control.handleEvent);
      Control.s_ring.group.removeEventListener("click", Control.handleEvent);
      ws.removeEventListener("click", Control.handleEvent);      
    }
    else {
      Control.t_handle.group.removeEventListener("mousedown", Control.handleEvent);
      Control.t_handle.group.removeEventListener("mouseup", Control.handleEvent);
      Control.t_ring.group.removeEventListener("mousedown", Control.handleEvent);
      Control.t_ring.group.removeEventListener("mouseup", Control.handleEvent);

      Control.f_handle.group.removeEventListener("mousedown", Control.handleEvent);
      Control.f_handle.group.removeEventListener("mouseup", Control.handleEvent);
      Control.f_ring.group.removeEventListener("mousedown", Control.handleEvent);
      Control.f_ring.group.removeEventListener("mouseup", Control.handleEvent);
      
      Control.s_handle.group.removeEventListener("mousedown", Control.handleEvent);
      Control.s_handle.group.removeEventListener("mouseup", Control.handleEvent);
      Control.s_ring.group.removeEventListener("mousedown", Control.handleEvent);
      Control.s_ring.group.removeEventListener("mouseup", Control.handleEvent);
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

    Control.firstClickPoint = getMousePosition(event);
    let fsmEvent = null;

    if (event.type == "mouseup") {
      if (event.target.id == "workspace" || event.target.id == "ring") {
        fsmEvent = "ring-release";
      }
      else if (event.target.id == "handle") {
        if (Control.fsm.currentState == "translating")
          fsmEvent = "ee-release";
        else
          fsmEvent = "ring-release";
      }
    } else if (event.type == "mousedown") {
      if (event.target.id == "ring")
        fsmEvent = "ring-press";
      else if (event.target.id == "handle")
        fsmEvent = "ee-press";
    } else if (event.type == "click") {
      if (event.target.id == "workspace") {
        if (Control.fsm.currentState == "rotating")
          fsmEvent = "ring-release";
        else if (Control.fsm.currentState == "translating")
          fsmEvent = "ee-release";
      }
      else if (event.target.id == "ring") {
        if (Control.fsm.currentState == "cursor-free")
          fsmEvent = "ring-press";
        else if (Control.fsm.currentState == "rotating")
          fsmEvent = "ring-release";
      }
      else if (event.target.id == "handle") {
        if (Control.fsm.currentState == "cursor-free")
          fsmEvent = "ee-press";
        else if (Control.fsm.currentState == "translating")
          fsmEvent = "ee-release";
        else if (Control.fsm.currentState == "rotating")
          fsmEvent = "ring-release";
      }
    }

    // One time FSM transition actions
    if (fsmEvent == "ring-release" || fsmEvent == "ee-release")
        window.setTimeout(Control.checkSuccess, 200);

    if (fsmEvent == "ring-press")
      Control.ee.startRotating();

    if (fsmEvent == "ee-press")
      Control.ee.startTranslating();

    if (fsmEvent != null)
      Control.fsm.emitEvent(fsmEvent);

  }
  
  /*
  * Static callback function that will be called every time the mouse is moved
  * on the workspace and will translate that mouse movement to meaningful input
  * based on the state of the FSM.
  */
  Control.update = function(event) {
    var mousePos = getMousePosition(event);
    
    switch (selectedView) {
      case "top":
        Control.t_ring.resetColor();
        Control.t_handle.resetColor();
    
        if (Control.fsm.currentState == "cursor-free") {
          if (event.target.id == 'handle'){
            //Highlight handle
            Control.t_handle.highlight();
          }
          else if (event.target.id == 'ring'){
            //Highlight ring
            Control.t_ring.highlight();
          }
          return false;
        }
        else if (Control.fsm.currentState == "translating") {
          Control.ee.translateXBy(Control.firstClickPoint, mousePos, 1);
          Control.ee.translateZBy(Control.firstClickPoint, mousePos, 1);
          Control.t_handle.highlight();
        }
        else if (Control.fsm.currentState == "rotating") {
          Control.t_ring.highlight();
          var rot = Control.getScreenSpaceRot(event, 1);
          if (rot)
            Control.ee.rotateYBy(rot);
        }
        else
          console.log("Invalid state.");
        break;
      case "front":
        Control.f_ring.resetColor();
        Control.f_handle.resetColor();
    
        if (Control.fsm.currentState == "cursor-free") {
          if (event.target.id == 'handle'){
            //Highlight handle
            Control.f_handle.highlight();
          }
          else if (event.target.id == 'ring'){
            //Highlight ring
            Control.f_ring.highlight();
          }
          return false;
        }
        else if (Control.fsm.currentState == "translating") {
          Control.ee.translateZBy(Control.firstClickPoint, mousePos, 0);
          Control.ee.translateYBy(Control.firstClickPoint, mousePos, 0);
          Control.f_handle.highlight();
        }
        else if (Control.fsm.currentState == "rotating") {
          Control.f_ring.highlight();
          var rot = Control.getScreenSpaceRot(event, 0);
          if (rot)
            Control.ee.rotateXBy(rot);
        }
        else
          console.log("Invalid state.");
        break;
      case "side":
        Control.s_ring.resetColor();
        Control.s_handle.resetColor();
    
        if (Control.fsm.currentState == "cursor-free") {
          if (event.target.id == 'handle'){
            //Highlight handle
            Control.s_handle.highlight();
          }
          else if (event.target.id == 'ring'){
            //Highlight ring
            Control.s_ring.highlight();
          }
          return false;
        }
        else if (Control.fsm.currentState == "translating") {
          Control.ee.translateXBy(Control.firstClickPoint, mousePos, 3);
          Control.ee.translateYBy(Control.firstClickPoint, mousePos, 3);
          Control.s_handle.highlight();
        }
        else if (Control.fsm.currentState == "rotating") {
          Control.s_ring.highlight();
          var rot = Control.getScreenSpaceRot(event, 3);
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
