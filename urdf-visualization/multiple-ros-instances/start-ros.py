import shlex
from psutil import Popen
import os
from time import sleep
import rospy

class ROSWebVis:
    def __init__(self, port, uid):
        self.port = port
        self.uid = uid

        os.environ['ROS_MASTER_URI'] = "http://localhost:" + str(self.port) + '/'

        self.roscore = Popen(shlex.split('roscore --port ' + str(self.port)))

        sleep(1)

        #self.pr2_description = Popen(shlex.split('roslaunch pr2_description upload_pr2.launch'))
        #with open("pr2_description/robots/pr2.urdf.xacro", 'r') as f:
        #    data = f.read().replace('\n', '')
        #    rospy.set_param('/robot_description', data)
        data = " ".join(os.popen("xacro pr2_description/robots/pr2.urdf.xacro").readlines()).replace('\n', '')
        rospy.set_param('/robot_description', data)
        
        self.robot_state_publisher = Popen(shlex.split('rosrun robot_state_publisher robot_state_publisher'))
        self.use_gui = Popen(shlex.split('rosparam set use_gui true'))
        self.joint_state_publisher = Popen(shlex.split('rosrun joint_state_publisher joint_state_publisher'))
        self.tf2_web_republisher = Popen(shlex.split('rosrun tf2_web_republisher tf2_web_republisher'))
        self.rosbridge_server = Popen(shlex.split('roslaunch rosbridge_server rosbridge_websocket.launch'))
    
    def terminate(self):
        #self.pr2_description_process.stop()
        self.robot_state_publisher.terminate()
        self.joint_state_publisher.terminate()
        self.tf2_web_republisher.terminate()
        self.rosbridge_server.terminate()
        self.roscore.terminate()

if __name__ == "__main__":
    user1 = ROSWebVis(1337, 1)

    sleep(20)

    user1.terminate()