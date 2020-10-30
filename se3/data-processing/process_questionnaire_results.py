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

color_list = ["tab:blue","tab:orange","tab:green","tab:red","tab:purple","tab:brown","tab:pink","tab:gray","tab:olive","tab:cyan"]

# %%
snapshot_name = "1604043846.2768369-questionnaires"

cycles_df = pd.read_csv(snapshot_name + ".csv", index_col=0)

interfaceIDs = cycles_df.interfaceID.unique()

interface_dfs = {}
for interfaceID in interfaceIDs:
    interface_dfs[interfaceID] = cycles_df[cycles_df["interfaceID"] == interfaceID]

cycles_df.head()

# %%

questionIDs = {
    "Mental Demand": ["section-0-question-0", "section-0-question-1", "section-0-question-2"],
    "Physical Demand": ["section-0-question-3", "section-0-question-4", "section-0-question-5"],
    "Temporal Demand": ["section-0-question-6", "section-0-question-7"],
    "Effort": ["section-0-question-10"],
    "Frustration Level": ["section-0-question-11", "section-0-question-12", "section-0-question-13"]
}

fig = plt.figure()
X = np.arange(len(interfaceIDs))
ax = fig.add_axes([0,0,1,1])

w = 0.15

handles = []

for i, questionID in enumerate(questionIDs):
    #print(i, questionID)
    data = []
    for interfaceID in interfaceIDs:
        data.append(np.average(interface_dfs[interfaceID][questionIDs[questionID]].values.tolist()))
    handles.append(ax.bar(X + w*i, data, color = color_list[i], width = w*0.6, label=questionID))

ax.set_yticks(np.arange(1, 8))
ax.set_ylim([0,8])

ax.set_xticks(X)
ax.set_xticklabels(interfaceIDs)
plt.xticks(rotation=90)

ax.legend(handles=handles)
plt.legend(bbox_to_anchor=(1.05, 1), loc='upper left', borderaxespad=0.)

# %%
questionIDs = {
    "Mental Demand": ["section-0-question-0", "section-0-question-1", "section-0-question-2"],
    "Physical Demand": ["section-0-question-3", "section-0-question-4", "section-0-question-5"],
    "Temporal Demand": ["section-0-question-6", "section-0-question-7"],
    "Effort": ["section-0-question-10"],
    "Frustration Level": ["section-0-question-11", "section-0-question-12", "section-0-question-13"]
}

fig = plt.figure()
X = np.arange(len(questionIDs))
ax = fig.add_axes([0,0,1,1])

w = 0.1

handles = []

for i, interfaceID in enumerate(interfaceIDs):
    data = []
    for questionID in questionIDs:
        data.append(np.average(interface_dfs[interfaceID][questionIDs[questionID]].values.tolist()))
    handles.append(ax.bar(X + w*i, data, color = color_list[i], width = w*0.6, label=interfaceID))

ax.set_yticks(np.arange(1, 8))
ax.set_ylim([0,8])

ax.set_xticks(X)
ax.set_xticklabels(questionIDs)
plt.xticks(rotation=90)

ax.legend(handles=handles)
plt.legend(bbox_to_anchor=(1.05, 1), loc='upper left', borderaxespad=0.)

# %%
fig = plt.figure(figsize=(16,20))
fig.subplots_adjust(hspace=0.5, wspace=0.3)

for i, questionID in enumerate(questionIDs):
    ax = plt.subplot("33"+str(i+1))
    ax.set_title(questionID)

    data = []
    for interfaceID in interfaceIDs:
        data.append(interface_dfs[interfaceID][questionIDs[questionID]].values.flatten())

    ax.boxplot(data, labels=interfaceIDs, showmeans=True, meanline=True)

    ax.set_yticks(np.arange(1, 8))
    ax.set_ylim([0,8])
    plt.xticks(rotation=90)
# %%
