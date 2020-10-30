# %% [markdown]
## Imports

# %%
# Data Processing
import pandas as pd
import matplotlib.pyplot as plt
from matplotlib.collections import LineCollection
import scipy as scp
from scipy import interpolate
import numpy as np
import seaborn as sns
from sklearn.preprocessing import normalize


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
    correlation_matrix = np.corrcoef(x,y)
    correlation_xy = correlation_matrix[0,1]
    r_squared = correlation_xy**2

    return np.unique(x), np.poly1d(np.polyfit(x, y, 1))(np.unique(x)), r_squared

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
snapshot_name = "accessible-teleop-export-10-29-study"

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
json_snapshot = {}
with open(os.path.join(snapshot_folder, snapshot_name + ".json")) as f:
    json_snapshot = json.load(f)
user_data = json_snapshot['users'] 
state_data = json_snapshot['state'] 

# Gather UIDs from states/`interface_num`/completed
uids = []
for interface_num in state_data:
    uids += interface_num['complete'].keys()

# %%
# [interfaceIDs] is a set that contains one of each ID
# We use it later on to separate the dataframe by interface
interfaceIDs = set()

cycle_data_columns = ["startTime", "endTime", "status", "control", "transitionType", "interfaceID", "targetX", "targetY", "targetTheta", "threshXY", "threshTheta"]
cycle_data = []

action_list = {}

for uid in user_data:
    if uid in uids:
        for sid in user_data[uid]['sessions']:
            if 'cycles' in user_data[uid]['sessions'][sid]:
                for cid in user_data[uid]['sessions'][sid]['cycles']:
                    cycle = user_data[uid]['sessions'][sid]['cycles'][cid]
                    
                    if 'isTest' not in cycle:
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

cycles_df['targetPosTheta'] = np.degrees(np.arccos((cycles_df['targetX'] - 357)/cycles_df['targetDistance']))

interface_dfs = {}
for interfaceID in interfaceIDs:
    interface_dfs[interfaceID] = cycles_df[cycles_df["interfaceID"] == interfaceID]

cycles_df.head()

# %% [markdown]
## Time stats per interface

# %%
fig = plt.figure(figsize=(16,8))
fig.subplots_adjust(hspace=0.6, wspace=0.3)
ax = fig.add_subplot(1,1,1)

#targetbars = ['arrow.click','drag.click','panel.click','target.click','targetdrag.click','arrow.press/release','drag.press/release','panel.press/release','targetdrag.press/release']
targetbarclicks = ['panel.click','arrow.click','drag.click','targetdrag.click','target.click']
targetbarprs = ['panel.press/release','arrow.press/release','drag.press/release','targetdrag.press/release', 'targetdrag.press/release']

#targetbarnames = ['arrow.click','drag.click','panel.click','target.click','targetdrag.click','arrow.p/r','drag.p/r','panel.p/r','targetdrag.p/r']
targetplotnames = ['Fixed','ArrowRing','CircleRing','TargetAnchor','TargetRing']
targetplotcolors = ['#ffe500','#ff9405','#ff4791','#007bff','#00c36b']

interfaces = []
means_clicks = []
means_prs = []

errors_prs = []
errors_clicks = []

for i in np.arange(len(targetbarclicks)):
    interface_dfclicks = interface_dfs[targetbarclicks[i]]
    interface_dfprs = interface_dfs[targetbarprs[i]]
    
    means_clicks.append(np.mean(interface_dfclicks['cycleLength']))
    means_prs.append(np.mean(interface_dfprs['cycleLength']))
    
    errors_clicks.append(np.std(interface_dfclicks['cycleLength']))
    errors_prs.append(np.std(interface_dfprs['cycleLength']))

    #print("Mean:", np.mean(interface_dfclicks['cycleLength']))
    #print("Standard Deviation:",np.std(interface_dfclicks['cycleLength']))
    #print("Min:",np.min(interface_dfclicks['cycleLength']))
    #print("Max:",np.max(interface_dfclicks['cycleLength']))
    #print()

means_prs[4] = 0
errors_prs[4] = 0

ax.grid(color='gray', linestyle='-.', linewidth=1, axis='x', which='major', zorder=0)

y_pos = np.arange(len(targetplotnames))
width = 0.35
rects1 = ax.barh(y_pos - width/2, means_prs, width, xerr=errors_prs, alpha=1.0, color="gray", ecolor="gray", capsize=16, label="P/R", zorder=2)
rects2 = ax.barh(y_pos + width/2, means_clicks, width, xerr=errors_clicks, alpha=1.0, color='black', ecolor="black", capsize=16, label="Click", zorder=2)
ax.set_ylabel('Interface',fontsize=16)
ax.set_xlabel('Time (s)',fontsize=16)
ax.set_yticks(y_pos)
ax.set_yticklabels(targetplotnames)
#ax.set_title('Task Completion Time', fontsize=24, fontweight='bold')
ax.spines['right'].set_visible(False)
ax.spines['top'].set_visible(False)
ax.spines['bottom'].set_linewidth(3.0)
ax.spines['left'].set_linewidth(3.0)
ax.yaxis.set_ticks_position('left')
ax.xaxis.set_ticks_position('bottom')
ax.tick_params(axis='both', which='major', labelsize=16)
ax.set_xlim([0, 40])
#plt.xticks(rotation=45)
ax.invert_yaxis()

for ytick, color in zip(ax.get_yticklabels(), targetplotcolors):
    ytick.set_color(color)

for rect1 in rects1[0:4]:
    ax.text(0.1, rect1.get_y() + 0.22, '$\it{P/R}$', c="white", fontsize=12, fontweight='bold')

for rect2 in rects2:
    ax.text(0.1, rect2.get_y() + 0.22, '$\it{Cycle}$', c="white", fontsize=12, fontweight='bold')

plt.tight_layout()


# %% [markdown]
## Time vs. Distance (Euclidean, Orientation, and Combined)
### Euclidean Distance vs Time

# %%
fig = plt.figure(figsize=(16,8))
fig.subplots_adjust(hspace=0.6, wspace=0.3)
targetplots = ['panel.click','arrow.click','drag.click','targetdrag.click','target.click']
targetplotnames = ['Fixed','ArrowRing','CircleRing','TargetAnchor','TargetRing']
targetplotcolors = ['#ffe500','#ff9405','#ff4791','#007bff','#00c36b']
interface_dftargets = [interface_dfs[idx] for idx in targetplots]
for i, interface_df in enumerate(interface_dftargets):
    ax = fig.add_subplot(2,5,str(i+1))
    bx = fig.add_subplot(2,5,str(i+6))
    ax.set_title(targetplotnames[i], c=targetplotcolors[i], fontsize=16)
    #bx.set_title(targetplotnames[i], c=targetplotcolors[i], fontsize=16)

    ax.scatter(interface_df['targetDistance'], interface_df['cycleLength'], c="tab:blue")
    bx.scatter(interface_df['threshXY'], interface_df['cycleLength'], c="tab:orange")
    lineax = fit_line(interface_df['targetDistance'], interface_df['cycleLength'])
    linebx = fit_line(interface_df['threshXY'], interface_df['cycleLength'])
    r_squaredax = lineax[2]
    r_squaredbx = linebx[2]
    ax.plot(lineax[0], lineax[1], c="tab:red", linewidth=3.0)
    bx.plot(linebx[0], linebx[1], c="tab:green", linewidth=3.0)
    ax.text(80, 1, '$\mathbf{R^2}$ = %0.2f' %(1-r_squaredax), c="tab:red", fontsize=12, fontweight='bold')
    bx.text(10, 1, '$\mathbf{R^2}$ = %0.2f' %(1-r_squaredbx), c="tab:green", fontsize=12, fontweight='bold')
    
    #_, _, r_val, _, _ = scp.stats.linregress(interface_df['targetDistance'], interface_df['cycleLength'])
    #print(r_val**2)
    # Hide the right and top spines
    ax.spines['right'].set_visible(False)
    ax.spines['top'].set_visible(False)
    bx.spines['right'].set_visible(False)
    bx.spines['top'].set_visible(False)

    for axis in ['bottom', 'left']:
        ax.spines[axis].set_linewidth(3.0)
        bx.spines[axis].set_linewidth(3.0)

    # Only show ticks on the left and bottom spines
    ax.yaxis.set_ticks_position('left')
    ax.xaxis.set_ticks_position('bottom')
    bx.yaxis.set_ticks_position('left')
    bx.xaxis.set_ticks_position('bottom')

    # Change the fontsize of tick labels
    ax.tick_params(axis='both', which='major', labelsize=16)
    bx.tick_params(axis='both', which='major', labelsize=16)

    ax.set_xlabel('Distance to Target', fontsize=16)
    ax.set_ylim([0, 50])
    
    bx.set_xlabel('X-Y threshold', fontsize=16)
    bx.set_ylim([0, 50])
    
    if i == 0:
        ax.set_ylabel('Cycle Time', fontsize=16)
        bx.set_ylabel('Cycle Time', fontsize=16)
plt.show()

