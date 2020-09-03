import os
import json
import time
import numpy as np

snapshot_folder = "firebase-snapshots"
snapshot_timestamp = 1598642923.545525
uids = ["dgb7CWy7rSNWIAZHXEYDRAt3O2b2", "6qW2fw5bT5hLvsAUO7MaR82ZqOu1", "3gz7ZfC2YVWEL83csaHrnHLqet42", "7TIOuYmg42MtgXKvf7YcfCYX9l52", "403NovdIENcvmKY9PoakqivpyP53", "pfZvthWm1iY4Cm11co2LgBEnimj1", "OEoHdni4GFXI6iKVbbW1pOGNXps2", "J2eQ4D9j9wVgj0oNOpZLWCenWnh1", "iTccwNLgo2OCqpG2BR565G1iUtA2"]

with open(os.path.join(snapshot_folder, str(snapshot_timestamp) + ".json")) as f:
    json_snapshot = json.load(f)

session_lengths = []
session_order = []

for uid in json_snapshot:
    if uid in uids:
        session_timestamps = []
        for sid in json_snapshot[uid]['sessions']:
            session_timestamps.append(json_snapshot[uid]['sessions'][sid]['timestamp'])
            if 'questionnaires' in json_snapshot[uid]['sessions'][sid]:
                session_timestamps.append(json_snapshot[uid]['sessions'][sid]['questionnaires'][list(json_snapshot[uid]['sessions'][sid]['questionnaires'].keys())[0]]['time']['timestamp'])
        session_lengths.append(int((max(session_timestamps) - min(session_timestamps))/(1000 * 60)))
        session_order.append(uid)

print("MTurk:", list((np.array([1796, 2070, 2684, 1365, 2588, 2090, 1689, 1825, 2367])/60).astype(int)))
print("   Us:",session_lengths)
#print(session_order)
print("Mean:",np.mean(session_lengths))
print("StDev:",np.std(session_lengths))