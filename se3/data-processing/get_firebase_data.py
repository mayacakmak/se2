# TODO: Give this script admin privileges
# https://console.firebase.google.com/u/0/project/accessible-teleop/settings/serviceaccounts/adminsdk
# https://firebase.google.com/docs/database/admin/start#python
# https://firebase.google.com/docs/admin/setup#prerequisites

# NOTE: In the mean time for this script to work, 
# first change database security rules so 'se3'
# has read access. Revert rules afterwards.

# This script only works on python 3.6 and below, the firebase library has not been updated to work with any later version
from firebase import firebase
import simplejson as json
import time
import os

firebase = firebase.FirebaseApplication('https://accessible-teleop.firebaseio.com', None)

result = firebase.get('/se3', None)

with open(os.path.join("firebase-snapshots", str(time.time()) + ".json"), "w") as f:
    json.dump(result, f)