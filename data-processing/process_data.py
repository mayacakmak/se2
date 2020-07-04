# %% [markdown]
## Imports

# %%
# Data Processing
import pandas as pd
import matplotlib.pyplot as plt
import numpy as np

# General
import os
import simplejson as json
import time

# %%
# Custom tools

def fit_line(x, y):
    '''
    Fits a line to an input set of points

    Returns a tuple of the x and y components of the line

    Adapted from: https://stackoverflow.com/a/31800660/6454085
    '''
    return np.unique(x), np.poly1d(np.polyfit(x, y, 1))(np.unique(x))

def pad_with_zeros(a, new_length):
    a = np.array(a)
    if a.shape[0] >= new_length:
        return a
    else:
        return np.pad(a, (0, new_length-a.shape[0]), mode='constant', constant_values=0)

# %% [markdown]
## Firebase snapshot and other inputs

# %%
snapshot_folder = "firebase-snapshots"
snapshot_timestamp = 1593816412.5075164

# %% [markdown]
## Load data from Firebase
# The data is loaded from a .json file and converted into a pandas DataFrame, and a dictionary.

# For most of the processing we do, only the pandas dataframe [cycles_df] is necessary.
# It contains cycle-level data about:
# <br>
# - The start and end of a cycle
# - The control scheme that was used
# - The status of the cycle (incomplete or complete)
# - The pose (X, Y, and Theta) of the target
#
#The dictionary [action_list] is organized by interfaceID, and contains all the action chains that made up cycles
#It is used to calcuate specific data about specific actions (for example % of time spent orienting vs translating)
#
# %%

with open(os.path.join(snapshot_folder, str(snapshot_timestamp) + ".json")) as f:
    json_snapshot = json.load(f)

print("Loaded snapshot {}".format(time.strftime('%Y-%m-%d %H:%M:%S', time.localtime(snapshot_timestamp))))

# %%
# [interfaceIDs] is a set that contains one of each ID
# We use it later on to sparate the dataframe by interface
interfaceIDs = set()

cycle_data_columns = ["startTime", "endTime", "status", "control", "transitionType", "interfaceID", "targetX", "targetY", "targetTheta"]
cycle_data = []

action_list = {}

for uid in json_snapshot:
    for sid in json_snapshot[uid]['sessions']:
        for cid in json_snapshot[uid]['sessions'][sid]['cycles']:
            cycle = json_snapshot[uid]['sessions'][sid]['cycles'][cid]

            # Update cycle_data with general information about the cycle
            startTime = cycle['startTime']['timestamp'] / 1000
            status = cycle['status']

            # There is no end timestamp if the cycle is incomplete
            endTime = startTime
            if status == "complete":
                endTime = cycle['endTime']['timestamp'] / 1000

            control = cycle['control']
            transitionType = cycle['transitionType']
            interfaceID = control + "." +transitionType

            interfaceIDs.add(interfaceID)

            targetX = cycle['targetPose']['x']
            targetY = cycle['targetPose']['y']
            targetTheta = cycle['targetPose']['theta']

            cycle_data.append([startTime, endTime, status, control, transitionType, interfaceID, targetX, targetY, targetTheta])

            # Update action_list with the set of actions for this cycle
            if 'actions' in cycle: # Sometimes the last cycle of a session has no action so we skip it
                actions = []
                for aid in cycle['actions']:

                    # We want to remove any actions that are just a release of the cursor
                    action_type = cycle['actions'][aid]['newState']
                    if action_type != "cursor-free":
                        actions.append(action_type)
                    elif interfaceID == "target.click" or interfaceID == "targetdrag.click":
                        actions.append(action_type)
                
                if interfaceID in action_list:
                    action_list[interfaceID].append(actions)
                else:
                    action_list[interfaceID] = [actions]

# %%
cycles_df = pd.DataFrame(cycle_data, columns=cycle_data_columns)
cycles_df['cycleLength'] = cycles_df['endTime'] - cycles_df['startTime']
# Calculate the euclidean distace between where the ee starts (357, 249) and the target
cycles_df['targetDistance'] = ((cycles_df['targetX'] - 357) ** 2 + (cycles_df['targetY'] - 249) ** 2) ** 0.5
cycles_df = cycles_df[cycles_df["status"] == "complete"]

interface_dfs = {}
for interfaceID in interfaceIDs:
    interface_dfs[interfaceID] = cycles_df[cycles_df["interfaceID"] == interfaceID]

cycles_df.head()

# %% [markdown]
## Time stats per interface

# %%
for interfaceID in interface_dfs:
    interface_df = interface_dfs[interfaceID]

    print(interfaceID)
    print("Mean:", np.mean(interface_df['cycleLength']))
    print("Standard Deviation:",np.std(interface_df['cycleLength']))
    print("Min:",np.min(interface_df['cycleLength']))
    print("Max:",np.max(interface_df['cycleLength']))
    print()


# %% [markdown]
## Time vs. Distance (Euclidean, Orientation, and Combined)

# %%
fig = plt.figure(figsize=(16,10))
fig.subplots_adjust(hspace=0.6, wspace=0.3)
fig.suptitle("Euclidean Distance vs Time", fontsize=16)

for i, interfaceID in enumerate(interface_dfs):
    ax = plt.subplot("42"+str(i+1))
    ax.set_title(interfaceID)
    
    interface_df = interface_dfs[interfaceID]
    ax.scatter(interface_df['cycleLength'], interface_df['targetDistance'], c="tab:blue")
    
    line = fit_line(interface_df['cycleLength'], interface_df['targetDistance'])
    ax.plot(line[0], line[1], c="tab:purple")

    ax.set_xlabel('Cycle Time')
    ax.set_ylabel('Distance to Target')

# %%
fig = plt.figure(figsize=(16,10))
fig.subplots_adjust(hspace=0.6, wspace=0.3)
fig.suptitle("Orientation vs Time", fontsize=16)

for i, interfaceID in enumerate(interface_dfs):
    ax = plt.subplot("42"+str(i+1))
    ax.set_title(interfaceID)
    
    interface_df = interface_dfs[interfaceID]
    ax.scatter(interface_df['cycleLength'], np.abs(interface_df['targetTheta']), c="tab:blue")
    
    line = fit_line(interface_df['cycleLength'], np.abs(interface_df['targetTheta']))
    ax.plot(line[0], line[1], c="tab:purple")

    ax.set_xlabel('Cycle Time')
    ax.set_ylabel('Target Rotation')

# %%

fig = plt.figure(figsize=(16,10))
fig.subplots_adjust(hspace=0.6, wspace=0.3)
fig.suptitle("Distance + Orientation vs Time", fontsize=16)

for i, interfaceID in enumerate(interface_dfs):
    ax = plt.subplot("42"+str(i+1))
    ax.set_title(interfaceID)
    
    interface_df = interface_dfs[interfaceID]
    ax.scatter(interface_df['cycleLength'], np.abs(interface_df['targetTheta']) + interface_df['targetDistance'], c="tab:blue")
    
    line = fit_line(interface_df['cycleLength'], np.abs(interface_df['targetTheta']) + interface_df['targetDistance'])
    ax.plot(line[0], line[1], c="tab:purple")

    ax.set_xlabel('Cycle Time')
    ax.set_ylabel('Distance + Orientation')

# %% [markdown]
## Action stats per interface

# %%
fig = plt.figure(figsize=(16,10))
fig.subplots_adjust(hspace=0.6, wspace=0.3)
fig.suptitle("Action Type vs Time", fontsize=16)

action_types = set()

for i, interfaceID in enumerate(action_list):
    rotation = np.array([])
    translation = np.array([])
    click = np.array([])
    for cycle in action_list[interfaceID]:
        for j, action in enumerate(cycle):
            action_types.add(action)
            
            if "rotating" in action:
                rotation = pad_with_zeros(rotation, j+1)
                rotation[j] += 1
            elif "translating" in action or "moving" in action:
                translation = pad_with_zeros(translation, j+1)
                translation[j] += 1
            elif "cursor" in action:
                click = pad_with_zeros(click, j+1)
                click[j] += 1

    ax = plt.subplot("42"+str(i+1))
    ax.set_title(interfaceID)
    
    ax.plot(rotation, c="tab:purple")
    ax.plot(translation, c="tab:red")
    ax.plot(click, c="tab:blue")

    ax.set_xlabel('Time (based on action number)')
    ax.set_ylabel('Action Frequency')

# %%
