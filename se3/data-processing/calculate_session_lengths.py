import os
import json
import time
import numpy as np

snapshot_folder = "firebase-snapshots"
snapshot_name = "1604179441.9017837"

json_snapshot = {}
with open(os.path.join(snapshot_folder, snapshot_name + ".json")) as f:
    json_snapshot = json.load(f)
user_data = json_snapshot['users'] 
state_data = json_snapshot['state']
cycles_data = json_snapshot['cycles'] 

# Gather UIDs from states/`interface_num`/completed
uids = []
for interface_num in state_data:
    try:
        uids += interface_num['complete'].keys()
    except:
        pass

session_lengths = []
session_order = []

for uid in user_data:
    if uid in uids:
        session_timestamps = []
        for sid in user_data[uid]['sessions']:
            session_timestamps.append(user_data[uid]['sessions'][sid]['timestamp'])
            if 'questionnaires' in user_data[uid]['sessions'][sid]:
                session_timestamps.append(user_data[uid]['sessions'][sid]['questionnaires'][list(user_data[uid]['sessions'][sid]['questionnaires'].keys())[0]]['time']['timestamp'])
        session_lengths.append(int((max(session_timestamps) - min(session_timestamps))/(1000 * 60)))
        session_order.append(uid)

print("All units are in minutes")
print("Lengths:",session_lengths)
print("   Mean:",np.mean(session_lengths))
print("  StDev:",np.std(session_lengths))