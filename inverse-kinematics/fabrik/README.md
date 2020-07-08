# How it works
This is a modified version of the FABRIK algorithm. It allows the user to specifiy not only the position, but also the orientation of the end effector. Scroll up and down to rotate the end effector, move the mouse to move it.

## TODO:
1. Make it 3D
2. Test it with PR2

# How to run
While the website itself is pure HTML/JS/CSS, it needs somekind of backed to run. I used the server built into python.

Python 2:
1. `cd` into `fabrik`
2. Run `python -m SimpleHTTPServer 8000`
3. Visit http://127.0.0.1:8000/fabrik2d.html

Python 3:
1. `cd` into `fabrik`
2. Run `python3 -m http.server 8000 --bind 127.0.0.1`
3. Visit http://127.0.0.1:8000/fabrik2d.html