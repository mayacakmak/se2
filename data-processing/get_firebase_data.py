# This script only works on python 3.6 and below, the firebase library has not been updated to work with any later version
from firebase import firebase
import simplejson as json
import time
import os

firebase = firebase.FirebaseApplication('https://accessible-teleop.firebaseio.com', None)

result = firebase.get('/users', None)

with open(os.path.join("firebase-snapshots", str(time.time()) + ".json"), "w") as f:
    json.dump(result, f)