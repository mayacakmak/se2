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

// Selet a specific camera view in the 3d interface
function updateSelectedView(view) {
  Database.logSelectedView(view);
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

// Switch between world and local rotation axes
var worldRotation = true;

// Switch between world and local rotation axes
var elbowUp = true;

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
var offline = false;
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

// Load the interface and setup data logging. This function is called one when the page is loaded
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

// Initialize the first interface
function initializeTest() {
  if (isTest) {
    // There is a timer during tests, but not during practice
    var timer = new Timer();
    Timer.timerDoneCallback = setupEnvironment;
    timer.reset((currentTest + 1) + "/" + testConfigs.length);

    // Hide the interface to show the I'm ready button and coundown timer
    $("#group-td").hide();
    $("#ThreeJS").css("opacity", 0);
  }
  else {
    setupEnvironment();
  }
  // The IK can sometimes get messed up so it is automatically reset every 1.5 seconds (from the user POV, this should be barely noticeable)
  //setInterval(resetIK, 1500);
}

function startTimer() {

}

/*
* Function to set up one particular test
*/
function setupEnvironment() {
  if (isTest) {
    // Show the full interface now that the cycle has started
    $("#group-td").show();
    $("#ThreeJS").css("opacity", 1);
  }

  // Not used in the 3d interface
  // let threshXY = null;
  // let threshTheta = null;

  if (isTest) {
    let currentConfig = testConfigs[currentTest];
    threshXY = currentConfig.thresh_xy;
    threshTheta = currentConfig.thresh_theta;
  }
  else {

    // Not used in the 3d interface
    //   // For video making purposes 
    //   let isExact = false;

    //   threshXY = 5;
    //   threshTheta = 5;

    //   if (!isExact) {
    //     if (Math.random() < 0.75)
    //       threshXY += Math.random() * 25;
    //     if (Math.random() < 0.75)
    //       threshTheta += Math.random() * 85;
    //   }
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
    Database.logCycleStart(controlTypes[currentControl],
      transitionTypes[currentTransitionType], target.getInfo());
    if (logClock == null)
      logClock = window.setInterval(Database.logEEPose, 750);
    Database.logSelectedView(selectedView);
  }

}

function setTargetPose() {
  // Setup the default state of the target
  var pos = new THREE.Vector3(6, 7, -1);
  var rot = new THREE.Euler(0, 0, 0);
  var dim = new THREE.Vector3(0.15, 0.15, 1);

  var type = ((Math.random() < 0.5) ? 'box' : 'cylinder');

  if (isTest) {
    pos = testConfigs[currentTest].pos;
    rot = testConfigs[currentTest].rot;
    dim = testConfigs[currentTest].dim;
    type = testConfigs[currentTest].type
  }
  else {
    let poseFound = false;
    while (!poseFound) {
      pos.x = getRandomArbitrary(6, 7); // Max bounds: [3, 8.5]
      pos.y = getRandomArbitrary(1, 5); // Max bounds: [0.5, 10]
      pos.z = getRandomArbitrary(-3, 0); // Max bounds: [-6.5, 2]

      dim.y = getRandomArbitrary(0.1, 0.18);
      dim.x = getRandomArbitrary(0.2, 0.7);
      dim.z = getRandomArbitrary(1, 2);

      if (type == "cylinder") {
        dim.x = dim.y;
      }

      rot.x = 90 * DEG_TO_RAD;
      rot.y = getRandomInt(0, 3) * 90 * DEG_TO_RAD;
      rot.z = 0;

      /*
      // TODO: Update this to convert the 3d positin of the target to 2d screen space to ensure that the panel never blocks the target
      // If there it a panel, don't let the target fall behind it
      if (controlTypes[currentControl] == "panel" &&
        randomX < Panel.width + SE3.lineLength
        && randomY < Panel.height + SE3.lineLength)
        console.log("pose rejected");
      else
        poseFound = true;
      */
      poseFound = true;
    }
  }

  return new SE3Target("rgb(255, 179, 0)", pos, rot, dim, type);
}

function setEEPoseAtCenter() {
  if (elbowUp) {
    ee.threejs_object.position.set(5.511428117752075, 2.489123249053955, -4.494971823692322); //(5.5, 2.5, -4.5); // Old starting location: (4.5, 7, -1);
    //ee.threejs_object.rotation.set(0, 0, -90*DEG_TO_RAD);
    ee.threejs_object.quaternion.set(0, 0, 0, 1);// = new THREE.Quaternion(0.7891517295996459, 0.08924656141729262, 0.10129941990806501, -0.5991769558411375);
  } else {
    // This is based on the position of the EE with the current starting state of the arm
    setJointAngles(initial_angle_state);
    dae.updateMatrixWorld();
    ee_pose = getEEPose();
    ee.threejs_object.position.copy(ee_pose.position);
    ee.threejs_object.quaternion.copy(ee_pose.quaternion);
  }

  ee.threejs_object_ghost.position.copy(ee.threejs_object.position);
  ee.threejs_object_ghost.quaternion.copy(ee.threejs_object.quaternion);

  resetIK()
}

// The IK can sometimes get stuck in a weird state
// This function fully resets it
function resetIK(run_solveIK = true) {
  if (kinematics) {
    setJointAngles(initial_angle_state)
    dae.updateMatrixWorld(true);
  }
  starting_position = [...initial_angle_state];
  lastAngles = [...initial_angle_state];

  if (kinematics && enableIK && run_solveIK) {
    solveIK(ik_target, iterations);
    solveIK(ik_target, iterations);
    solveIK(ik_target, iterations);
  }
}

// Manually reset IK based on user input, also logs to the database
function manualResetIK() {
  // resetIK();
  setEEPoseAtCenter();
  if (controlTypes[currentControl] == 'panel') {
    Control.updateControlPositions(update_svg = false);
  } else {
    Control.updateControlPositions();
  }
  //Control.initialize(ee.pose);
  Database.logResetIK();
}

function clearWorkspace() {
  var ws = document.getElementById("workspace");
  while (ws.hasChildNodes()) {
    ws.removeChild(ws.firstChild);
  }

  scene.remove(target.threejs_object);

  Control.unregisterEvents();
  ws.removeEventListener("mousemove", Control.update);

  ee.threejs_object_ghost.visible = false;

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
    if (currentTest >= 5) {
      console.log('next is enabled')
      let btn = document.getElementById("next-button");
      btn.disabled = false;
    }
  }

  if (!isTest || currentTest < testConfigs.length) {
    initializeTest();
  }

}
