# %% [markdown]
## Imports

# %%
# Data Processing
import pandas as pd
import matplotlib.pyplot as plt
plt.rcParams["font.family"] = "Times New Roman"
plt.rcParams["font.size"] = 12
plt.rcParams["axes.labelsize"] = 'x-large'

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

# from process_data import interface_dfs


# targetbarclicks = ['panel.click','arrow.click','drag.click','targetdrag.click','target.click']
# targetbarprs = ['panel.press/release','arrow.press/release','drag.press/release','targetdrag.press/release', 'targetdrag.press/release']
study2conditions = ['panel-press/release','arrow-press/release','drag-press/release','targetdrag-click','target-click']
study2types = ['P/R','P/R','P/R','Click','Click']

#targetbarnames = ['arrow.click','drag.click','panel.click','target.click','targetdrag.click','arrow.p/r','drag.p/r','panel.p/r','targetdrag.p/r']
targetplotnames = ['Fixed','ArrowRing','CircleRing','TargetAnchor','TargetRing']
targetplotcolors = ['#ffe500','#ff9405','#ff4791','#007bff','#09bc6b']
targetplotcolorslight = ['#ffecaa','#ffb757','#ff8dbb','#64afff','#00fd8b']
targetplotcolorsdark = ['#fff2c3','#ffdfb4','#ffc7de','#bad8f7','#bcffe0']

interfaceIDs = ['arrow-click','drag-click','panel-click','target-click','targetdrag-click','arrow-press/release','drag-press/release','panel-press/release','targetdrag-press/release']


def plot_everything():
    # interfaceIDs = ['arrow.click','drag.click','panel.click','target.click','targetdrag.click','arrow.press/release','drag.press/release','panel.press/release','targetdrag.press/release']
    cycles_df = pd.read_csv("data/se3-10-31-filtered-cycles.csv", skiprows = 0)

    print(cycles_df.columns)
    # print(cycles_df.head())
    uids = cycles_df["uid"].unique()

    user_dfs = {}
    user_data_columns = ["uid", "interfaceID", "numClicks", "draggingDuration", 'cycleLength',  'resetIKNum', 'topViewDuration', 'sideViewDuration',
       'frontViewDuration', 'numViewSwitches']
    user_data = []
    for uid in uids:
        user_df = cycles_df[cycles_df["uid"] == uid]
        interface_id = user_df["interfaceID"].unique()[0]
        user_data.append([uid, interface_id, np.mean(user_df['numClicks']), 
            np.mean(user_df['draggingDuration']), np.mean(user_df['cycleLength']),
            np.mean(user_df['resetIKNum']), np.mean(user_df['topViewDuration']),
            np.mean(user_df['sideViewDuration']), np.mean(user_df['frontViewDuration']),
            np.mean(user_df['numViewSwitches'])
            ]);
    user_dfs = pd.DataFrame(user_data, columns=user_data_columns)

    interface_dfs = {}
    for interfaceID in interfaceIDs:
        interface_dfs[interfaceID] = user_dfs[user_dfs["interfaceID"] == interfaceID]

    all_interface_dfs = {}
    for interfaceID in interfaceIDs:
        all_interface_dfs[interfaceID] = cycles_df[cycles_df["interfaceID"] == interfaceID]

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
    ## Time stats per interface

    plot_box_chart(interface_dfs, 'cycleLength', 'Task completion time (sec)', 100)
    plot_box_chart(interface_dfs, 'numClicks', 'Number of clicks', 80, has_labels=False)
    plot_bar_chart(interface_dfs, 'resetIKNum', 'Number of resets', 4)
    plot_bar_chart(interface_dfs, 'numViewSwitches', 'Number of view switches', 8)
    plot_bar_chart(interface_dfs, 'draggingDuration', 'Drag duration (sec)', 100)

    plot_stacked_bar(interface_dfs)
    # plot_scatter(all_interface_dfs)

def plot_bar_chart(interface_dfs, label, x_label, x_lim, has_labels=True):
    # %%
    if has_labels:
        fig = plt.figure(figsize=(10,4))
    else:
        fig = plt.figure(figsize=(8,4))

    fig.subplots_adjust(hspace=0.6, wspace=0.3)
    ax = fig.add_subplot(1,1,1)

    means = []
    errors = []

    for i in np.arange(len(study2conditions)):
        interface_df = interface_dfs[study2conditions[i]]        
        means.append(np.mean(interface_df[label]))
        errors.append(np.std(interface_df[label]))

    ax.grid(color='gray', linestyle='-.', linewidth=1, axis='x', which='major', zorder=0)

    y_pos = np.arange(len(targetplotnames))
    width = 0.9
    # rects1 = ax.barh(y_pos - width/2, means_prs, width, xerr=errors_prs, 
        # alpha=1.0, color=targetplotcolorslight, ecolor="gray", capsize=16, zorder=2)
    rects = ax.barh(y_pos, means, width, xerr=errors, 
        alpha=1.0, color=targetplotcolors, ecolor="gray", capsize=16, zorder=2)
    ax.set_xlabel(x_label,fontsize=24, fontstyle='italic')
    ax.set_yticks(y_pos)

    if has_labels:
        ax.set_yticklabels(targetplotnames)
    else:
        ax.set_yticklabels(['','','','',''])

    #ax.set_title('Task Completion Time', fontsize=24, fontweight='bold')
    ax.spines['right'].set_visible(False)
    ax.spines['top'].set_visible(False)
    ax.spines['bottom'].set_linewidth(2.0)
    ax.spines['left'].set_linewidth(2.0)
    ax.yaxis.set_ticks_position('left')
    ax.xaxis.set_ticks_position('bottom')
    ax.tick_params(axis='both', which='major', labelsize=24)
    ax.set_xlim([0, x_lim])
    #plt.xticks(rotation=45)
    ax.invert_yaxis()

    # for ytick, color in zip(ax.get_yticklabels(), targetplotcolors):
        # ytick.set_color(color)

    for i in np.arange(len(rects)):
        ax.text(0.1, rects[i].get_y() + 0.64, '$\it{'+study2types[i]+'}$', c="white", fontsize=22, fontfamily="Times New Roman")

    plt.tight_layout()
    plt.savefig('data/study2' + label + '.pdf')
    # plt.show()

def plot_box_chart(interface_dfs, label, x_label, x_lim, has_labels=True):
    # %%
    if has_labels:
        fig = plt.figure(figsize=(10,4))
    else:
        fig = plt.figure(figsize=(8,4))

    fig.subplots_adjust(hspace=0.6, wspace=0.3)
    ax = fig.add_subplot(1,1,1)

    interface_data_combined = []

    for i in np.arange(len(study2conditions)):
        interface_df = interface_dfs[study2conditions[i]]

        interface_data_combined.append(interface_df[label])

    flierprops = {'marker':'.', 'markerfacecolor':'none', 'markersize':10,
                  'linestyle':'none', 'markeredgecolor':'gray'}

    width = 0.6
    bplot = ax.boxplot(interface_data_combined, 0, '.', 0, patch_artist=True, widths=width, flierprops=flierprops) # Setting patch_artist = True is requried to set the background color of the boxes: https://stackoverflow.com/a/28742262

    for patch, color in zip(bplot['boxes'], targetplotcolors):
        patch.set(color="gray")
        patch.set_facecolor(color)

    for whisker in bplot['whiskers']:
        whisker.set(color="gray")
    
    for cap in bplot['caps']: 
        cap.set(color ='gray')
    
    for median in bplot['medians']: 
        median.set(color='white')
    
    y_pos = np.arange(len(targetplotnames)) + 0.875
    
    ax.grid(color='gray', linestyle='-.', linewidth=1, axis='x', which='major', zorder=0)
    ax.spines['right'].set_visible(False)
    ax.spines['top'].set_visible(False)
    ax.spines['bottom'].set_linewidth(2.0)
    ax.spines['left'].set_linewidth(2.0)

    ax.yaxis.set_ticks_position('left')
    ax.xaxis.set_ticks_position('bottom')
    ax.tick_params(axis='both', which='major', labelsize=24)
    ax.set_xlim([0, 100])
    #plt.xticks(rotation=45)
    # ax.set_ylabel('Interface',fontsize=24)
    ax.set_xlabel(x_label,fontsize=24, fontstyle='italic')
    ax.set_yticks(y_pos)
    if has_labels:
        ax.set_yticklabels(targetplotnames)
    else:
        ax.set_yticklabels(['','','','',''])
    #ax.set_title('Task Completion Time', fontsize=24, fontweight='bold')
    ax.invert_yaxis()

    for i in np.arange(len(bplot['boxes'])):
        ax.text(-0.1, i + 1.5, '$\it{' + study2types[i] + '}$', c="black", fontsize=15, fontfamily="Times New Roman", zorder = 0, ha='right')

    plt.tight_layout()
    plt.savefig('data/study2' + label + '.pdf')
    # plt.show()


views = ["Top view", "Side view", "Front view"]

def plot_stacked_bar(interface_dfs):

    means_top = []
    means_side = []
    means_front = []


    for i in np.arange(len(study2conditions)):
        interface_df = interface_dfs[study2conditions[i]]        
        means_top.append(np.mean(interface_df['topViewDuration']))
        means_side.append(np.mean(interface_df['sideViewDuration']))
        means_front.append(np.mean(interface_df['frontViewDuration']))

    totals = [i+j+k for i,j,k in zip(means_top, means_side, means_front)]
    percent_top = [i / j * 100 for i,j in zip(means_top, totals)]
    percent_side = [i / j * 100 for i,j in zip(means_side, totals)]
    percent_front = [i / j * 100 for i,j in zip(means_front, totals)]
    bottom_front = [i+j for i,j in zip(percent_top, percent_side)]

    # %%
    fig = plt.figure(figsize=(16,4))
    fig.subplots_adjust(hspace=0.6, wspace=0.3)
    ax = fig.add_subplot(1,1,1)

    means = []
    errors = []


    ax.grid(color='gray', linestyle='-.', linewidth=1, axis='x', which='major', zorder=0)

    y_pos = np.arange(len(targetplotnames))
    width = 0.8
    # rects1 = ax.barh(y_pos - width/2, means_prs, width, xerr=errors_prs, 
        # alpha=1.0, color=targetplotcolorslight, ecolor="gray", capsize=16, zorder=2)
    rects = ax.barh(y_pos, percent_top, width, 
        alpha=1.0, color='#DDDDDD', ecolor="black", capsize=16, zorder=2, edgecolor='gray')

    rects2 = ax.barh(y_pos, percent_side, width, left=percent_top,
        alpha=1.0, color='#555555', ecolor="black", capsize=16, zorder=2, edgecolor='gray')

    rects3 = ax.barh(y_pos, percent_front, width, left=bottom_front,
        alpha=1.0, color='#999999', ecolor="black", capsize=16, zorder=2, edgecolor='gray')


    
    ax.set_xlabel('% time spent in view',fontsize=24, fontstyle='italic')
    ax.set_yticks(y_pos)
    ax.set_yticklabels(targetplotnames)
    #ax.set_title('Task Completion Time', fontsize=24, fontweight='bold')
    ax.spines['right'].set_visible(False)
    ax.spines['top'].set_visible(False)
    ax.spines['bottom'].set_linewidth(2.0)
    ax.spines['left'].set_linewidth(2.0)
    ax.yaxis.set_ticks_position('left')
    ax.xaxis.set_ticks_position('bottom')
    ax.tick_params(axis='both', which='major', labelsize=24)
    ax.set_xlim([0, 100])
    #plt.xticks(rotation=45)
    ax.invert_yaxis()

    for ytick, color in zip(ax.get_yticklabels(), targetplotcolors):
        ytick.set_color(color)

    for i in np.arange(len(rects)):
        ax.text(1, rects[i].get_y() + 0.64, '$\it{Top}$', c="black", fontsize=22, fontfamily="Times New Roman")
        ax.text(percent_top[i]+1, rects2[i].get_y() + 0.64, '$\it{Side}$', c="white", fontsize=22, fontfamily="Times New Roman")
        ax.text(bottom_front[i]+1, rects3[i].get_y() + 0.64, '$\it{Front}$', c="black", fontsize=22, fontfamily="Times New Roman")

    plt.tight_layout()
    plt.savefig('data/study2views.pdf')
    # plt.show()    


if __name__ == "__main__":
    plot_everything()



