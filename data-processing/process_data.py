# %% [markdown]
## Imports

# %%
# Data Processing
import pandas as pd
import matplotlib.pyplot as plt
from matplotlib.collections import LineCollection
from scipy import interpolate
import numpy as np

# General
import os
import simplejson as json
import time
import copy

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
    '''
    Pads a 1D array with zeros

    If the array is less than the input length it will not be changed
    '''
    a = np.array(a)
    if a.shape[0] >= new_length:
        return a
    else:
        return np.pad(a, (0, new_length-a.shape[0]), mode='constant', constant_values=0)

def remap_array(a, low1, high1, low2, high2):
    '''
    Remaps a numpy array to a specific range
    '''
    return low2 + (high2 - low2) * (a - low1) / (high1 - low1)

def resample(x, n, kind='linear'):
    x = np.array(x)
    f = interpolate.interp1d(np.linspace(0, 1, x.size), x, kind)
    return f(np.linspace(0, 1, n))

    

# %% [markdown]
## Firebase snapshot and other inputs

# %%
snapshot_folder = "firebase-snapshots"
snapshot_timestamp = 1599149218.2695348
uids = [
"5GRB38CXknhkxg6TOJbIcv2nXzA3",
"yjK8ULyntGPoDEAVHNTTN9Nqfm22",
"JuK3dGRjGtaiAE5tEbENZ5uYEgL2",
"R38A4sW0hPeZrf5gGP3LlkOGvN42",
"RYXaa5nARFMPqC9lZlhtxjoWhT63",
"2g3T3iXiK5ZAzDnfXsw48gz51U13",
"koOh4ai537ck1bicewiBDXbsvT32",
"BYP2GZ3dMcOaxOQe3LzTG8mExNg1",
"iAfRVyE5zBVDaCJaHQy8eXy4UFt2",
"lcQ2LyJnZYYOiVkUdn74Vlg5cFO2",
"Szx7JQSiAJZ3Jrc1qtWMkzjpf1r2",
"HAyJn9wjYoNyZbAZQvRSgEPVTBC2",
"GI13cLqmg0e8fvQHNLbNFaDmj3B3",
"yXc9k4hHTfVTgFB2vofsvtp4iar2",
"IytvG29WMiVzbwB3LD3CB6A7L2C2",
"6sNdm497rGOH8Zaxrf6R2RAnen12",
"YuIhl3MUG9SoctZBfojblQrzGYV2",
"63nBGBk0lIUg2uTHjKFZ1QLSA3k1",
"JhA9pw1gtOaoCEqfRi1tovqQI0n2",
"Szx7JQSiAJZ3Jrc1qtWMkzjpf1r2",
"erlxfdLlZTZn92ezvmBLaOsGSaY2",
"NrMq1plFgONhVkws64ERStImxm92",
"kc4EpEGlKeQ3IqHhwop1BQ8Sns23",
"OuZXXUa0PBS3TAYE1F57zKPrloj2",
"BBNBAdETSFbMsJn9gDqsoVWl5eX2",
"XToQ1O8D7wa4jvMOEoakj9b4MC43",
"nMMOu7Etu1ZqvXCSqSIVLoEph2i1",
"olgTWiva9YhGjnlAhCxOjcwGexu2",
"u7l3t5DLMVafkJAIhTh419wbrYB2",
"Pg0WtxkkvafBMeeQpn4amV5Qxlp2",
"ddIBVrHAzMbAuDB2pXLXm9HJlZX2",
"iaCIBURD8ZgSt3y33E3WHT70sfH2",
"edOwBLqhK2g3rlRfp6wLB1n3qvF2",
"6FI56PH5O4Zezb02QVteRn9eFVV2",
"elKMsbzEutNcpBY6JFgUA3E05Bj2",
"J2eQ4D9j9wVgj0oNOpZLWCenWnh1",
"X6VjwiI94tef2FXw9MMFolQYrYp1",
"el1LL3Iyc7X2CNma2yYgswZr4Zl2",
"1lKYBHe3pwS1uQndpwxe3LOlWv82",
"edOwBLqhK2g3rlRfp6wLB1n3qvF2",
"Fsii053aoTUhqumz1vMK867h7ko1",
"5W0paREQZBNfhxUOJfB9eGOQPAD3",
"rjyk9m3Qs6fTSzfG1m8UQHK9fTI3",
"BLikrZve4nMMwPOWZegBihFZthI3",
"wZDNjgM6U3XD78Ek1tiDEWuE3q63",
"nOpsxid8GVaWVGyguvNJ48qCvol2"
]

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

cycle_data_columns = ["startTime", "endTime", "status", "control", "transitionType", "interfaceID", "targetX", "targetY", "targetTheta", "threshXY", "threshTheta"]
cycle_data = []

action_list = {}

for uid in json_snapshot['users']:
    if uid in uids:
        for sid in json_snapshot['users'][uid]['sessions']:
            if 'cycles' in json_snapshot['users'][uid]['sessions'][sid]:
                for cid in json_snapshot['users'][uid]['sessions'][sid]['cycles']:
                    cycle = json_snapshot['users'][uid]['sessions'][sid]['cycles'][cid]
                    
                    if 'isTest' not in cycle:
                        print(cid, sid, uid)
                        continue

                    if cycle['isTest']:
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
                        threshXY = cycle['targetPose']['threshXY']
                        threshTheta = cycle['targetPose']['threshTheta']

                        cycle_data.append([startTime, endTime, status, control, transitionType, interfaceID, targetX, targetY, targetTheta, threshXY, threshTheta])

                        # Update action_list with the set of actions for this cycle
                        if 'events' in cycle: # Sometimes the last cycle of a session has no action so we skip it
                            actions = []
                            for aid in cycle['events']:

                                # We want to ignore any events that are just ee pose logs, and only keep user actions
                                if cycle['events'][aid]['type'] != 'pose':
                                    # We want to remove any actions that are just a release of the cursor
                                    action_type = cycle['events'][aid]['newState']
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
### Euclidean Distance vs Time

# %%
fig = plt.figure(figsize=(16,10))
fig.subplots_adjust(hspace=0.6, wspace=0.3)

for i, interfaceID in enumerate(interface_dfs):
    ax = plt.subplot("33"+str(i+1))
    ax.set_title(interfaceID)
    
    interface_df = interface_dfs[interfaceID]
    ax.scatter(interface_df['cycleLength'], interface_df['targetDistance'], c="tab:blue")
    
    #line = fit_line(interface_df['cycleLength'], interface_df['targetDistance'])
    #ax.plot(line[0], line[1], c="tab:purple")

    ax.set_xlabel('Cycle Time')
    ax.set_ylabel('Distance to Target')

    ax.set_xlim([0, 35])

# %% [markdown]
### Orientation vs Time

# %%
fig = plt.figure(figsize=(16,10))
fig.subplots_adjust(hspace=0.6, wspace=0.3)

for i, interfaceID in enumerate(interface_dfs):
    ax = plt.subplot("33"+str(i+1))
    ax.set_title(interfaceID)
    
    interface_df = interface_dfs[interfaceID]
    ax.scatter(interface_df['cycleLength'], np.abs(interface_df['targetTheta']), c="tab:blue")
    
    #line = fit_line(interface_df['cycleLength'], np.abs(interface_df['targetTheta']))
    #ax.plot(line[0], line[1], c="tab:purple")

    ax.set_xlabel('Cycle Time')
    ax.set_ylabel('Target Rotation')

# %% [markdown]
### Distance + Orientation vs Time

# %%

fig = plt.figure(figsize=(16,10))
fig.subplots_adjust(hspace=0.6, wspace=0.3)

for i, interfaceID in enumerate(interface_dfs):
    ax = plt.subplot("33"+str(i+1))
    ax.set_title(interfaceID)
    
    interface_df = interface_dfs[interfaceID]
    ax.scatter(interface_df['cycleLength'], np.abs(interface_df['targetTheta']) + interface_df['targetDistance'], c="tab:blue")
    
    #line = fit_line(interface_df['cycleLength'], np.abs(interface_df['targetTheta']) + interface_df['targetDistance'])
    #ax.plot(line[0], line[1], c="tab:purple")

    ax.set_xlabel('Cycle Time')
    ax.set_ylabel('Distance + Orientation')

# %% [markdown]
## Action stats per interface
### Action Type vs Time

# %%
sample_num = 1000

fig = plt.figure(figsize=(16,10))
fig.subplots_adjust(hspace=0.6, wspace=0.3)

for i, interfaceID in enumerate(interfaceIDs):
    rotation = np.array([])
    translation = np.array([])
    click = np.array([])
    for cycle in action_list[interfaceID]:
        for j, action in enumerate(cycle):
            
            if "rotating" in action:
                rotation = pad_with_zeros(rotation, j+1)
                rotation[j] += 1
            elif "translating" in action or "moving" in action:
                translation = pad_with_zeros(translation, j+1)
                translation[j] += 1
            elif "cursor" in action:
                click = pad_with_zeros(click, j+1)
                click[j] += 1
    
    if rotation.shape[0] != 0:
        rotation = remap_array(rotation, np.min(rotation), np.max(rotation), 2, 10)
    if translation.shape[0] != 0:
        translation = remap_array(translation, np.min(translation), np.max(translation), 2, 10)
    if click.shape[0] != 0:
        click = remap_array(click, np.min(click), np.max(click), 1, 5)

    ax = plt.subplot("33"+str(i+1))
    ax.set_title(interfaceID)

    drawn_lines = []

    for cycle in action_list[interfaceID]:
        numbered_cycle = []
        cycle_width = []
        for i, action in enumerate(cycle):
            if "rotating" in action:
                numbered_cycle.append(1)
                cycle_width.append(rotation[i])
            elif "translating" in action or "moving" in action:
                numbered_cycle.append(2)
                cycle_width.append(translation[i])
            elif "cursor" in action:
                numbered_cycle.append(3)
                cycle_width.append(click[i])
        
        drawn = False
        for line in drawn_lines:
            drawn = np.array_equal(numbered_cycle, line)
            if drawn: break
        if drawn: continue
        drawn_lines.append(copy.copy(numbered_cycle))
        
        numbered_cycle.append(0)
        cycle_width.append(0)

        color = np.array([])
        alpha = 100
        if numbered_cycle[0] == 1:
            color = np.array([214, 33, 79, alpha])
        elif numbered_cycle[0] == 2:
            color = np.array([73, 39, 230, alpha])
        elif numbered_cycle[0] == 3:
            color = np.array([193, 24, 237, alpha])
        
        cycle_len = len(numbered_cycle)
        y = resample(numbered_cycle, sample_num, kind='slinear')
        lwidths = resample(cycle_width, sample_num, kind='slinear')

        x = np.linspace(0, cycle_len, sample_num)
        points = np.array([x, y]).T.reshape(-1, 1, 2)
        segments = np.concatenate([points[:-1], points[1:]], axis=1)
        lc = LineCollection(segments, linewidths=lwidths, color=color/255)
        ax.add_collection(lc)

    ax.set_xlabel('Time (based on action number)')
    ax.set_ylabel('Action Frequency')

    # The axis limits are not (0, 4) becase we don't want to see those labels
    ax.set_ylim([0.1, 3.9])
    ax.set_xlim([0, max(rotation.shape[0], translation.shape[0], click.shape[0])+1])

    # Lable the ticks
    ax.set_yticklabels(['','Rotate','Translate', 'Click'])

    # Force the x-axis tick interval to be 1
    start, end = ax.get_xlim()
    ax.xaxis.set_ticks(np.arange(start, end, 1))

# %%
