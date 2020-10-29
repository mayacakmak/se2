# How it works
Use the Gimball to translate and rotate the target (press `t` and `r` to switch modes)

## Optimization
Optimization is done using fmin and the Nelder-Mead algorithm. The loss function is defined as: `(the euclidean distance between the target and ee) + (the difference in orientation between the target and ee) + (how much the arm moved from the last frame)`

# How to run
While the website itself is pure HTML/JS/CSS, it needs somekind of backed to run. I used the server built into python.

Python 2:
1. `cd` into `2d`
2. Run `python -m SimpleHTTPServer 8000`
3. Visit http://127.0.0.1:8000/fabrik2d.html

Python 3:
1. `cd` into `fabrik`
2. Run `python3 -m http.server 8000 --bind 127.0.0.1`
3. Visit http://127.0.0.1:8000/fabrik2d.html or http://127.0.0.1:8000/optimization.html