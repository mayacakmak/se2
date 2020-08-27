// Count the number of intervals set for debugging
window.originalSetInterval = window.setInterval;
window.originalClearInterval = window.clearInterval;
window.activeIntervals = 0;
window.setInterval = function (func, delay)
{
    if(func && delay){
            window.activeIntervals++;
    }
    return window.originalSetInterval(func,delay);
};
window.clearInterval = function (intervalId)
{
    // JQuery sometimes hands in true which doesn't count
    if(intervalId !== true){
        window.activeIntervals--;
    }
    return window.originalClearInterval(intervalId);
};


var controlTypes = ["arrow", "drag", "target", "targetdrag", "panel"];
var transitionTypes = ["press/release", "click"];
var currentControl = 0;
var currentTransitionType = 1;

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

// Enable/Disable logging
var offline = true;
var hasTimer = false;
var isTest = false;
var testConfigs = null;
var currentTest = 0;

<<<<<<< HEAD
/*
* EE control update clock (interval)
*/
var updateClock = null;

/*
* End effector pose logging clock (interval)
*/
var logClock = null;
=======
var clockUpdateInterval;
>>>>>>> cbf24d2461f107cfdc344156336162ce5883765f

function loadInterface(isTestInterface) {
  let controlParam = getURLParameter("c");
  let transitionParam = getURLParameter("t");
  if (controlParam != undefined)
    currentControl = controlParam;
  if (transitionParam != undefined)
    currentTransitionType = transitionParam;

  isTest = isTestInterface;
  
  // For debugging, fast forward to the ending--
  //currentTest = 34;

  if (isTest) {
    testConfigs = sampleConfigs(1);
  }

  if (offline) {
    initializeTest();
  }
  else {
    Database.readyCallback = initializeTest;
    db.initialize();
  }
}

function startTest() {
  moveToTestPage(currentControl, currentTransitionType);
}

function initializeTest() {
	if (isTest) {
	  // There is a timer during tests, but not during practice
    var timer = new Timer();
    Timer.timerDoneCallback = setupEnvironment;
    timer.reset((currentTest+1) + "/" + testConfigs.length);
	}
	else {
		setupEnvironment();
	}
}

function startTimer() {

}

/*
* Function to set up one particular test
*/
function setupEnvironment() {

  let threshXY = null;
  let threshTheta = null;

  if (isTest){
    let currentConfig = testConfigs[currentTest];
    threshXY = currentConfig.thresh_xy;
    threshTheta = currentConfig.thresh_theta;
  }
  else {
    // During practice, randomly pick thresh_xy and thresh_theta

    // For video making purposes 
    let isExact = false;

    threshXY = 5;
    threshTheta = 5;
    
    if (!isExact) {
      if (Math.random()<0.75)
        threshXY += Math.random()*25;
      if (Math.random()<0.75)
        threshTheta += Math.random()*85;      
    }
  }

  // Create target and place it in workspace
  target = new SE2("target", new Pose(), "#AAA", threshXY, threshTheta);
  target.addToWorkspace();

  // Create end effector and place it in workspace
  ee = new moveableSE2("ee", new Pose(), "#111");
  ee.addToWorkspace();

  // Create control and initialize to add it to the workspace

  if (controlTypes[currentControl] == "arrow")
    control = new ArrowControl(ee, target, 
      transitionTypes[currentTransitionType]);
  else if (controlTypes[currentControl] == "drag")
    control = new DragControl(ee, target, 
      transitionTypes[currentTransitionType]);
  else if (controlTypes[currentControl] == "target")
    control = new TargetControl(ee, target);
  else if (controlTypes[currentControl] == "targetdrag")
    control = new TargetDragControl(ee, target, 
      transitionTypes[currentTransitionType]);
  else if (controlTypes[currentControl] == "panel")
    control = new PanelControl(ee, target, 
      transitionTypes[currentTransitionType]);

  // Place the EE and the target in the workspace
  setTargetPose();
  setEEPoseAtCenter();

  // Initialize control
  Control.initialize(ee.pose);

  // Register callback on mouse movements
  var ws = document.getElementById("workspace");
  ws.addEventListener("mousemove", Control.update);

  // Some controls need a clock update
<<<<<<< HEAD
  if (updateClock == null) {
    if (controlTypes[currentControl] == "panel" && 
      transitionTypes[currentTransitionType] != "click") {
      updateClock = window.setInterval(Control.clockUpdate, 100);
    }
=======
  if (controlTypes[currentControl] == "panel") {
    clockUpdateInterval = window.setInterval(Control.clockUpdate, 100);
>>>>>>> cbf24d2461f107cfdc344156336162ce5883765f
  }

  if (!offline) {
    var targetInfo = target.pose;
    targetInfo.threshXY =  threshXY;
    targetInfo.threshTheta = threshTheta;

    Database.logCycleStart(controlTypes[currentControl], 
      transitionTypes[currentTransitionType], targetInfo);
    if (logClock == null)
      logClock = window.setInterval(Database.logEEPose, 500);
  }
}

function setTargetPose() {
  if (isTest){
    let currentConfig = testConfigs[currentTest];
    target.setPose(new Pose(currentConfig.x, currentConfig.y, currentConfig.theta));
    // DEBUGGING
    // target.setPose(new Pose(currentConfig.x, currentConfig.y, 180));
  }
  else {
    // During practice, set pose randomly
    var ws = document.getElementById("workspace");
    var rect = ws.getBoundingClientRect();
    var ringBuffer = Ring.innerR + Ring.ringRadius;
    var edgeBuffer = ringBuffer + (Arrow.arrowLengthTot);
    var randomW = rect.width / 2 - Ring.ringRadius - edgeBuffer - SE2.lineLength;
    var randomH = rect.height / 2 - Ring.ringRadius - edgeBuffer - SE2.lineLength;

    console.log("ringBuffer:" + ringBuffer);
    console.log("randomW:" + randomW);
    console.log("randomH:" + randomH);

    let poseFound = false;
    while (!poseFound) {
      var randomX = rect.width / 2 + Math.sign(Math.random() - 0.5) * (ringBuffer + Math.random() * randomW);
      var randomY = rect.height / 2 + Math.sign(Math.random() - 0.5) * (ringBuffer + Math.random() * randomH);
      var randomTheta = Math.random() * 360 - 180;

      // If there it a panel, don't let the target fall behind it
      if (controlTypes[currentControl] == "panel" &&
        randomX < Panel.width + SE2.lineLength
        && randomY < Panel.height + SE2.lineLength)
        console.log("pose rejected");
      else
        poseFound = true;
    }

    // Set the pose of the created target
    target.setPose(new Pose(randomX, randomY, randomTheta));
  }
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
  while (ws.hasChildNodes()) {
    ws.removeChild(ws.firstChild);
  }

  Control.unregisterEvents();
  ws.removeEventListener("mousemove", Control.update);

  clearInterval(eeLogger);
  if (controlTypes[currentControl] == "panel") {
    clearInterval(clockUpdateInterval);
  }
}

/*
* Function to transition to new test when one is complete
* i.e. the EE has reached the target
*/
function success() {
  if (!offline) {
    Database.logCycleFinish();
  }
  
  ee.resetColor();
  clearWorkspace();

  currentTest++;

  if (isTest) {
    if (currentTest >= testConfigs.length) {
      let btn = document.getElementById("next-button");
      btn.innerHTML = "Done";
      btn.disabled = false;
    }
  }
  else {
    if (currentTest == 5)
    {
      let btn = document.getElementById("next-button");
      btn.disabled = false;
    }
  }

  if (!isTest || currentTest < testConfigs.length) {
    initializeTest();      
  }    
}
