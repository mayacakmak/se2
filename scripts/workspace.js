// Count the number of intervals set for debugging
window.originalSetInterval = window.setInterval;
window.originalClearInterval = window.clearInterval;
window.activeIntervals = 0;
window.setInterval = function (func, delay) {
  if (func && delay) {
    window.activeIntervals++;
  }
  return window.originalSetInterval(func, delay);
};
window.clearInterval = function (intervalId) {
  // JQuery sometimes hands in true which doesn't count
  if (intervalId !== true) {
    window.activeIntervals--;
  }
  return window.originalClearInterval(intervalId);
};

function updateSelectedView(view) {
  switch (view) {
    case "top":
      $("#top-td").removeClass("background-block");
      $("#side-td").addClass("background-block");
      $("#front-td").addClass("background-block");
      $("#perspective-td").addClass("background-block");
      break;
    case "front":
      $("#front-td").removeClass("background-block");
      $("#side-td").addClass("background-block");
      $("#top-td").addClass("background-block");
      $("#perspective-td").addClass("background-block");
      break;
    case "side":
      $("#side-td").removeClass("background-block");
      $("#front-td").addClass("background-block");
      $("#top-td").addClass("background-block");
      $("#perspective-td").addClass("background-block");
      break;
  }
}

var selectedView = "top";
updateSelectedView(selectedView);

$('#top-td').click(function () {
  if (Control.fsm.currentState == "cursor-free") {
    selectedView = "top";
    updateSelectedView(selectedView);
  }
});


$('#front-td').click(function () {
  if (Control.fsm.currentState == "cursor-free") {
    selectedView = "front";
    updateSelectedView(selectedView);
  }
});


$('#side-td').click(function () {
  if (Control.fsm.currentState == "cursor-free") {
    selectedView = "side";
    updateSelectedView(selectedView);
  }
});

var worldRotation = true;
$('input[type=radio][name=rAxis]').change(function () {
  if (this.id == "world")
    worldRotation = true;
  else if (this.id == "local")
    worldRotation = false;
});

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

/*
* EE control update clock (interval)
*/
var updateClock = null;

/*
* End effector pose logging clock (interval)
*/
var logClock = null;

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
    timer.reset((currentTest + 1) + "/" + testConfigs.length);
  }
  else {
    setupEnvironment();
  }
  setInterval(resetIK, 1500);
}

function startTimer() {

}

/*
* Function to set up one particular test
*/
function setupEnvironment() {

  let threshXY = null;
  let threshTheta = null;

  if (isTest) {
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
      if (Math.random() < 0.75)
        threshXY += Math.random() * 25;
      if (Math.random() < 0.75)
        threshTheta += Math.random() * 85;
    }
  }

  // Create target and place it in workspace
  target = setTargetPose();

  // Create end effector and place it in workspace
  ee = new moveableSE3("ee", new Pose(), "#111", ik_target, ik_target_ghost);


  // Place the EE and the target in the workspace
  setEEPoseAtCenter();

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

  // Initialize control
  Control.initialize(ee.pose);

  // Register callback on mouse movements
  var ws = document.getElementById("workspace");
  ws.addEventListener("mousemove", Control.update);

  // Some controls need a clock update
  if (updateClock == null) {
    if (controlTypes[currentControl] == "panel") {
      updateClock = window.setInterval(Control.clockUpdate, 100);
    }
  }

  if (!offline) {
    var targetInfo = target.pose;
    targetInfo.threshXY = threshXY;
    targetInfo.threshTheta = threshTheta;

    Database.logCycleStart(controlTypes[currentControl],
      transitionTypes[currentTransitionType], targetInfo);
    if (logClock == null)
      logClock = window.setInterval(Database.logEEPose, 500);
  }
}

function setTargetPose() {
  var pos = new THREE.Vector3(6, 7, -1);
  var rot = new THREE.Euler(0, 0, 0);
  var dim = new THREE.Vector3(0.3, 0.15, 1);
  if (isTest) {
    let currentConfig = testConfigs[currentTest];
    //target.setPose(new Pose(currentConfig.x, currentConfig.y, currentConfig.theta));
    // DEBUGGING
    // target.setPose(new Pose(currentConfig.x, currentConfig.y, 180));
  }
  else {
    let poseFound = false;
    while (!poseFound) {
      pos.x = getRandomArbitrary(4.5, 7); // Max bounds: [3, 8.5]
      pos.y = getRandomArbitrary(1, 9.5); // Max bounds: [0.5, 10]
      pos.z = getRandomArbitrary(-7, 1.5); // Max bounds: [-6.5, 2]

      dim.y = getRandomArbitrary(0.05, 0.18);
      dim.x = getRandomArbitrary(0.2, 0.7);
      dim.z = getRandomArbitrary(1, 2);

      /*
      rot.x = getRandomArbitrary(0, 360);
      rot.y = getRandomArbitrary(0, 360);
      rot.z = getRandomArbitrary(0, 360);
      */

      // If there it a panel, don't let the target fall behind it
      if (controlTypes[currentControl] == "panel" &&
        randomX < Panel.width + SE3.lineLength
        && randomY < Panel.height + SE3.lineLength)
        console.log("pose rejected");
      else
        poseFound = true;
    }

    // Set the pose of the created target
    //target.setPose(new Pose(randomX, randomY, randomTheta));
  }
  return tempTarget = new SE3Target("rgb(50, 50, 50)", pos, rot, dim);
}

function setEEPoseAtCenter() {
  ee.threejs_object.position.set(6, 7, -1);
  ee.threejs_object.rotation.set(0, 0, 0);

  resetIK()
}

function resetIK() {
  if (kinematics) {
    setJointAngles(initial_angle_state)
    dae.updateMatrixWorld(true);
  }
  starting_position = [...initial_angle_state];
  lastAngles = [...initial_angle_state];
  startingAngles = [...initial_angle_state];

  if (kinematics && enableIK) {
    solveIK(ik_target, iterations);
    solveIK(ik_target, iterations);
    solveIK(ik_target, iterations);
  }
}

function clearWorkspace() {
  var ws = document.getElementById("workspace");
  while (ws.hasChildNodes()) {
    ws.removeChild(ws.firstChild);
  }

  scene.remove(target.threejs_object);
  target.threejs_object.dispose();

  Control.unregisterEvents();
  ws.removeEventListener("mousemove", Control.update);

  // This is already handled by not recreating intervals if their handle is not null
  //clearInterval(logClock);
  //if (controlTypes[currentControl] == "panel") {
  //  clearInterval(updateClock);
  //}
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
    if (currentTest == 5) {
      let btn = document.getElementById("next-button");
      btn.disabled = false;
    }
  }

  if (!isTest || currentTest < testConfigs.length) {
    initializeTest();
  }
}
