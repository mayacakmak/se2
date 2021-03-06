/*
* Database class for interfacing with the Firebase realtime database
*/
function Database() {

  Database.isAnonymous = false;
  Database.uid = null; // User ID
  Database.sid = null; // Session ID
  Database.cid = null; // Cycle ID
  Database.isLogging = true;
  Database.rootPath = "se3/";

  Database.in_progess_timeout = 32; // in minutes, how long before a user is automatically assumed to be inactive
  Database.in_progess_timeout = Database.in_progess_timeout * 60 * 1000; // Convert to milliseconds
  /*
  * If somethings need to be initialized only after the database connection 
  * has been established, the Database.readyCallback static variable should be
  * set to the initialization function. If it is not null, it will be called
  * when successful sign in happens.
  */
  Database.readyCallback = null;

  /* 
  * Firebase configuration information obtained from the Firebase console
  */
  Database.config = {
    apiKey: "AIzaSyBLQXA1Lwlp6SgfQ3HAos_kCL4flCNc004",
    authDomain: "accessible-teleop.firebaseapp.com",
    databaseURL: "https://accessible-teleop.firebaseio.com",
    projectId: "accessible-teleop",
    storageBucket: "accessible-teleop.appspot.com",
    messagingSenderId: "430487423155",
    appId: "1:430487423155:web:edbef6c7dbbd04da"
  };

  this.database = Database.config["databaseURL"];
  this.app = firebase.initializeApp(Database.config);

  this.initialize = function (anonymous = true) {
    firebase.auth().onAuthStateChanged(Database.handleAuthStateChange);
    if (anonymous) {
      this.signInAnonymously();
    } else {
      this.signInWithGoogle();
    }
  }

  this.signInWithGoogle = function () {
    console.log('sign in with google');
    if (Database.uid == null) {
      console.log('uid null')
      var provider = new firebase.auth.GoogleAuthProvider();
      firebase.auth().useDeviceLanguage();
      firebase
        .auth()
        .signInWithPopup(provider)
        .then(function (result) {
          // This gives you a Google Access Token. You can use it to access the Google API.
          var token = result.credential.accessToken;
          // The signed-in user info.
          var user = result.user;
        })
        .catch(function (error) {
          // Handle Errors here.
          var errorCode = error.code;
          var errorMessage = error.message;
          // The email of the user's account used.
          var email = error.email;
          // The firebase.auth.AuthCredential type that was used.
          var credential = error.credential;
          // ...
          console.log(error);
        });
    }
  }

  this.signInAnonymously = function () {
    if (Database.uid == null) {
      firebase
        .auth()
        .signInAnonymously()
        .catch(Database.handleError);
    }
  }

  Database.handleError = function (error) {
    var errorCode = error.code;
    var errorMessage = error.message;
    console.log("Error " + errorCode + ": " + errorMessage);
  }

  Database.handleAuthStateChange = function (user) {
    if (user) {
      Database.isAnonymous = user.isAnonymous;
      Database.uid = user.uid;

      if (!Database.isAnonymous) {
        console.log("Signed in as " + user.displayName);
      } else {
        console.log("Signed in anonymously");
      }

      // Create directory in database to save this user's data
      Database.logSessionStart();

      // Update the interface in_progress/canceled state
      Database.updateInterfaceStates((new Date).getTime());

      if (Database.readyCallback != null)
        Database.readyCallback();

    } else {
      console.log("User is signed out.");
    }
  }

  Database.signOut = function () {
    firebase.auth().signOut().catch(Database.handleError);
    Database.uid = null;
  }

  Database.insertTime = function (event) {
    var date = new Date();
    event.timestamp = date.getTime();
    event.date = date.toDateString();
    event.time = date.toTimeString();
    return event;
  }

  Database.logSessionStart = function () {
    if (Database.isLogging) {
      var dir = Database.rootPath + 'users/' + Database.uid + '/sessions';
      var dbRef = firebase.database().ref(dir);
      var sessionInfo = {
        url: window.location.href
      };
      Database.insertTime(sessionInfo);
      Database.sid = dbRef.push(sessionInfo).key;
      console.log("Session Started", sessionInfo);
    }
  }

  Database.logCycleStart = function (control, transitionType, targetPose) {
    if (Database.isLogging) {
      var dir = Database.rootPath + 'users/' + Database.uid + "/sessions/" + Database.sid + "/cycles/";
      var dbRef = firebase.database().ref(dir);
      var cycleInfo = {
        control: control,
        transitionType: transitionType,
        targetPose: targetPose,
        startTime: {},
        status: "incomplete",
        isTest: isTest,
        reset_ik_num: 0
      }
      Database.insertTime(cycleInfo.startTime);
      Database.cid = dbRef.push(cycleInfo).key;
      console.log("Cycle Started", cycleInfo);
    }
  }

  Database.logCycleFinish = function () {
    if (Database.isLogging) {
      var dir = Database.rootPath + 'users/' + Database.uid + "/sessions/" + Database.sid + "/cycles/" + Database.cid;
      var dbRef = firebase.database().ref(dir);
      var cycleEndInfo = {
        endTime: {},
        status: "complete"
      }
      Database.insertTime(cycleEndInfo.endTime);
      dbRef.update(cycleEndInfo);
      console.log("Cycle Complete", cycleEndInfo);
      Database.cid = null;
    }
  }

  Database.logEvent = function (eventLog) {
    if (Database.isLogging) {
      if (Database.cid != null) {
        var dir = Database.rootPath + "cycles/" + Database.cid + "/events";
        var dbRef = firebase.database().ref(dir);
        eventLog.type = "action"
        eventLog.eePose = ee.get3DPose();
        Database.insertTime(eventLog);
        dbRef.push(eventLog);
        console.log(eventLog);
      }
    }
  }

  Database.logSelectedView = function (view) {
    if (Database.isLogging) {
      if (Database.cid != null) {
        var dir = Database.rootPath + "cycles/" + Database.cid + "/events";
        var dbRef = firebase.database().ref(dir);
        eventLog = {
          view: view,
          type: "view_change"
        }
        Database.insertTime(eventLog);
        dbRef.push(eventLog);
      }
    }
  }


  Database.logResetIK = function () {
    if (Database.isLogging) {
      if (Database.cid != null) {

        // Add a reset_ik action to this cycle's action list
        var dir = Database.rootPath + "cycles/" + Database.cid + "/events";
        var dbRef = firebase.database().ref(dir);
        eventLog = {
          type: "reset_ik"
        }
        Database.insertTime(eventLog);
        dbRef.push(eventLog);

        // Increment the number of reset_ik under the properties for this cycle
        firebase.database().ref(Database.rootPath + 'users/' + Database.uid + "/sessions/" + Database.sid + "/cycles/" + Database.cid + "/reset_ik_num").transaction(function (reset_ik_num) {
          if (reset_ik_num) {
            reset_ik_num++;
          } else if (reset_ik_num == 0) {
            reset_ik_num = 1;
          }
          return reset_ik_num;
        });

      }
    }
  }

  Database.logEEPose = function () {
    if (Database.isLogging) {
      if (Database.cid != null) {
        var dir = Database.rootPath + "cycles/" + Database.cid + "/events";
        var dbRef = firebase.database().ref(dir);
        eventLog = {
          type: "pose",
          eePose: ee.get3DPose()
        }
        Database.insertTime(eventLog);
        dbRef.push(eventLog);
        //         console.log(eventLog);
      }
    }
  }

  Database.logQuestionnaire = function (data, control, transition) {
    if (Database.isLogging) {
      var dir = Database.rootPath + 'users/' + Database.uid + "/sessions/" + Database.sid + "/questionnaires/";
      var dbRef = firebase.database().ref(dir);
      var questionnaireInfo = {
        answers: data,
        control: control,
        transition: transition,
        time: {}
      }
      Database.insertTime(questionnaireInfo.time);
      dbRef.push(questionnaireInfo);

      // Get the current interface from the URL
      let controlType = getURLParameter("c");
      let transitionType = getURLParameter("t");
      if (controlType == undefined)
        controlType = 0;
      if (transitionType == undefined)
        transitionType = 1;
      var interface_num = interface_nums_inverse[controlType][transitionType];

      firebase.database().ref(`state/${interface_num}/in_progress/${Database.uid}`).once('value', function (snapshot) {
        var state = snapshot.val();

        // Delete the user from [in_progess, canceled] Add them to [completed]
        firebase.database().ref(Database.rootPath + `state/${interface_num}/in_progress/${Database.uid}`).remove();
        firebase.database().ref(Database.rootPath + `state/${interface_num}/canceled/${Database.uid}`).remove();
        firebase.database().ref(Database.rootPath + `state/${interface_num}/complete/${Database.uid}`).set({ timestamp: (state ? state : (new Date).getTime()) });
      });

      // Decrement the total left to do for this interface
      //  * (This is done using a transaction to prevent two users overwriting each others changes)
      firebase.database().ref(Database.rootPath + `state/${interface_num}/todo`).transaction(function (todo) {
        if (todo) {
          todo--;
        }
        return todo;
      });
    }
  }

  Database.updateInterfaceStates = function (currentTime) {
    if (Database.isLogging) {
      firebase.database().ref(Database.rootPath + 'state').once('value').then(function (snapshot) {
        var state = snapshot.val();
        for (var i = 0; i < state.length; i++) {
          // Update the current state of the database to move users around
          if (state[i].in_progress) {
            Object.keys(state[i].in_progress).forEach(function (user_id) {
              if (currentTime - state[i].in_progress[user_id].timestamp > Database.in_progess_timeout) {
                // Delete the user from [in_progess] 
                firebase.database().ref(Database.rootPath + `state/${i}/in_progress/${user_id}`).remove();
                // Add them to [canceled]
                firebase.database().ref(Database.rootPath + `state/${i}/canceled/${user_id}`).set(state[i].in_progress[user_id]);
              }
            });
          }
        }
      });
    }
  }

  Database.getAndUpdateInterfaceNum = function (callback) {
    if (Database.isLogging) {
      var dir = Database.rootPath + 'state';
      var dbRef = firebase.database().ref(dir);
      var currentTime = (new Date).getTime();

      Database.updateInterfaceStates(currentTime);

      var neededTests = [];
      dbRef.once('value').then(function (snapshot) {
        var state = snapshot.val();

        for (var i = 0; i < state.length; i++) {
          neededTests.push(state[i].todo);
          if (state[i].in_progress) {
            neededTests[i] -= Object.keys(state[i].in_progress).length;
          }
        }

        // Select the interface that currently needs the most tests
        var chosen_interface = loc_max(neededTests);
        firebase.database().ref(`${dir}/${chosen_interface}/in_progress/${Database.uid}`).set({ timestamp: currentTime });
        callback(chosen_interface);
      });
    }
  }
}

function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function loc_max(arr) {
  // We want to make sure that if all are equal, a starting location is chosen
  var loc = getRandomInt(0, arr.length - 1);
  var max = arr[loc];

  for (var i = 0; i < arr.length; i++) {
    if (arr[i] > max) {
      loc = i;
      max = arr[i];
    }
  }
  return loc;
}

/*
* Creating the database instance here
*/
var db = new Database();

