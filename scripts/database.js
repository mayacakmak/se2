/*
* Database class for interfacing with the Firebase realtime database
*/
function Database() {
  
  Database.isAnonymous = false;
  Database.uid = null;
  Database.isLogging = true;

  /*
  * If somethings need to be initialized only after the database connection 
  * has been established, the Database.readyCallback static variable should be
  * set to the initialization function. If it is not null, it will be called
  * when successful sign in happens.
  */
  Database.readyCallback = null;

  /* 
  * Firebase configuration information obntained from the Firebase console
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

  this.database= Database.config["databaseURL"];
  this.app = firebase.initializeApp(Database.config);

  this.initialize = function() {
    firebase.auth().onAuthStateChanged(Database.handleAuthStateChange);
    this.signInAnonymously();
  }

  this.signInAnonymously = function() {
    if (Database.uid == null) {
      firebase
        .auth()
        .signInAnonymously()
        .catch(Database.handleError);
    }
  }

  Database.handleError = function(error) {
    var errorCode = error.code;
    var errorMessage = error.message;
    console.log("Error " + errorCode + ": " + errorMessage);
  }

  Database.handleAuthStateChange = function(user) {
    if (user) {
      Database.isAnonymous = user.isAnonymous;
      Database.uid = user.uid;

      if (!Database.isAnonymous) {
        console.log("Signed in as " + user.displayName);
      } else {
        console.log("Signed in anonymously");     
      }

      // Create directory in database to save this user's data
      Database.logEvent("SessionStarted");

      if (Database.readyCallback != null)
        Database.readyCallback();

    } else {
      console.log("User is signed out.");
    }
  }

  Database.signOut = function() {
    firebase.auth().signOut().catch(Database.handleError);
    Database.uid = null;
  }
  
  Database.logEvent = function(eventName, eventLog) {
    if (Database.isLogging) {
      if (eventLog == undefined)
        eventLog = {};
      var dir = 'users/' + (Database.uid);
      var dbRef = firebase.database().ref(dir);
      var date = new Date();
      eventLog["timeStamp"] = date.getTime();
      eventLog["date"] = date.toDateString();
      eventLog["time"] = date.toTimeString();
      var newEventLog = {};
      newEventLog[eventName] = eventLog;
      dbRef.update(newEventLog);
      console.log(newEventLog);
    }
  }
}

/*
* Creating the database instance here
*/
var db = new Database();

