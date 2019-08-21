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

  Control.initialize = function(eePose) {
    
    var ws = document.getElementById("workspace");

    // Register events
    if (Control.transitionType == "click") {
      Control.xArrows.group.addEventListener("click", Control.handleEvent);
      Control.yArrows.group.addEventListener("click", Control.handleEvent);
      Control.ring.group.addEventListener("click", Control.handleEvent);
      ws.addEventListener("click", Control.handleEvent);
    }
    else {
      Control.xArrows.group.addEventListener("mousedown", Control.handleEvent);
      Control.xArrows.group.addEventListener("mouseup", Control.handleEvent);
      Control.yArrows.group.addEventListener("mousedown", Control.handleEvent);
      Control.yArrows.group.addEventListener("mouseup", Control.handleEvent);
      Control.ring.group.addEventListener("mousedown", Control.handleEvent);
      Control.ring.group.addEventListener("mouseup", Control.handleEvent);
      ws.addEventListener("mouseup", Control.handleEvent);
    }

    // Add elements to workspace
    ws.appendChild(Control.ring.group);
    Control.ring.setPose(eePose);    
    ws.appendChild(Control.xArrows.group);
    ws.appendChild(Control.yArrows.group);
    Control.xArrows.setPose(eePose);        
    Control.yArrows.setPose(eePose);        

    ws.style.cursor = "default";
    Control.ring.group.style.cursor = "pointer";
    Control.xArrows.group.style.cursor = "pointer";
    Control.yArrows.group.style.cursor = "pointer";
  }

  Control.unregisterEvents = function() {
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
  Control.handleEvent = function(event) {
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
      if (event.target.id == "workspace") {
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
  Control.update = function(event) {
    
    Control.ring.resetColor();
    Control.xArrows.resetColor();
    Control.yArrows.resetColor();

    if (Control.fsm.currentState == "cursor-free") {
      if (event.target.parentNode.id == 'xArrows'){
        //Highlight horizontal arrows
        Control.xArrows.highlight();
      }
      else if (event.target.parentNode.id == 'yArrows'){
        //Highlight vertical arrows
        Control.yArrows.highlight();
      }
      else if (event.target.id == 'ring'){
        //Highlight ring
        Control.ring.highlight();
      }
      return false;
    }
    else if (Control.fsm.currentState == "translating-x") {
      var newClickPoint = getMousePosition(event);
      var a = newClickPoint.diff(Control.firstClickPoint);
      Control.ee.translateXBy(a);
      Control.ee.moveNow();
      Control.ring.setPose(Control.ee.pose);
      Control.xArrows.setPosition(Control.ee.getPosition());
      Control.yArrows.setPosition(Control.ee.getPosition());
      Control.checkEEatTarget();
      Control.xArrows.highlight();
    }
    else if (Control.fsm.currentState == "translating-y") {
      var newClickPoint = getMousePosition(event);
      var a = newClickPoint.diff(Control.firstClickPoint);
      Control.ee.translateYBy(a);
      Control.ee.moveNow();
      Control.ring.setPose(Control.ee.pose);
      Control.xArrows.setPosition(Control.ee.getPosition());
      Control.yArrows.setPosition(Control.ee.getPosition());
      Control.checkEEatTarget();
      Control.yArrows.highlight();
    }
    else if (Control.fsm.currentState == "rotating") {
      Control.ring.highlight();
      Control.rotateFromRing(event);
    }
    else
      console.log("Invalid state.");
    return true;
  }  
}
