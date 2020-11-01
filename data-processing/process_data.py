# %% [markdown]
## Imports

# %%
# Data Processing
import pandas as pd
import matplotlib.pyplot as plt
from matplotlib.collections import LineCollection
from scipy import interpolate
import numpy as np
import seaborn as sns
from sklearn.preprocessing import normalize


# General
import os
import simplejson as json
import time
import copy


# %% [markdown]
## Firebase snapshot and other inputs

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
# %%
snapshot_name = "data/se2-10-29-filtered-cycles"

cycles_df = pd.read_csv(snapshot_name+".csv", index_col=0)
interfaceIDs = cycles_df.interfaceID.unique()

cycles_df['targetPosTheta'] = np.degrees(np.arccos((cycles_df['targetX'] - 357)/cycles_df['targetDistance']))

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
    ax.scatter(interface_df['targetDistance'], interface_df['cycleLength'], c="tab:blue")
    
    #line = fit_line(interface_df['cycleLength'], interface_df['targetDistance'])
    #ax.plot(line[0], line[1], c="tab:purple")

    ax.set_ylabel('Cycle Time')
    ax.set_xlabel('Distance to Target')

    ax.set_ylim([0, 50])


# %% [markdown]
### Orientation vs Time

# %%
fig = plt.figure(figsize=(16,10))
fig.subplots_adjust(hspace=0.6, wspace=0.3)

for i, interfaceID in enumerate(interface_dfs):
    ax = plt.subplot("33"+str(i+1))
    ax.set_title(interfaceID)
    
    interface_df = interface_dfs[interfaceID]
    ax.scatter(np.abs(interface_df['targetTheta']), interface_df['cycleLength'], c="tab:blue")
    
    #line = fit_line(interface_df['cycleLength'], np.abs(interface_df['targetTheta']))
    #ax.plot(line[0], line[1], c="tab:purple")

    ax.set_ylabel('Cycle Time')
    ax.set_xlabel('Target Rotation')

    ax.set_ylim([0, 50])

# %% [markdown]
### Distance + Orientation vs Time

# %%

fig = plt.figure(figsize=(16,10))
fig.subplots_adjust(hspace=0.6, wspace=0.3)

for i, interfaceID in enumerate(interface_dfs):
    ax = plt.subplot("33"+str(i+1))
    ax.set_title(interfaceID)
    
    interface_df = interface_dfs[interfaceID]#
    ax.scatter(np.abs(interface_df['targetTheta']) + interface_df['targetDistance'], interface_df['cycleLength'], c="tab:blue")
    
    #line = fit_line(interface_df['cycleLength'], np.abs(interface_df['targetTheta']) + interface_df['targetDistance'])
    #ax.plot(line[0], line[1], c="tab:purple")

    ax.set_ylabel('Cycle Time')
    ax.set_xlabel('Distance + Orientation')

    ax.set_ylim([0, 50])

#%% [markdown]
### Distance / Time / Flex Correlation

# %%
fig = plt.figure(figsize=(20,20))
fig.subplots_adjust(hspace=0.1, wspace=0.1)

for i, interfaceID in enumerate(interface_dfs):
    ax = plt.subplot("33"+str(i+1))
    ax.set_title(interfaceID)

    interface_df = interface_dfs[interfaceID]
    
    corr_matrix = interface_df[['cycleLength', 'targetDistance', 'threshXY', 'threshTheta']].corr()
    sns.heatmap(corr_matrix, annot = True, fmt='.2',cmap= 'coolwarm', ax=ax, vmin=-0.3, vmax=0.3)
plt.show()

#%% [markdown]
### Cycle Time vs Target Position Angle
# Target Position Angle is the angle made between the location of the target and the center.
# A target all straight right would have an angel of 0, touching the top would be 90, etc.

# %%
fig = plt.figure(figsize=(16,10))
fig.subplots_adjust(hspace=0.6, wspace=0.3)

for i, interfaceID in enumerate(interface_dfs):
    ax = plt.subplot("33"+str(i+1))
    ax.set_title(interfaceID)

    interface_df = interface_dfs[interfaceID]
    ax.scatter(interface_df['targetPosTheta'], interface_df['cycleLength'], c="tab:blue")
    
    #line = fit_line(interface_df['cycleLength'], np.abs(interface_df['targetTheta']) + interface_df['targetDistance'])
    #ax.plot(line[0], line[1], c="tab:purple")

    ax.set_xlabel('Target Position Angle')
    ax.set_ylabel('Cycle Time')

    
    ax.set_ylim([0, 50])
plt.show()

#%% [markdown]
## Standard Deviation across Users across Interfaces

# %%

fig = plt.figure(figsize=(16,10))
fig.subplots_adjust(hspace=0.6, wspace=0.3)

for i, interfaceID in enumerate(interface_dfs):
    # ax = plt.subplot("33"+str(i+1))
    # ax.set_title(interfaceID)
    
    stdevs = []


    interface_df = interface_dfs[interfaceID]
    print(interfaceID)
    print("Standard Deviation:",np.std(interface_df['cycleLength']))
    # for uid in interface_df.uid.unique():
    #     stdevs.append(np.std(interface_df[interface_df.uid == uid].cycleLength))

    #ax.hist(stdevs, color="tab:blue")
    
    #ax.text(0.5, 0.8, f"Overall StDev: {np.round(np.std(interface_df['cycleLength']), 2)}", horizontalalignment='center', verticalalignment='center', transform = ax.transAxes)

#     ax.set_xlabel('Standard Deviation')
#     ax.set_ylabel('Users')

    
#     ax.set_ylim([0, 20])
#     ax.set_xlim([0, 130])
# plt.show()

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
        numbered_cycle.append(0)
        cycle_width.append(0)
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

    
