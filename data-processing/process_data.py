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
snapshot_timestamp = 1600407502.12
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
"nOpsxid8GVaWVGyguvNJ48qCvol2", ## Batch #1 ends here (but how come there are only 40ish before this?)
"yIrDZKrcI9ZyNcrF4H2tgSj4iVE3",
"0BPAoSr877bPCxDmD0EztyNROaD2",
"DNj5cg13xHcwGkIFyohU0fZ1K7u2",
"9NiqfLwkg4UH22X9c4bxszZGFUl2",
"i2HlWoPB4BWJ2T2mzllLi2OGJ5K2",
"XTE1E6MhlPe5IOxjefk5BcqYWke2",
"aTPSNAP418UMfV892YIIf0OhjNB3",
"Z2ZplTRAd8YoxIeLsFYaylbtX4h2",
"lY0x0xPXxddg66krC5H9nmKoVjB3",
"i0lH5J577YOZvkdvi54ZIuVO5g63",
"IDZLjdW1SkQrSnAOXBLuMtkynGJ2",
"AkCUwiZIVTeOEmxYZqqFjjDJdtw2",
"lI7KXZXuDJWYuP8ykEVgQ5EXoYY2",
"dK7tCNHvNjUIywancYtXbPBvyCh1",
"1dtBapNzkqOJ5vH6TfDi9LfGpmf2",
"H4ZdMVZcuFeStwyjUufyq0eNiJa2",
"Pjk7M7JWveTOXsaWzZNJ78TQK4m2",
"SJX8B8pi1pYEcb1LSNdjQT5ICrw1",
"4VmoCLqfPYP8tLu3ojuvD2Yyp7n1",
"sKWxFck8oNaFhlZyhrfzbagZ1rd2",
"fDYi6zzi6PWZKJqHqlFkgjgvD9W2",
"K3DabqdJCKZwKflJYUVI8fkJHHB2",
"N2W0GeTOUCZjVJrDtdzNci4bbiD2",
"5GUKZiUq8PbtoAqleKZHlL1yQ6I3",
"p7GDiPrUenOpvapdBGkb1Ht6ZOe2",
"a8tciMQrJuhMtLLZp9hhMsfdjEg2",
"P3fsHwnfB0aIICchs0qWh2n5abB3",
"2sVhSYgqAIR4DwyOOHikVXNLwmE2",
"qMwVeH3ZC0amcOOjh2OLoJOcOwF3",
"pEdRCriJZ7fzZ2JI55YaMvjwQ503",
"CoupVjaX2wgntMiU1CWu4noeeUS2",
"rxk809uzEkflVA2BskxUYknkKqv1",
"VvphcOw6bNfQae8DA5yZrom0MOE2",
"UJEsuZE4dndKwpgKwGr8rUyQ4Xz1",
"3yBXjuj3ZmSKXmmeuvzjUHTfwW52",
"PrwwqSg9sGdOgGSjmYIgke2aHAD3",
"ihqmaJVFYNapL6QXcDLWeQnOwdk1",
"EGvmjs0KWjYQZAva1LkPSkpW1Xx2",
"ZuVhFC4Ou7W7ATH5eDFZcWKdr5g1",
"0x1KZW6hDCcIAXNcXZrO6ca8Q3v1",
"YyKkAVLsCETLQvCzA4yYJE9b4ht1",
"iK03GJhWNThW2uDo6pZnk684GBe2",
"PRKaGTNJtyVnNM9wH4RiBs254uu1",
"AunfrNePWkPeRiHtSA99EiBh7Q43",
"QLrRp6Urt6Ym8wylsb91fGQASzz2",
"BoVKrBvkOUdG5Vv7ZXP3POA7TO02",
"r1dLxh5iBybSiTrTr8Gvzupj9QR2",
"jKsWXj9wBPaBx4lf8Eu54ptdZt92",
"CYntsPPlB2MPy5a1ceN1C0OaUpl2",
"s7N0lpHjqDbxzbiu0PMovUnJcXq1",
"D1lyyxyOAwem7zh9U1z6PAVGwNq2",
"iCFMGtTIhVe5ypcmGQ4qZ8MkTjq2",
"iTfwoINHajgtU3LqG5iDOKVKtpA3",
"CCmv32oarVcGi3qt6dbDXHBCCzX2",
"tuRUp4dzKffM4vIKCyndDw78OQz2",
"pejDJHG7DyeMCoWZAPd4wm53s3s1",
"i11mdlNQWfa5rZPnTx9Z0nxGrWD2",
"HTlUsLj8LGYNlEdtEVdzWtiaiQq2",
"lrJK1ACgGuhvpcRzbHWjLQmmtKz2",
"hpQCCzLfbxU17uCtcTEA8boKsm83",
"RNe8lVy1aaX8U2ITnqvIj8TiVpU2",
"n3IaI2dEulciScGje3nvc0VI9Sg1",
"arXQ3rVEwqVSQqj2LnsfGRKNqCh1",
"WA4UJhPoybOuFXnJQJrE7KR00b53",
"GfiuoLJc3KVBewklK4WX1Lf2Tr22",
"v2DhhrTBK1eBdtdrMLVjQZcMjU02",
"GqJD0eoIhBg7VLK23y02owgppS33",
"if8YpIUYBgZVqeSdgHD2eKcxcnp1",
"Xz6rbXdFqMgYHMnvxfc7KfaadRT2",
"Tl56kkCOvrODlKxcebfceeqvxoM2",
"3fl1ZT8Sb4b74StoYgl334PDVqv2",
"JzFhKQCPWPMVZfEYneBd4og88T72",
"dNawxj8nZCR8ivZO1Yocm4kkfJB3",
"3DGdhJxi6jTZB7hdkj3054OzYST2",
"gkPltHbGKtebLfiFdvisH7xIj5g1",
"MBnJfrS7Gdei7sLW9U1KA6T2Gwg1",
"wAElFNGy4vaC7jbTVe1wAyIrVZB3",
"2g3T3iXiK5ZAzDnfXsw48gz51U13",
"Dcl3rR1XQpOJXOvMZo1fmlAgbJ42",
"Zh6lzldNruYfHhWl32Z21ZwHmZ43",
"bdd3pHsnkyLqU1OehLawNNR6mCL2",
"RUoitXT0YSd9zTOLVOOOxXQ5iRz1",
"5m0cQdS6PwUJb0dPFkDhdEAow5E2",
"AHi9dT39XwW16GsHvsQKlM2RABU2",
"FW3Yuwzp1SYQ49D5xy5r53ewMIg1",
"xgmIBDkrWRa0Y3sSvcAci7UbudC2",
"pqbn9G64UzfuIk62GIpFAFEdN1J2",
"HZwhbfP5r0WNut8XVO4H32n60Bo2",
"bCVoet7eS0beWut8b64Da2VB0Fk1",
"qa6QZa47ncQRKryQU9r9APDxy533",
"RkMTP3i0FnO4TKKGnxgkInzqZZj1",
"H0Awcp4Eosc5s2zMbrc56BWngK33",
"7LpVskhH9xe0OqL6MehVQFVkwd13",
"uI7DUNfga1aOAB9s9uLTqem4wlS2",
"LWAzUclg4OZQvYlQ890gYCtGaGz2",
"IU8vhE2DSoNlAhbbA8tKK5kFLL73",
"jx8NomDFx4TPbvxClJfRJeHxAgy2",
"DSTCtWtSXadSNC8zxkYP4bILNM03",
"xtGgZq7N87SSlx7tneSiISkTqBj1",
"3YQjjraX20SdoiYWmOeRIHOFtdc2",
"tv6YYZoYIPbJ7DA87CHWCWjHrPV2",
"pRy44jh1blXeCsQbssAGmbsIMRS2",
"EdzR0H042xMKjt87BDjVqsDe15G2",
"CFVsA8lkIeNK0HYzF4MsO7swXap1",
"6GmaUe0cwyOlUCONYhkQIvC5NPp2",
"zFBLSaxpiefJ887UIvodBmSnFLh2",
"bHTjtr3sq2gVjPwsaXVqtzMgD7C3",
"jO9X5Pe8i4fL1Nlx9mrhQPgLzy32",
"iRh2gycmKJM44GWOJxXxsPLYSrz1",
"kb18bBD9jfbE6mVAUWd2lGpOc4B3",
"TH5b751VqygGgG0sYEyo71hhiuD2",
"1MWy0rHInTNVRRqBfNIq9T86Qyx2",
"JuYWld9ScBUuutBfe46Jrbj8u5I3"
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

cycles_df['flexibility'] = np.interp(cycles_df['threshXY'], (5, 30), (0, 1)) + np.interp(cycles_df['threshTheta'], (5, 60), (0, 1))

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
    
    interface_df = interface_dfs[interfaceID]#
    ax.scatter(interface_df['cycleLength'], np.abs(interface_df['targetTheta']) + interface_df['targetDistance'], c="tab:blue")
    
    #line = fit_line(interface_df['cycleLength'], np.abs(interface_df['targetTheta']) + interface_df['targetDistance'])
    #ax.plot(line[0], line[1], c="tab:purple")

    ax.set_xlabel('Cycle Time')
    ax.set_ylabel('Distance + Orientation')

#%% [markdown]
### Distance / Time / Flex Correlation

# %%
fig = plt.figure(figsize=(20,20))
fig.subplots_adjust(hspace=0.1, wspace=0.1)

for i, interfaceID in enumerate(interface_dfs):
    ax = plt.subplot("33"+str(i+1))
    ax.set_title(interfaceID)

    interface_df = interface_dfs[interfaceID]
    
    corr_matrix = interface_df[['cycleLength', 'targetDistance', 'flexibility']].corr()
    sns.heatmap(corr_matrix, annot = True, fmt='.2',cmap= 'coolwarm', ax=ax, vmin=-0.5, vmax=0.2)
plt.show()

#%% [markdown]
### Distance vs Target Position Angle

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
plt.show()

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
