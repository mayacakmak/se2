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
snapshot_name = "1604030078.5142221"
# snapshot_name = "accessible-teleop-export-9-17-study-fixed-order"

# Load the json data
json_snapshot = {}
with open(os.path.join(snapshot_folder, snapshot_name + ".json")) as f:
    json_snapshot = json.load(f)
user_data = json_snapshot['users'] 
state_data = json_snapshot['state'] 

# user_data = {}
# with open(os.path.join(snapshot_folder, snapshot_name + ".json")) as f:
#     user_data = json.load(f)

# state_data = {}
# with open(os.path.join(snapshot_folder, snapshot_name + "-state.json")) as f:
#     state_data = json.load(f)

#%% 

# Gather UIDs from states/`interface_num`/completed
uids = []
for interface_num in state_data:
    uids += interface_num['complete'].keys()

cycle_data_columns = ["startTime", "endTime", "control", "transitionType", "targetX", "targetY", "targetTheta", "threshXY", "threshTheta", "uid", "sid", "cid", "interfaceID", "numClicks", "draggingDuration"]
cycle_data = []

#questionnaire_data_columns = ['uid-1000--00','sid-1000--00','section-0-question-0','section-0-question-1', 'section-0-question-10', 'section-0-question-11', 'section-0-question-12', 'section-0-question-13', 'section-0-question-2', 'section-0-question-3', 'section-0-question-4', 'section-0-question-5', 'section-0-question-6', 'section-0-question-7', 'section-0-question-8', 'section-0-question-9', 'section-1-question-0', 'section-1-question-1', 'section-1-question-10', 'section-1-question-11', 'section-1-question-12', 'section-1-question-13', 'section-1-question-14', 'section-1-question-2', 'section-1-question-3', 'section-1-question-4', 'section-1-question-5', 'section-1-question-6', 'section-1-question-7', 'section-1-question-8', 'section-1-question-9', 'section-2-question-0', 'section-2-question-1', 'section-2-question-2', 'section-2-question-3', 'section-2-question-4', 'section-2-question-5', 'section-2-question-6', 'section-2-question-7', 'section-2-question-8']
questionnaire_data_columns = []
questionnaire_data = []

controlTypes = ["arrow", "drag", "target", "targetdrag", "panel"]
transitionTypes = ["press/release", "click"]

interfaceIDs = set()

for uid in user_data:
    if uid in uids:
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

                            targetX = cycle['targetPose']['x']
                            targetY = cycle['targetPose']['y']
                            targetTheta = cycle['targetPose']['theta']
                            threshXY = cycle['targetPose']['threshXY']
                            threshTheta = cycle['targetPose']['threshTheta']

                            num_clicks = 0
                            dragging_duration = 0
                            
                            start_time = -1
                            for eventID in cycle['events']:
                                event = cycle['events'][eventID]
                                if event['type'] == 'action':
                                    num_clicks += 1

                                    if event['prevState'] == 'cursor-free':
                                        start_time = event['timestamp']
                                    if event['prevState'] != 'cursor-free':
                                        dragging_duration += event['timestamp'] - start_time
                            dragging_duration /= 1000

                            if transitionType == 'press/release':
                                dragging_duration = -1

                            cycle_data.append([startTime, endTime, control, transitionType, targetX, targetY, targetTheta, threshXY, threshTheta, uid, sid, cid, interfaceID, num_clicks, dragging_duration])


            if 'questionnaires' in user_data[uid]['sessions'][sid]:
                for qid in user_data[uid]['sessions'][sid]['questionnaires']:

                    url = user_data[uid]['sessions'][sid]['url']
                    parsed = urlparse.parse_qs(urlparse.urlparse(url).query)

                    c = controlTypes[int(parsed['c'][0])]
                    t = transitionTypes[int(parsed['t'][0])]
                    answers = [uid, sid, c, t, c+"-"+t]

                    questionnaire_data_columns = user_data[uid]['sessions'][sid]['questionnaires'][qid]['answers'].keys()
                    for question_name in user_data[uid]['sessions'][sid]['questionnaires'][qid]['answers']:
                        answers.append(user_data[uid]['sessions'][sid]['questionnaires'][qid]['answers'][question_name])
                    questionnaire_data.append(answers)
#%% 
cycles_df = pd.DataFrame(cycle_data, columns=cycle_data_columns)

uid_counts = cycles_df.uid.value_counts()
uid_filter_36 = uid_counts[uid_counts == 36]

cycles_df = cycles_df[cycles_df['uid'].isin(list(uid_filter_36.index))]

multi_level_index = pd.pivot_table(cycles_df, index=["interfaceID", "uid"])
for interfaceID in interfaceIDs:
    to_delete = list(multi_level_index.loc[interfaceID].index)[24:]
    cycles_df = cycles_df[~cycles_df['uid'].isin(to_delete)]

cycles_df.reset_index(inplace = True, drop = True) 

# Calculate the length of each cycle
cycles_df['cycleLength'] = cycles_df['endTime'] - cycles_df['startTime']

# Calculate the euclidean distace between where the ee starts (357, 249) and the target
cycles_df['targetDistance'] = ((cycles_df['targetX'] - 357) ** 2 + (cycles_df['targetY'] - 249) ** 2) ** 0.5

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
