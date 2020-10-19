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
      Control.handle.group.addEventListener("click", Control.handleEvent);
      Control.ring.group.addEventListener("click", Control.handleEvent);
      ws.addEventListener("click", Control.handleEvent);
    } else {
      Control.handle.group.addEventListener("mousedown", Control.handleEvent);
      Control.handle.group.addEventListener("mouseup", Control.handleEvent);
      Control.ring.group.addEventListener("mousedown", Control.handleEvent);
      Control.ring.group.addEventListener("mouseup", Control.handleEvent);
      ws.addEventListener("mouseup", Control.handleEvent);
    }

    // Add elements to workspace
    ws.appendChild(Control.ring.group);
    Control.ring.setPose(eePose);    
    ws.appendChild(Control.handle.group);
    Control.handle.setPose(eePose);    

    ws.style.cursor = "default";
    Control.ring.group.style.cursor = "pointer";
    Control.handle.group.style.cursor = "pointer";
  }

  Control.unregisterEvents = function() {
    var ws = document.getElementById("workspace");
    if (Control.transitionType == "click") {
      Control.handle.group.removeEventListener("click", Control.handleEvent);
      Control.ring.group.removeEventListener("click", Control.handleEvent);
      ws.removeEventListener("click", Control.handleEvent);      
    }
    else {
      Control.handle.group.removeEventListener("mousedown", Control.handleEvent);
      Control.handle.group.removeEventListener("mouseup", Control.handleEvent);
      Control.ring.group.removeEventListener("mousedown", Control.handleEvent);
      Control.ring.group.removeEventListener("mouseup", Control.handleEvent);
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
    //var mousePos = getMousePosition(event);
    
    Control.ring.resetColor();
    Control.handle.resetColor();

    if (Control.fsm.currentState == "cursor-free") {
      if (event.target.id == 'handle'){
        //Highlight handle
        Control.handle.highlight();
      }
      else if (event.target.id == 'ring'){
        //Highlight ring
        Control.ring.highlight();
      }
      return false;
    }
    else if (Control.fsm.currentState == "translating") {
      var newClickPoint = getMousePosition(event);
      var a = newClickPoint.diff(Control.firstClickPoint);
      Control.ee.translateBy(a);
      Control.ee.moveNow();
      Control.ring.setPose(Control.ee.pose);
      Control.handle.setPose(Control.ee.pose);
      Control.checkEEatTarget();
      Control.handle.highlight();
    }
    else if (Control.fsm.currentState == "rotating") {
      Control.rotateFromRing(event);
      Control.ring.highlight();
    }
    else
      console.log("Invalid state.");
    return true;
  }  
}
