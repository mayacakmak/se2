from flask import Flask, request, send_from_directory, render_template
from flask_socketio import SocketIO, emit

from ros_utils import ROSInstanceManager

# Set the project root directory as the static folder
app = Flask(__name__, static_url_path='')
app.config['SECRET_KEY'] = 'secret!' # TODO: Make this an environment variable or load from a file
socketio = SocketIO(app)

num_instances = 3
manager = ROSInstanceManager(num_instances)

# Serve URDFs and 3d Models from pr2_description
@app.route('/pr2_description/<path:path>')
def send_urdf(path):
    return send_from_directory('pr2_description', path)

# Serve javascript libraries
@app.route('/js/<path:path>')
def send_js(path):
    return send_from_directory('js', path)

# Serve the main website page
@app.route('/')
def index():
    return render_template('index.html')

# Detect when a new user connects
@socketio.on('connect', namespace="/test")
def test_connect():
    print('connect', request.sid)

    # Get a ros instace for them from the instance manager
    ws_port = manager.acquireInstance(request.sid)
    
    # Send the port for that instance to the user using socket_io
    emit('start_visualization', {'port': ws_port})

# Detect when an existing user disconnects 
# (note that this happens 5-10 seconds after they actually close the tab)
@socketio.on('disconnect', namespace="/test")
def test_disconnect():
    print('disconnect', request.sid)

    # Release the ROS instace that they were assigned to
    manager.releaseInstance(request.sid)


if __name__ == "__main__":
    app.run()