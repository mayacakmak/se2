import shlex
from psutil import Popen
import os
from time import sleep
import sys
import traceback

ros_port = sys.argv[1]
ws_port = sys.argv[2]


try:
    # Kill anything using needed ports
    os.system("sudo kill -9 $(sudo lsof -t -i:{})".format(ros_port))
    os.system("sudo kill -9 $(sudo lsof -t -i:{})".format(ws_port))

    os.environ['ROS_MASTER_URI'] = "http://localhost:" + str(ros_port) + '/'

    roscore = Popen(shlex.split('roscore --port ' + str(ros_port)))

    sleep(1)

    # Use the launcher
    #self.pr2_description = Popen(shlex.split('roslaunch pr2_description upload_pr2.launch'))

    # Read a precompiled version from a file
    with open("pr2_description/robots/pr2.urdf.xacro.txt", 'r') as f:
        import rospy
        data = f.read().replace('\n', '')
        rospy.set_param('/robot_description', data)
        del rospy

    # Read urdf using xacro
    # data = " ".join(os.popen("xacro pr2_description/robots/pr2.urdf.xacro").readlines()).replace('\n', '')
    # rospy.set_param('/robot_description', data)

    robot_state_publisher = Popen(shlex.split('rosrun robot_state_publisher robot_state_publisher'))
    #use_gui = Popen(shlex.split('rosparam set use_gui true'))
    #joint_state_publisher = Popen(shlex.split('rosrun joint_state_publisher joint_state_publisher'))
    tf2_web_republisher = Popen(shlex.split('rosrun tf2_web_republisher tf2_web_republisher'))
    rosbridge_server = Popen(shlex.split('roslaunch rosbridge_server rosbridge_websocket.launch port:=' + str(ws_port)))
except Exception:
    print("Caught error:")
    traceback.print_exc()

    roscore.terminate()
    robot_state_publisher.terminate()
    #use_gui.terminate()
    #joint_state_publisher.terminate()
    tf2_web_republisher.terminate()
    rosbridge_server.terminate()