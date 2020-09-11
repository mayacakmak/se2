# Imports
import pandas as pd
import numpy as np
import os
import simplejson as json

snapshot_folder = "firebase-snapshots"
snapshot_name = "accessible-teleop-export-9-10-study"

# Load the json data
json_snapshot = {}
with open(os.path.join(snapshot_folder, snapshot_name + ".json")) as f:
    json_snapshot = json.load(f)

# Gather UIDs from states/`interface_num`/completed
uids = []
for interface_num in json_snapshot['state']:
    uids += interface_num['complete'].keys()

cycle_data_columns = ["startTime", "endTime", "control", "transitionType", "targetX", "targetY", "targetTheta", "threshXY", "threshTheta", "uid", "sid", "cid"]
cycle_data = []

questionnaire_data_columns = ['uid-1000--00','sid-1000--00','section-0-question-0','section-0-question-1', 'section-0-question-10', 'section-0-question-11', 'section-0-question-12', 'section-0-question-13', 'section-0-question-2', 'section-0-question-3', 'section-0-question-4', 'section-0-question-5', 'section-0-question-6', 'section-0-question-7', 'section-0-question-8', 'section-0-question-9', 'section-1-question-0', 'section-1-question-1', 'section-1-question-10', 'section-1-question-11', 'section-1-question-12', 'section-1-question-13', 'section-1-question-14', 'section-1-question-2', 'section-1-question-3', 'section-1-question-4', 'section-1-question-5', 'section-1-question-6', 'section-1-question-7', 'section-1-question-8', 'section-1-question-9', 'section-2-question-0', 'section-2-question-1', 'section-2-question-2', 'section-2-question-3', 'section-2-question-4', 'section-2-question-5', 'section-2-question-6', 'section-2-question-7', 'section-2-question-8']
questionnaire_data = []

for uid in json_snapshot['users']:
    if uid in uids:
        for sid in json_snapshot['users'][uid]['sessions']:
            if 'cycles' in json_snapshot['users'][uid]['sessions'][sid]:
                for cid in json_snapshot['users'][uid]['sessions'][sid]['cycles']:
                    cycle = json_snapshot['users'][uid]['sessions'][sid]['cycles'][cid]
                    
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

                            targetX = cycle['targetPose']['x']
                            targetY = cycle['targetPose']['y']
                            targetTheta = cycle['targetPose']['theta']
                            threshXY = cycle['targetPose']['threshXY']
                            threshTheta = cycle['targetPose']['threshTheta']

                            cycle_data.append([startTime, endTime, control, transitionType, targetX, targetY, targetTheta, threshXY, threshTheta, uid, sid, cid])

            if 'questionnaires' in json_snapshot['users'][uid]['sessions'][sid]:
                for qid in json_snapshot['users'][uid]['sessions'][sid]['questionnaires']:
                    answers = [uid, sid]
                    for question_name in json_snapshot['users'][uid]['sessions'][sid]['questionnaires'][qid]['answers']:
                        answers.append(json_snapshot['users'][uid]['sessions'][sid]['questionnaires'][qid]['answers'][question_name])
                    questionnaire_data.append(answers)

cycles_df = pd.DataFrame(cycle_data, columns=cycle_data_columns)

# Calculate the length of each cycle
cycles_df['cycleLength'] = cycles_df['endTime'] - cycles_df['startTime']

# Calculate the euclidean distace between where the ee starts (357, 249) and the target
cycles_df['targetDistance'] = ((cycles_df['targetX'] - 357) ** 2 + (cycles_df['targetY'] - 249) ** 2) ** 0.5

# Save the cycles to disk
cycles_df.to_csv(snapshot_name+"-cycles.csv")


questionnaires_df = pd.DataFrame(questionnaire_data, columns=questionnaire_data_columns)

# Sort the dataframe columns by question number. The sorting code is complex, because we are sorting by both section and question number
questionnaires_df = questionnaires_df.reindex(sorted(questionnaires_df.columns, key=lambda x: int("".join([x.split('-')[index] for index in [1,3]]))), axis=1)

# Rename the uid and sid columns
questionnaires_df.rename(columns={"uid-1000--00": "uid", "sid-1000--00": "sid"}, inplace=True)

# Save the questionnaires to disk
questionnaires_df.to_csv(snapshot_name+"-questionnaires.csv")
