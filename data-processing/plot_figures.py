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
targetbarclicks = ['panel-click','arrow-click','drag-click','targetdrag-click','target-click']
targetbarprs = ['panel-press/release','arrow-press/release','drag-press/release','targetdrag-press/release', 'targetdrag-press/release']

#targetbarnames = ['arrow.click','drag.click','panel.click','target.click','targetdrag.click','arrow.p/r','drag.p/r','panel.p/r','targetdrag.p/r']
targetplotnames = ['Fixed','ArrowRing','CircleRing','TargetAnchor','TargetRing']
targetplotcolors = ['#ffe500','#ff9405','#ff4791','#007bff','#00c36b']
targetplotcolorslight = ['#ffe486','#ffb757','#ff8dbb','#64afff','#00fd8b']

interfaceIDs = ['arrow-click','drag-click','panel-click','target-click','targetdrag-click','arrow-press/release','drag-press/release','panel-press/release','targetdrag-press/release']


def plot_everything():
    # interfaceIDs = ['arrow.click','drag.click','panel.click','target.click','targetdrag.click','arrow.press/release','drag.press/release','panel.press/release','targetdrag.press/release']
    cycles_df = pd.read_csv("data/se2-10-29-filtered-cycles.csv", skiprows = 0)

    print(cycles_df.columns)
    # print(cycles_df.head())
    uids = cycles_df["uid"].unique()

    user_dfs = {}
    user_data_columns = ["uid", "interfaceID", "numClicks", "draggingDuration", 'cycleLength']
    user_data = []
    for uid in uids:
        user_df = cycles_df[cycles_df["uid"] == uid]
        interface_id = user_df["interfaceID"].unique()[0]
        user_data.append([uid, interface_id, np.mean(user_df['numClicks']), np.mean(user_df['draggingDuration']), np.mean(user_df['cycleLength'])]);
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

    plot_bar_chart(interface_dfs, 'cycleLength', 'Task completion time (sec)')
    plot_bar_chart(interface_dfs, 'numClicks', 'Number of clicks')
    plot_bar_chart(interface_dfs, 'draggingDuration', 'Drag duration (sec)')

    plot_scatter(all_interface_dfs)


def plot_scatter(interface_dfs):
    # %% [markdown]
    ## Time vs. Distance (Euclidean, Orientation, and Combined)
    ### Euclidean Distance vs Time

    # %%
    fig = plt.figure(figsize=(16,8))
    fig.subplots_adjust(hspace=0.6, wspace=0.3)
    targetplots = ['panel-click','arrow-click','drag-click','targetdrag-click','target-click']
    interface_dftargets = [interface_dfs[idx] for idx in targetplots]
    
    for i, interface_df in enumerate(interface_dftargets):
        ax = fig.add_subplot(2,5,str(i+1))
        bx = fig.add_subplot(2,5,str(i+6))
        ax.set_title(targetplotnames[i], fontsize=24)
        #bx.set_title(targetplotnames[i], c=targetplotcolors[i], fontsize=16)

        ax.scatter(interface_df['targetDistance'], interface_df['cycleLength'], c=targetplotcolors[i], marker=".")
        bx.scatter(interface_df['threshXY'], interface_df['cycleLength'], c=targetplotcolors[i], marker=".")
        lineax = fit_line(interface_df['targetDistance'], interface_df['cycleLength'])
        linebx = fit_line(interface_df['threshXY'], interface_df['cycleLength'])
        r_squaredax = lineax[2]
        r_squaredbx = linebx[2]

        ax.plot(lineax[0], lineax[1], c="black", linewidth=2.0)
        bx.plot(linebx[0], linebx[1], c="black", linewidth=2.0)
        # ax.text(80, 30, '$\mathbf{R^2}$ = %0.2f' %(1-r_squaredax), c="black", fontsize=20)
        # bx.text(10, 30, '$\mathbf{R^2}$ = %0.2f' %(1-r_squaredbx), c="black", fontsize=20)
        
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
        ax.tick_params(axis='both', which='major', labelsize=20)
        bx.tick_params(axis='both', which='major', labelsize=20)

        ax.set_xlabel('Target distance', fontsize=24, fontstyle='italic')
        ax.set_ylim([0, 40])
        
        bx.set_xlabel('Target size', fontsize=24, fontstyle='italic')
        bx.set_ylim([0, 40])
        
        if i == 0:
            ax.set_ylabel('Time (sec)', fontsize=24, fontstyle='italic')
            bx.set_ylabel('Time (sec)', fontsize=24, fontstyle='italic')
    

    plt.tight_layout()
    plt.savefig('data/scatter.pdf')
    # plt.show()




def plot_bar_chart(interface_dfs, label, y_label):
    # %%
    fig = plt.figure(figsize=(10,8))
    fig.subplots_adjust(hspace=0.6, wspace=0.3)
    ax = fig.add_subplot(1,1,1)

    means_clicks = []
    means_prs = []

    errors_prs = []
    errors_clicks = []

    for i in np.arange(len(targetbarclicks)):
        interface_dfclicks = interface_dfs[targetbarclicks[i]]
        interface_dfprs = interface_dfs[targetbarprs[i]]
        
        means_clicks.append(np.mean(interface_dfclicks[label]))
        means_prs.append(np.mean(interface_dfprs[label]))
        
        errors_clicks.append(np.std(interface_dfclicks[label]))
        errors_prs.append(np.std(interface_dfprs[label]))

        #print("Mean:", np.mean(interface_dfclicks['cycleLength']))
        #print("Standard Deviation:",np.std(interface_dfclicks['cycleLength']))
        #print("Min:",np.min(interface_dfclicks['cycleLength']))
        #print("Max:",np.max(interface_dfclicks['cycleLength']))
        #print()

    means_prs[4] = 0
    errors_prs[4] = 0

    ax.grid(color='gray', linestyle='-.', linewidth=1, axis='x', which='major', zorder=0)

    y_pos = np.arange(len(targetplotnames))
    width = 0.45
    rects1 = ax.barh(y_pos - width/2, means_prs, width, xerr=errors_prs, 
        alpha=1.0, color=targetplotcolorslight, ecolor="gray", capsize=16, zorder=2)
    rects2 = ax.barh(y_pos + width/2, means_clicks, width, xerr=errors_clicks, 
        alpha=1.0, color=targetplotcolors, ecolor="gray", capsize=16, zorder=2)
    # ax.set_ylabel('Interface',fontsize=24)
    ax.set_xlabel(y_label,fontsize=24, fontstyle='italic')
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
    ax.set_xlim([0, 25])
    #plt.xticks(rotation=45)
    ax.invert_yaxis()

    # for ytick, color in zip(ax.get_yticklabels(), targetplotcolors):
        # ytick.set_color(color)

    for rect1 in rects1[0:4]:
        ax.text(0.1, rect1.get_y() + 0.32, '$\it{P/R}$', c="white", fontsize=22, fontfamily="Times New Roman")

    for rect2 in rects2:
        ax.text(0.1, rect2.get_y() + 0.32, '$\it{Click}$', c="white", fontsize=22, fontfamily="Times New Roman")

    plt.tight_layout()
    plt.savefig('data/' + label + '.pdf')
    # plt.show()





# %%
# Custom tools

def fit_line(x, y):
    '''
    Fits a line to an input set of points
    Returns a tuple of the x and y components of the line
    Adapted from: https://stackoverflow.com/a/31800660/6454085
    '''
    #correlation_matrix = np.corrcoef(x,y)
    #correlation_xy = correlation_matrix[0,1]
    #r_squared = correlation_xy**2

    y_hat = np.poly1d(np.polyfit(x, y, 1))(x)
    y_bar =np.sum(y)/len(y)

    ssres = np.sum((y_hat - y)**2)
    sstot = np.sum((y - y_bar)**2)

    r_squared = ssres / sstot

    return x, y_hat, r_squared

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


if __name__ == "__main__":
    plot_everything()

