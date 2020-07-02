from time import sleep
import shlex
from psutil import Popen
import os
import threading

class ROSInstanceManager:
    def __init__(self, num_instances, starting_port=1337):
        self.instances = []
        self.num_instances = num_instances
        self.starting_port = starting_port
        self._lock = threading.Lock()

        for i in range(0, num_instances*2, 2):
            # Kill anything using needed ports
            os.system("sudo kill -9 $(sudo lsof -t -i:{})".format(self.starting_port+i))
            os.system("sudo kill -9 $(sudo lsof -t -i:{})".format(self.starting_port+i+1))

            # Create instances
            self.instances.append(ROSWebVis(self.starting_port+i, self.starting_port+i+1, None))
    
    def acquireInstance(self, uid):
        with self._lock:
            # Check if this user is already assigned to an instance, if so return the port for that one
            for instance in self.instances:
                if instance.uid == uid:
                    return instance.ws_port

            # Assign this user to an instance return its port
            for instance in self.instances:
                if not instance.uid:
                    instance.uid = uid
                    return instance.ws_port
    
    def releaseInstance(self, uid):
        with self._lock:
            for instance in self.instances:
                if instance.uid == uid:
                    instance.uid = None
                    break
    
    def shutdown(self):
        print("\n")

class ROSWebVis:
    def __init__(self, ros_port, ws_port, uid):
        self.ros_port = ros_port
        self.ws_port = ws_port
        self.uid = uid

        self.vis = Popen(shlex.split('python start_ros.py {} {}'.format(ros_port, ws_port)))
    
    def terminate(self):
        self.vis.terminate()

if __name__ == "__main__":
    user1 = ROSWebVis(1337, 1338, "user1")
    sleep(5)
    user2 = ROSWebVis(1339, 1340, "user2")

    sleep(20)

    user1.terminate()
    user2.terminate()