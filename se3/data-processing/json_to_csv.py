#%% 
# Imports
import pandas as pd
import numpy as np
import os
import simplejson as json
import urllib.parse as urlparse
from urllib.parse import parse_qs
import random

snapshot_folder = "firebase-snapshots"
snapshot_name = "1604183639.9990926"
# snapshot_name = "accessible-teleop-export-9-17-study-fixed-order"

# Load the json data
json_snapshot = {}
with open(os.path.join(snapshot_folder, snapshot_name + ".json")) as f:
    json_snapshot = json.load(f)
user_data = json_snapshot['users']
state_data = json_snapshot['state']
cycles_data = json_snapshot['cycles']

#%% 

# Gather UIDs from states/`interface_num`/completed
uids = []
for interface_num in state_data:
    try:
        uids += interface_num['complete'].keys()
    except:
        pass

cycle_data_columns = ["startTime", "endTime", "control", "transitionType", 
                      "targetLocX", "targetLocY", "targetLocZ", 
                      "targetRotX", "targetRotY", "targetRotZ", 
                      "targetDimX", "targetDimY", "targetDimZ",
                      "targetType", 
                      "uid", "sid", "cid", "interfaceID", 
                      "numClicks", "draggingDuration", "resetIKNum",
                      "topViewDuration", "sideViewDuration", "frontViewDuration", "numViewSwitches"]
cycle_data = []

questionnaire_data_columns = []
questionnaire_data = []

controlTypes = ["arrow", "drag", "target", "targetdrag", "panel"]
transitionTypes = ["press/release", "click"]

interfaceIDs = set()

for uid in user_data:
    if uid in uids:
        # The view is not reset when a new cycle is started
        # We need to track how it changes across cycles to make sure that the starting view of a cycle is correct
        current_view = 'top'
        for sid in user_data[uid]['sessions']:
            if 'cycles' in user_data[uid]['sessions'][sid]:
                for cid in user_data[uid]['sessions'][sid]['cycles']:
                    cycle = user_data[uid]['sessions'][sid]['cycles'][cid]
                    
                    # Ignore any null cycles
                    if 'isTest' not in cycle:
                        continue
                    
                    # Only get data from test cycles (ignore any practice ones)
                    if cycle['isTest']:
                        # Update cycle_data with general information about the cycle
                        startTime = cycle['startTime']['timestamp'] / 1000
                        status = cycle['status']

                        # We only care about completed cycles
                        endTime = startTime
                        if status == "complete":
                            endTime = cycle['endTime']['timestamp'] / 1000

                            control = cycle['control']
                            transitionType = cycle['transitionType']
                            
                            interfaceID = control + "-" +transitionType

                            interfaceIDs.add(interfaceID)

                            targetLocX = cycle['targetPose']['pos']['x']
                            targetLocY = cycle['targetPose']['pos']['y']
                            targetLocZ = cycle['targetPose']['pos']['z']

                            targetRotX = cycle['targetPose']['rot']['x']
                            targetRotY = cycle['targetPose']['rot']['y']
                            targetRotZ = cycle['targetPose']['rot']['z']
                            
                            targetDimX = cycle['targetPose']['dim']['x']
                            targetDimY = cycle['targetPose']['dim']['y']
                            targetDimZ = cycle['targetPose']['dim']['z']

                            targetType = cycle['targetPose']['type']

                            resetIKNum = cycle['reset_ik_num']

                            numClicks = 0
                            draggingDuration = 0

                            topViewDuration = 0
                            sideViewDuration = 0
                            frontViewDuration = 0
                            numViewSwitches = 0
                            
                            start_dragging_time = -1
                            start_view_time = cycle['startTime']['timestamp']
                            for eventID in cycles_data[cid]['events']:
                                event = cycles_data[cid]['events'][eventID]
                                if event['type'] == 'action':
                                    numClicks += 1

                                    if event['prevState'] == 'cursor-free':
                                        start_dragging_time = event['timestamp']
                                    if event['prevState'] != 'cursor-free':
                                        draggingDuration += event['timestamp'] - start_dragging_time
                                if event['type'] == 'view_change':
                                    numViewSwitches += 1
                                    temp = event['timestamp'] - start_view_time
                                    if current_view == 'top':
                                        topViewDuration += temp
                                    elif current_view == 'side':
                                        sideViewDuration += temp
                                    elif current_view == 'front':
                                        frontViewDuration += temp
                                    start_view_time = event['timestamp']
                                    current_view = event['view']
                            
                            # We need to make sure we account for the time from the last view switch until the end
                            temp = cycle['endTime']['timestamp'] - start_view_time
                            if current_view == 'top':
                                topViewDuration += temp
                            elif current_view == 'side':
                                sideViewDuration += temp
                            elif current_view == 'front':
                                frontViewDuration += temp

                            draggingDuration /= 1000
                            topViewDuration /= 1000
                            sideViewDuration /= 1000
                            frontViewDuration /= 1000

                            if transitionType != 'press/release':
                                draggingDuration = -1

                            cycle_data.append([startTime, endTime, control, transitionType, 
                                               targetLocX, targetLocY, targetLocZ, 
                                               targetRotX, targetRotY, targetRotZ, 
                                               targetDimX, targetDimY, targetDimZ,
                                               targetType, 
                                               uid, sid, cid, interfaceID, 
                                               numClicks, draggingDuration, resetIKNum,
                                               topViewDuration, sideViewDuration, frontViewDuration, numViewSwitches])


            if 'questionnaires' in user_data[uid]['sessions'][sid]:
                for qid in user_data[uid]['sessions'][sid]['questionnaires']:

                    url = user_data[uid]['sessions'][sid]['url']
                    parsed = urlparse.parse_qs(urlparse.urlparse(url).query)

                    c = controlTypes[int(parsed['c'][0])]
                    t = transitionTypes[int(parsed['t'][0])]
                    answers = [uid, sid, c, t, c+"-"+t]

                    questionnaire_data_columns = user_data[uid]['sessions'][sid]['questionnaires'][qid]['answers'].keys()
                    for question_name in user_data[uid]['sessions'][sid]['questionnaires'][qid]['answers']:
                        answers.append(user_data[uid]['sessions'][sid]['questionnaires'][qid]['answers'][question_name]['resp'])
                    questionnaire_data.append(answers)
#%% 
cycles_df = pd.DataFrame(cycle_data, columns=cycle_data_columns)

'''

Disable filtering because there is not enoughd data at the moment
'''

uid_counts = cycles_df.uid.value_counts()
uid_filter_5 = uid_counts[uid_counts == 5]

cycles_df = cycles_df[cycles_df['uid'].isin(list(uid_filter_5.index))]

print(cycles_df.interfaceID.value_counts())

multi_level_index = pd.pivot_table(cycles_df, index=["interfaceID", "uid"])
for interfaceID in interfaceIDs:
    to_delete = list(multi_level_index.loc[interfaceID].index)[12:]
    cycles_df = cycles_df[~cycles_df['uid'].isin(to_delete)]

cycles_df.reset_index(inplace = True, drop = True)

u_dfs = []
for uid in cycles_df.uid.unique():
    u_df = cycles_df[cycles_df['uid'] == uid].sort_values(by="startTime")
    u_df.reset_index(inplace = True, drop = True)
    u_df['taskID'] = u_df.index.values.copy()
    u_dfs.append(u_df)
cycles_df = pd.concat(u_dfs)
cycles_df.reset_index(inplace = True, drop = True)

# Calculate the length of each cycle
cycles_df['cycleLength'] = cycles_df['endTime'] - cycles_df['startTime']

# Insert starting rotation and position of the EE nito the 
cycles_df['eeLocX'] = 5.511428117752075
cycles_df['eeLocY'] = 2.489123249053955
cycles_df['eeLocZ'] = -4.494971823692322

cycles_df['eeRotX'] = 0
cycles_df['eeRotY'] = 0
cycles_df['eeRotZ'] = 0
# Save the cycles to disk
cycles_df.to_csv(snapshot_name+"-cycles.csv")

questionnaire_data_columns = ['uid-1000--00','sid-1000--00', 'control-1000--00', 'transitionType-1000--00', 'interfaceID-1000--00'] + [s.replace("-input", "") for s in list(questionnaire_data_columns)]

questionnaires_df = pd.DataFrame(questionnaire_data, columns=questionnaire_data_columns)

# Sort the dataframe columns by question number. The sorting code is complex, because we are sorting by both section and question number
questionnaires_df = questionnaires_df.reindex(sorted(questionnaires_df.columns, key=lambda x: int("".join([x.split('-')[index] for index in [1,3]]))), axis=1)

# Rename the uid and sid columns
questionnaires_df.rename(columns={"uid-1000--00": "uid", "sid-1000--00": "sid", "control-1000--00": "control", "transitionType-1000--00": "transitionType", "interfaceID-1000--00": "interfaceID"}, inplace=True)

questionnaires_df = questionnaires_df[questionnaires_df['uid'].isin(cycles_df.uid.unique())]
questionnaires_df.reset_index(inplace = True, drop = True) 

# Save the questionnaires to disk
questionnaires_df.to_csv(snapshot_name+"-questionnaires.csv")

# %%
