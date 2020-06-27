from flask import Flask, request, send_from_directory, render_template
from flask_socketio import SocketIO, emit

from ros_utils import ROSInstanceManager

# set the project root directory as the static folder, you can set others.
app = Flask(__name__, static_url_path='')
app.config['SECRET_KEY'] = 'secret!'
socketio = SocketIO(app)

manager = ROSInstanceManager(3)

@app.route('/pr2_description/<path:path>')
def send_urdf(path):
    return send_from_directory('pr2_description', path)

@app.route('/js/<path:path>')
def send_js(path):
    return send_from_directory('js', path)


@app.route('/')
def index():
    return render_template('index.html')


@socketio.on('connect', namespace="/test")
def test_connect():
    print('connect', request.sid)
    ws_port = manager.acquireInstance(request.sid)
    emit('start_visualization', {'port': ws_port})

@socketio.on('disconnect', namespace="/test")
def test_disconnect():
    print('disconnect', request.sid)
    manager.releaseInstance(request.sid)


if __name__ == "__main__":
    app.run()