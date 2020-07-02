# How it works
The website is has a flask backend with a HTML/JS/CSS frontend. When the flask server is started, it starts up a pre-defined number of ROS simulation instances. This is done by defining a new master port for ros each time. ros3djs also requires its own port to run. Each ROS instances takes up two consectutive ports (ex. 1340 and 1341). If we were add a gazebo simulation that would also require its own port.
<br><br>
Starting ROS instaces is done using `ros_utils.py` and `start_ros.py`. I am using `psutil` and `Popen` to run bash commands to start ROS nodes from within python.
<br><br>
Whenever a user loads the page, the flask server opens up a websocket connection with them. This is done using socket.io. It allows the code to send the end user the port number that they should connect to, and detect when the user closes the tab with the website and disconnects. The code automatically manages connecting users with simulation instances and disconencting them when the user leaves so that the instance can be used by another user.

## TODO:
Instead of starting all of the instances when the website starts (which can take a lot of time and uses unnecessary resources), the instances should be automatically started when a user visits the website. This would introduce a ~6 second delay when a user visits the website (that is roughly the time it takes to start a new instance). It might be possible to always have one more instance running than is necessary to remove the delay. I need to look into it more.

# How to run

## Installation
### ROS
Using ROS-Melodic install these packages:
1. pr2_description 
2. robot_state_publisher
3. joint_state_publisher 
4. tf2_web_republisher 
5. rosbridge_server 

### Python
Using Python 2 install these libraries:
1. flask
2. flask_socketio

## Running
1. `cd` into the `multiple-ros-instances` directory
2. Run `python app.py` (Make sure that this is running with Python 2)
3. Go to http://127.0.0.1:5000/

By default, when the program is run, it will open up <b>`3`</b> ros instances. This can be changed by increasing `num_instances` in `app.py`. As part of that it will open up three windows with sliders. Each window controls a different ROS instance and each slider controls a different PR2 joint. 
<br><br>
You should be able to load the page (http://127.0.0.1:5000/) in up to three tabs (each tab, counts as a separate user). If you close a tab it should be disconnected from the ROS instance, (this can take several seconds, look in the python console for a "disconnect" print out). If you open the website in another tab, it should automatically be connected to the instance.