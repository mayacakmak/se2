# How it works
This is a pure JS solution for displaying a urdf in a browser. It uses [threejs](https://threejs.org/), a javascript library for rendering 3d models in browsers, and a [URDF Loader](https://github.com/gkjohnson/urdf-loaders) built for threejs to load the URDF and its corresponding 3d models.

Currently, all of the joints in the URDF are being rotated using sine functions.

## TODO:
1. Use a PR2 or Fetch URDF instead.
2. Improve render quality (add textures, better lighting, a floorplane, etc.)

# How to run
While the website itself is pure HTML/JS/CSS, it needs somekind of backed to run. I used the server built into python.

Python 2:
1. `cd` into `only-js`
2. Run `python -m SimpleHTTPServer 8000`
3. Visit http://127.0.0.1:8000/urdf-test.html

Python 3:
1. `cd` into `only-js`
2. Run `python3 -m http.server 8000 --bind 127.0.0.1`
3. Visit http://127.0.0.1:8000/urdf-test.html