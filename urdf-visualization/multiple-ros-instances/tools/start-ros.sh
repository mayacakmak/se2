#!/bin/bash

# Convert tif to png
# find -name *.tif | while read f; do echo "Converting $f"; convert "$f"  "${f%.*}".png; done
# ALso need to go into the .dae files and change all the .tiffs to .pngs
# https://stackoverflow.com/questions/7450324/replace-a-string-with-another-string-in-all-files-below-my-current-dir

gnome-terminal -e

source /opt/ros/melodic/setup.bash
source ~/.bashrc

WAIT_TIME=1.5

killall -9 rosmaster; roscore &
sleep $WAIT_TIME; ./load_urdf.sh &
sleep $WAIT_TIME; rosrun robot_state_publisher robot_state_publisher &
sleep $WAIT_TIME; rosparam set use_gui true &
sleep $WAIT_TIME; rosrun joint_state_publisher joint_state_publisher &
sleep $WAIT_TIME; rosrun tf2_web_republisher tf2_web_republisher &
sleep $WAIT_TIME; roslaunch rosbridge_server rosbridge_websocket.launch