
var controlTypes = ["arrow", "drag", "target", "targetdrag", "panel"];
var transitionTypes = ["press/release", "click"];
var currentControl = controlTypes[0];
var currentTransitionType = transitionTypes[1];

/* 
* SE2 object representing the target 
* where the end effector should be moved 
*/
var target = null;

/* 
* moveableSE2 object representing the end effector
*/
var ee = null;

/*
* Object of type Control representing the interactive interface
* to control the dend effector. This will have more specific class
* that inherits from Control (e.g. DragControl)
*/
var control = null;
var offline = false;

function loadInterface() {
  let controlParam = getURLParameter("c");
  let transitionParam = getURLParameter("t");
  if (controlParam != undefined)
    currentControl = controlTypes[controlParam];
  if (transitionParam != undefined)
    currentTransitionType = transitionTypes[transitionParam];
  
  if (offline) {
    initializeTest();
  }
  else {
    Database.readyCallback = initializeTest;
    db.initialize();    
  }
}

/*
* Function to set up one particular test
*/
function initializeTest() {
  
  // Create target and place it in workspace
  target = new SE2("target", new Pose(), "#AAA");
  target.addToWorkspace();

  // Create end effector and place it in workspace
  ee = new moveableSE2("ee", new Pose(), "#111");
  ee.addToWorkspace();

  // Create control and initialize to add it to the workspace
  
  if (currentControl == "arrow")
    control = new ArrowControl(ee, target, currentTransitionType);
  else if (currentControl == "drag")
    control = new DragControl(ee, target, currentTransitionType);
  else if (currentControl == "target")
    control = new TargetControl(ee, target);
  else if (currentControl == "targetdrag")
    control = new TargetDragControl(ee, target, currentTransitionType);
  else if (currentControl == "panel")
    control = new PanelControl(ee, target, currentTransitionType);

  // Place the EE and the target in the workspace
  setRandomTargetPose();
  setEEPoseAtCenter();

  // Initialize control
  Control.initialize(ee.pose);

  // Register callback on mouse movements
  var ws = document.getElementById("workspace");
  ws.addEventListener("mousemove", Control.update);

  // Some controls need a clock update
  if (currentControl == "panel" && currentTransitionType != "click") {
    window.setInterval(Control.clockUpdate, 100);
  }

  Database.logCycleStart(currentControl, currentTransitionType, target.pose);

}

function setRandomTargetPose() {
  var ws = document.getElementById("workspace");
  var rect = ws.getBoundingClientRect();
  var ringBuffer = Ring.innerR + Ring.ringRadius;
  var edgeBuffer = ringBuffer + (Arrow.arrowLengthTot);
  var randomW = rect.width/2 - Ring.ringRadius - edgeBuffer - SE2.lineLength;
  var randomH = rect.height/2 - Ring.ringRadius - edgeBuffer - SE2.lineLength;

  console.log("ringBuffer:" + ringBuffer);
  console.log("randomW:" + randomW);
  console.log("randomH:" + randomH);

  let poseFound = false;
  while(!poseFound) {
    var randomX = rect.width/2 + Math.sign(Math.random()-0.5)* (ringBuffer + Math.random()*randomW);
    var randomY = rect.height/2 + Math.sign(Math.random()-0.5)* (ringBuffer + Math.random()*randomH);
    var randomTheta = Math.random()*360 - 180;

    // If there it a panel, don't let the target fall behind it
    if (currentControl == "panel" && 
      randomX<Panel.width+SE2.lineLength 
      && randomY<Panel.height+SE2.lineLength)
      console.log("pose rejected");
    else
      poseFound = true;
  }

  // Set the pose of the created target
  target.setPose(new Pose(randomX, randomY, randomTheta));
}

function setEEPoseAtCenter() {
  var ws = document.getElementById("workspace");
  var rect = ws.getBoundingClientRect();
  var centerX = Math.round(rect.width / 2);
  var centerY = Math.round(rect.height / 2);
  ee.setPose(new Pose(centerX, centerY, 0));
}

function clearWorkspace() {
    var ws = document.getElementById("workspace");
    while(ws.hasChildNodes()){
        ws.removeChild(ws.firstChild);
    }

    Control.unregisterEvents();
    ws.removeEventListener("mousemove", Control.update);
}

/*
* Function to transition to new test when one is complete
* i.e. the EE has reached the target
*/
function success() {
  Database.logCycleFinish();
  console.log("SUCCESS!");
  ee.resetColor();
  clearWorkspace();
  initializeTest();
}
