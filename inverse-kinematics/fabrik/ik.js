DEG_TO_RAD = 180 / Math.PI;

class Position {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    _add(p) {
        this.x += p.x;
        this.y += p.y;
    }

    static add(a, b) {
        return new Position(a.x + b.x, a.y + b.y);
    }

    _subtract(p) {
        this.x -= p.x;
        this.y -= p.y;
    }


    static subtract(a, b) {
        return new Position(a.x - b.x, a.y - b.y);
    }

    _pow(p) {
        this.x = Math.pow(this.x, p);
        this.y = Math.pow(this.y, p);
    }

    static pow(a, p) {
        return new Position(Math.pow(a.x, p), Math.pow(a.y, p));
    }

    static divide(a, d) {
        return new Position(a.x / d, a.y / d)
    }

    _multiply(m) {
        this.x *= m;
        this.y *= m;
    }

    static getDistance(a, b) {
        var diff = Position.subtract(a, b);
        diff._pow(2);
        return Math.sqrt(diff.x + diff.y);
    }

    static makeUnit(a) {
        var magnitude = Math.sqrt(Position.pow(a, 2).x + Position.pow(a, 2).y);
        return Position.divide(a, magnitude)
    }
}

class Bone {
    constructor(start, end, limits = undefined) {
        this.start = start;
        this.end = end;
        this.limits = limits;
    }

    getVector() {
        return Position.subtract(this.end, this.start)
    }
}

class Chain {
    constructor(root, scale) {
        this.root = root;
        this.bones = [];
        this.target = { x: 0, y: 0, theta: 0 };
        this.scale = scale;
    }

    addBone(bone_start, bone_end) {
        var bone = new Bone(bone_start, bone_end);
        this.bones.push(bone);
    }

    setTarget(target) {
        this.target = { x: target.x / this.scale, y: target.y / this.scale, theta: target.theta };
    }

    draw(cxt, clear = true) {
        if (clear) {
            cxt.clearRect(0, 0, canvas.width, canvas.height);
        } else {
            ctx.fillStyle = 'rgba(225,225,225,0.5)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        ctx.save();
        ctx.scale(this.scale, this.scale);

        // Draw the arm
        for (let i = 0; i < this.bones.length; i++) {
            // Draw the bone
            ctx.beginPath();
            ctx.moveTo(this.bones[i].start.x, this.bones[i].start.y);
            ctx.lineTo(this.bones[i].end.x, this.bones[i].end.y)
            ctx.stroke();

            // Draw the circle and the beginning of the bone
            ctx.beginPath();
            ctx.arc(this.bones[i].start.x, this.bones[i].start.y, 1, 0, 2 * Math.PI, false);
            ctx.fillStyle = "rgb(0, 255, 0)";
            ctx.fill();
            
            // Draw the circle at the end of the bone
            ctx.beginPath();
            ctx.arc(this.bones[i].end.x, this.bones[i].end.y, 1, 0, 2 * Math.PI, false);
            ctx.fillStyle = "rgb(0, 255, 0)";
            ctx.fill();
        }

        // Draw the target
        ctx.beginPath();
        ctx.arc(this.target.x, this.target.y, 1, 0, 2 * Math.PI, false);
        ctx.fillStyle = "rgb(0, 0, 255)";
        ctx.fill();

        // Draw the root
        ctx.beginPath();
        ctx.arc(this.root.x, this.root.y, 1, 0, 2 * Math.PI, false);
        ctx.fillStyle = "rgb(255, 0, 0)";
        ctx.fill();

        ctx.restore();
    }

    setRoot(root) {
        this.root = root;
    }

    getLength() {
        var l = 0;
        this.bones.forEach(function (bone) {
            l += Position.getDistance(bone.start, bone.end);
        });

        return l;
    }
}

class IKSolver {
    constructor(tolerance) {
        this.tolerance = tolerance;
    }

    updateBone(bone, start_p, tgt_p, direction) {
        var l = Position.getDistance(bone.start, bone.end);
        if (direction == "backwards") {
            bone.end = new Position(start_p.x, start_p.y);
        } else {
            bone.start = new Position(start_p.x, start_p.y);
        }
        var dir = Position.makeUnit(Position.subtract(tgt_p, start_p));
        dir._multiply(l);
        if (direction == "backwards") {
            bone.start = Position.add(bone.end, dir);
        } else {
            bone.end = Position.add(bone.start, dir);
        }
    }

    backwards(chain, chain_target) {
        // Backwards
        for (let i = chain.bones.length - 2; i >= 0; i--) {
            var start, target;

            // Get the location of the point that this bone should move to
            var start_index = i + 1;
            if (start_index >= chain.bones.length - 1) {
                start = chain_target;
            } else {
                start = chain.bones[start_index].start;
            }

            // Get the location of the point that this bone should align with
            var target_index = i - 1;
            if (target_index < 0) {
                target = chain.root;
            } else {
                target = chain.bones[target_index].end;
            }

            this.updateBone(chain.bones[i], start, target, "backwards");
        }
    }

    forwards(chain, chain_target) {
        // Forwards
        for (let i = 0; i < chain.bones.length - 1; i++) {
            var start, target;

            // Get the location of the point that this bone should move to
            var start_index = i - 1;
            if (start_index < 0) {
                start = chain.root;
            } else {
                start = chain.bones[start_index].end;
            }

            // Get the location of the point that this bone should align with
            var target_index = i + 1;
            if (target_index >= chain.bones.length - 1) {
                target = chain_target;
            } else {
                target = chain.bones[target_index].start;
            }

            this.updateBone(chain.bones[i], start, target, "forwards");
        }
    }

    solve(chain) {
        // Grab the end bone and update its orientation to match the target
        var end_bone = chain.bones[chain.bones.length - 1];
        var end_rotation = new Position(Math.cos(chain.target.theta), Math.sin(chain.target.theta));
        end_rotation._multiply(Position.getDistance(end_bone.start, end_bone.end) * 1.5);
        end_rotation._add(chain.target);
        console.log(chain.target, end_rotation);
        this.updateBone(end_bone, chain.target, end_rotation, "backwards");

        for (let i = 0; i < 10; i++) {
            this.backwards(chain, end_bone.start);
            this.forwards(chain, end_bone.start);
        }

        var offset = Position.subtract(chain.bones[chain.bones.length - 2].end, end_bone.start)
        end_bone.start._add(offset);    
        end_bone.end._add(offset);
    }
}