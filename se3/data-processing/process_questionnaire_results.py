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

plt.rcParams["font.family"] = "Times New Roman"
plt.rcParams["font.size"] = 18
plt.rcParams["axes.labelsize"] = 'medium'

# General
import os
import simplejson as json
import time
import copy

snapshot_name = "se3-10-31-filtered-questionnaires"
color_list = ["tab:blue","tab:orange","tab:green","tab:red","tab:purple","tab:brown","tab:pink","tab:gray","tab:olive","tab:cyan"]
targetplotcolors = ['#ffe500','#ff9405','#ff4791','#007bff','#09bc6b']

questionIDs = {
    "Mental Demand": ["section-0-question-0", "section-0-question-1", "section-0-question-2"],
    "Physical Demand": ["section-0-question-3", "section-0-question-4", "section-0-question-5"],
    "Temporal Demand": ["section-0-question-6", "section-0-question-7"],
    "Effort": ["section-0-question-10"],
    "Frustration Level": ["section-0-question-11", "section-0-question-12", "section-0-question-13"]
}


# section-1-question-11 Flexible targets were easier to reach.
# section-1-question-12 Far away targets were harder to reach.
# section-1-question-13 Targets with large rotation differences were harder to reach.
                          

statementIDs = {
    "..was intuitive.": ["section-1-question-0"],
    "..was easy to learn.": ["section-1-question-1"],
    "..was easy to use once I learned how it works.": ["section-1-question-2"],
    "..allowed efficient control of the object.": ["section-1-question-4"],
    "..was prone to errors.": ["section-1-question-6"],
    "..allowed easy recovery from errors.": ["section-1-question-7"],
    "..was accessible for people using an assistive device to control the cursor.": ["section-1-question-9"]
}


cycles_df = pd.read_csv('data/' + snapshot_name + ".csv", index_col=0)
interfaceIDs = cycles_df.interfaceID.unique()
cycles_df["section-0-question-11"] = 8 - cycles_df["section-0-question-11"]
cycles_df["section-0-question-12"] = 8 - cycles_df["section-0-question-12"]

study2conditions = ['target-click','targetdrag-click','drag-press/release','arrow-press/release','panel-press/release']
study2names = ['TargetRing','TargetAnchor','CircleRing','ArrowRing','Fixed']

interface_dfs = {}
for interfaceID in interfaceIDs:
    interface_dfs[interfaceID] = cycles_df[cycles_df["interfaceID"] == interfaceID]

cycles_df.head()

###############################
fig = plt.figure()
X = np.arange(len(questionIDs))
ax = fig.add_axes([0,0,1,1])

# %%
fig = plt.figure(figsize=(12,3))
fig.subplots_adjust(hspace=0.5, wspace=0.3)

for i, questionID in enumerate(questionIDs):
    # ax = plt.subplot("33"+str(i+1))
    ax = plt.subplot(1,5,i+1)
    ax.set_title(questionID, fontsize=18, fontstyle='italic')

    data = []
    for interfaceID in study2conditions:
        data.append(interface_dfs[interfaceID][questionIDs[questionID]].values.flatten())

    if i == 0:
        ax.boxplot(data, labels=study2names, showmeans=True, meanline=True, vert=False)
        for ytick, color in zip(ax.get_yticklabels(), targetplotcolors):
            ytick.set_color(color)
    else:
        ax.boxplot(data, labels=['','', '', '', ''], showmeans=True, meanline=True, vert=False)

    ax.set_xticks(np.arange(1, 8))
    ax.set_xlim([0,8])
    # plt.xticks(rotation=90)


plt.tight_layout()
plt.savefig('data/study2nasatlx.pdf')


###############################
fig = plt.figure()
X = np.arange(len(questionIDs))
ax = fig.add_axes([0,0,1,1])

# %%
fig = plt.figure(figsize=(12,6))
fig.subplots_adjust(hspace=0.5, wspace=0.3)

for i, questionID in enumerate(statementIDs):
    # ax = plt.subplot("33"+str(i+1))
    ax = plt.subplot(2,5,i+1)
    ax.set_title(questionID, fontsize=10, fontstyle='italic')

    data = []
    for interfaceID in study2conditions:
        values = interface_dfs[interfaceID][statementIDs[questionID]].values.flatten()
        values[values=='Strongly agree'] = 5
        values[values=='Somewhat agree'] = 4
        values[values=='Neither agree/nor disagree'] = 3
        values[values=='Somewhat disagree'] = 2
        values[values=='Strongly disagree'] = 1
        data.append(values)

    if i == 0:
        ax.boxplot(data, labels=study2names, showmeans=True, meanline=True, vert=False)
        for ytick, color in zip(ax.get_yticklabels(), targetplotcolors):
            ytick.set_color(color)
    else:
        ax.boxplot(data, labels=['','', '', '', ''], showmeans=True, meanline=True, vert=False)

    ax.set_xticks(np.arange(1, 8))
    ax.set_xlim([0,8])
    # plt.xticks(rotation=90)


plt.tight_layout()
plt.savefig('data/study2statements.pdf')


# w = 0.1
# handles = []
# for i, interfaceID in enumerate(study2conditions):
#     data = []
#     for questionID in questionIDs:
#         data.append(np.average(interface_dfs[interfaceID][questionIDs[questionID]].values.tolist()))
#     handles.append(ax.bar(X + w*i, data, color = color_list[i], width = w*0.6, label=interfaceID))

# ax.set_yticks(np.arange(1, 8))
# ax.set_ylim([0,8])
# ax.set_xticks(X)
# ax.set_xticklabels(questionIDs)
# ax.legend(handles=handles)
# plt.legend(bbox_to_anchor=(1.05, 1), loc='upper left', borderaxespad=0.)


# %%
# fig = plt.figure()
# X = np.arange(len(interfaceIDs))
# ax = fig.add_axes([0,0,1,1])
# w = 0.15
# handles = []
# for i, questionID in enumerate(questionIDs):
#     #print(i, questionID)
#     data = []
#     for interfaceID in interfaceIDs:
#         data.append(np.average(interface_dfs[interfaceID][questionIDs[questionID]].values.tolist()))
#     handles.append(ax.bar(X + w*i, data, color = color_list[i], width = w*0.6, label=questionID))
# ax.set_yticks(np.arange(1, 8))
# ax.set_ylim([0,8])
# ax.set_xticks(X)
# ax.set_xticklabels(interfaceIDs)
# plt.xticks(rotation=90)
# ax.legend(handles=handles)
# plt.legend(bbox_to_anchor=(1.05, 1), loc='upper left', borderaxespad=0.)
