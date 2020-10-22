
var ik_target, ik_target_ghost, dae, kinematics, collada;
const arm_link_name = 'l_shoulder_pan_link';
const gripper_link_name = "l_wrist_roll_link";
const NUM_JOINTS = 7;
const initial_angle_state = [45, 25.000949999999996, 88.80845, -66.5005, 0, -62.4525, 0];

var iterations = 10000;
var enableIK = true;

var container;

var views, scene, renderer;

var mouseX = 0, mouseY = 0;

var windowWidth = 1100, windowHeight = 733;
var cameraScale = 65;

var xScale = 1.222;
var zScale = 0.8;
var yScale = 1.222;

// IK Optimization Constants
var kPos = 2;
var kRot = 10;
var kChange = 1 / 325;
var kConstraint = 1;

var kBackgroundColor = new THREE.Color(0.25, 0.25, 0.25);

var kZoomLevel = 80;

var views = [
    {
        screenPos: "bottom-left",
        type: "orthographic",
        left: 0,
        bottom: 0,
        width: 0.5,
        height: 0.5,
        background: kBackgroundColor,
        eye: [15, 5, -3],
        rotation: new THREE.Vector3(0, Math.PI / 2, 0),
        cameraScale: kZoomLevel
    },
    {
        screenPos: "top-left",
        type: "orthographic",
        left: 0,
        bottom: 0.5,
        width: 0.5,
        height: 0.5,
        background: kBackgroundColor,
        eye: [3, 20, -3],
        rotation: new THREE.Vector3(-Math.PI / 2, 0, 0),
        cameraScale: kZoomLevel
    },
    {
        screenPos: "bottom-right",
        type: "perspective",
        left: 0.5,
        bottom: 0,
        width: 0.5,
        height: 0.5,
        background: kBackgroundColor,
        eye: [10, 10, -10],
        target: new THREE.Vector3(0, 5, 0),
        fov: 50
    },
    {
        screenPos: "top-right",
        type: "orthographic",
        left: 0.5,
        bottom: 0.5,
        width: 0.5,
        height: 0.5,
        background: kBackgroundColor,
        eye: [3, 5, 15],
        rotation: new THREE.Vector3(0, 0, 0),
        cameraScale: kZoomLevel
    }
];

init();
animate();

function init() {

    container = document.getElementById('ThreeJS');

    for (var ii = 0; ii < views.length; ++ii) {

        var view = views[ii];
        if (view.type == "perspective") {
            var camera = new THREE.PerspectiveCamera(view.fov, windowWidth / windowHeight, 1, 10000);
            camera.position.fromArray(view.eye);
            camera.lookAt(view.target);
            view.camera = camera;
        } else if (view.type == "orthographic") {
            var w = windowWidth / view.cameraScale;
            var h = windowHeight / view.cameraScale;
            var camera = new THREE.OrthographicCamera(w / - 2, w / 2, h / 2, h / - 2, 1, 10000);
            camera.position.fromArray(view.eye);
            camera.rotation.setFromVector3(view.rotation);
            view.camera = camera;
        }
    }

    scene = new THREE.Scene();


    // Lights
    var particleLight = new THREE.Mesh(new THREE.SphereGeometry(4, 8, 8), new THREE.MeshBasicMaterial({ color: 0xffffff }));
    particleLight.position.set(2611.7403539515544, 3454.272981693232, 1494.286894656113);
    scene.add(particleLight);

    var light = new THREE.HemisphereLight(0x333333, 0xffeeee);
    scene.add(light);

    var pointLight = new THREE.PointLight(0xffffff, 0.7);
    particleLight.add(pointLight);


    var skyBoxGeometry = new THREE.CubeGeometry(10000, 10000, 10000);
    var skyBoxMaterial = new THREE.MeshBasicMaterial({ color: 0x9999ff, side: THREE.BackSide });
    var skyBox = new THREE.Mesh(skyBoxGeometry, skyBoxMaterial);

    var loader = new THREE.ColladaLoader();
    loader.options.convertUpAxis = true;
    loader.load('scripts/3d/openrave-pr2.dae', function (_collada) {
        collada = _collada;

        dae = collada.scene;

        dae.traverse(function (child) {

            if (child instanceof THREE.Mesh) {

                child.geometry.computeFaceNormals();
                child.material.shading = THREE.FlatShading;

            }

        });

        dae.scale.x = dae.scale.y = dae.scale.z = 10.0;
        dae.updateMatrix();

        kinematics = collada.kinematics;
        console.log("Kinematics:");
        console.log(kinematics);

        // Add the COLLADA
        THREE.Object3D.prototype.traverseDepth = function (a, i) { if (!1 !== this.visible) { a(this, i); for (var b = this.children, c = 0, d = b.length; c < d; c++)b[c].traverseDepth(a, i + 1) } };
        dae.traverseDepth(function (obj, i) { if (obj.material) { obj.material.color.setHex(0x999999); } }, 0);
        setPR2Color();

        // Move the whole robot down in preparation for the torso being moved up later
        dae.position.y = -4.6;
        scene.add(dae);

        // Arm index
        arm_joint_idx = findJointByName(arm_link_name);

        // Move the right arm down
        r_arm_joint_idx = findJointByName("r_shoulder_pan_link");
        kinematics.setJointValue(r_arm_joint_idx, -90);
        kinematics.setJointValue(r_arm_joint_idx + 1, 80);
        kinematics.setJointValue(r_arm_joint_idx + 2, -180);

        // Open the gripper
        var open_amount = 31.3981;

        //kinematics.jointMap[findJointByName("l_gripper_r_finger_link")].joint.limits.max = open_amount;
        kinematics.setJointValue(findJointByName("l_gripper_r_finger_link"), open_amount);

        //kinematics.jointMap[findJointByName("l_gripper_r_finger_link")].joint.limits.max = open_amount;
        //kinematics.setJointValue(findJointByName("l_gripper_l_finger_link"), 15.69905);

        // Move the torso up
        kinematics.setJointValue(findJointByName("torso_lift_link"), 0.33);

        // Put the arm in the correct starting position
        setJointAngles(starting_position);
    });


    // Add the target
    var r = 0.1;
    var h = 1.2;
    var axis_geo = new THREE.BoxGeometry(h, r, r);
    var center_geo = new THREE.SphereGeometry(0.17, 32, 32);

    var red_mat = new THREE.MeshLambertMaterial({ color: 'rgb(255,0,0)' });
    var green_mat = new THREE.MeshLambertMaterial({ color: 'rgb(0,255,0)' });
    var blue_mat = new THREE.MeshLambertMaterial({ color: 'rgb(0,0,255)' });
    var gray_mat = new THREE.MeshLambertMaterial({ color: 'rgb(190,190,190)' });

    var x_obj = new THREE.Mesh(axis_geo, blue_mat);
    x_obj.position.x += h / 2;
    var y_obj = new THREE.Mesh(axis_geo, red_mat);
    y_obj.rotation.y += 90 * DEG_TO_RAD;
    y_obj.position.z -= h / 2;
    var z_obj = new THREE.Mesh(axis_geo, green_mat);
    z_obj.rotation.z += 90 * DEG_TO_RAD;
    z_obj.position.y += h / 2;

    var center_obj = new THREE.Mesh(center_geo, gray_mat);


    ik_target = new THREE.Group();
    ik_target.add(x_obj);
    ik_target.add(y_obj);
    ik_target.add(z_obj);
    ik_target.add(center_obj)
    ik_target.position.set(6, 7, -1);

    var f_size = new THREE.Vector3(0.5, 0.3, 0.3);
    var finger_geo = new THREE.BoxGeometry(f_size.x, f_size.y, f_size.z);
    var black_mat = new THREE.MeshLambertMaterial({ color: 'rgb(0,0,0)' });
    var l_finger = new THREE.Mesh(finger_geo, black_mat);
    var r_finger = new THREE.Mesh(finger_geo, black_mat);
    var finger_separation = 0.45;

    l_finger.position.z = -finger_separation;
    r_finger.position.z = finger_separation;
    l_finger.visible = false;
    r_finger.visible = false;
    l_finger.name = "l_finger_mesh";
    r_finger.name = "r_finger_mesh";

    l_finger.userData.obb = new OBB();
    l_finger.userData.obb.halfSize.copy(f_size).multiplyScalar(0.5);

    r_finger.userData.obb = new OBB();
    r_finger.userData.obb.halfSize.copy(f_size).multiplyScalar(0.5);

    ik_target.add(l_finger);
    ik_target.add(r_finger);

    var finger_between_geo_size = new THREE.Vector3(0.2, 0.2, 0.7);
    var finger_between_geo = new THREE.BoxGeometry(finger_between_geo_size.x, finger_between_geo_size.y, finger_between_geo_size.z);

    var finger_between = new THREE.Mesh(finger_between_geo, black_mat);
    finger_between.name = "finger_between";
    finger_between.visible = false;
    finger_between.position.x += 0.15

    finger_between.userData.obb = new OBB();
    finger_between.userData.obb.halfSize.copy(finger_between_geo_size).multiplyScalar(0.5);

    ik_target.add(finger_between);

    scene.add(ik_target);

    ik_target_ghost = new THREE.Group();
    ik_target_ghost.add(x_obj.clone());
    ik_target_ghost.add(y_obj.clone());
    ik_target_ghost.add(z_obj.clone());
    ik_target_ghost.position.set(ik_target.position.x, ik_target.position.y, ik_target.position.z);

    // Clone materials and set opacity of ghost
    ik_target_ghost.children.forEach(function (child) {
        child.material = child.material.clone();
        child.material.opacity = 0.3;
        child.material.transparent = true;
    });

    ik_target_ghost.add(l_finger.clone());
    ik_target_ghost.add(r_finger.clone());

    ik_target_ghost.visible = false;

    scene.add(ik_target_ghost);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    //renderer.setPixelRatio(windowWidth / windowHeight);
    renderer.setSize(windowWidth, windowHeight);
    container.appendChild(renderer.domElement);
}

function setPR2Color() {
    dae.getObjectByName(arm_link_name).traverseDepth(function (obj, i) { if (obj.material) { obj.material.color.setHex(0xCCCCCC); } }, 0);
    dae.getObjectByName(gripper_link_name).traverseDepth(function (obj, i) { if (obj.material) { obj.material.color.setHex(0xf0ff8f); } }, 0);
}

function animate() {

    render();

    if (kinematics && enableIK) {
        solveIK(ik_target, iterations);
    }


    requestAnimationFrame(animate);

}

function findJointByName(nodeName) {
    for (var i = 0; i < 87; i++) {
        if (kinematics.jointMap[i].node.name == nodeName) {
            return i;
        }
    }
}

function render() {

    for (var ii = 0; ii < views.length; ++ii) {

        var view = views[ii];
        var camera = view.camera;

        var left = Math.floor(windowWidth * view.left);
        var bottom = Math.floor(windowHeight * view.bottom);
        var width = Math.floor(windowWidth * view.width);
        var height = Math.floor(windowHeight * view.height);

        renderer.setViewport(left, bottom, width, height);
        renderer.setScissor(left, bottom, width, height);
        renderer.enableScissorTest(true);
        renderer.setClearColor(view.background);

        camera.aspect = width / height;
        camera.updateProjectionMatrix();

        renderer.render(scene, camera);

    }

}

function calcDist(v1, v2) {
    var dx = v1.x - v2.x;
    var dy = v1.y - v2.y;
    var dz = v1.z - v2.z;

    return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

function calcQuaternionDist(q1, q2) {
    var dx = q1._x - q2._x;
    var dy = q1._y - q2._y;
    var dz = q1._z - q2._z;
    var dw = q1._w - q2._w;

    return Math.sqrt(dx * dx + dy * dy + dz * dz + dw * dw);
}

// Calculate the distance between two arrays of values
function calcAngleDist(a1, a2) {
    var sum = 0;
    for (var i = 0; i < NUM_JOINTS; i++) {
        sum += Math.abs(a1[i] - a2[i]) ** 2;
    }

    return Math.sqrt(sum);
}

function map_range(raw_value, low1, high1, low2, high2, limit_range = true) {
    var value = raw_value;
    if (limit_range)
        var value = Math.min(Math.max(raw_value, low1), high1);
    return low2 + (high2 - low2) * (value - low1) / (high1 - low1);
}

function getEEPose() {

    // Set the endpoint to the wrist
    // var eeJoint = kinematics.jointMap[arm_joint_idx + NUM_JOINTS].node;

    // Set the endpoint to the tip of the hand, the positions of the right and left fingers are averaged together
    var lFinger = kinematics.jointMap[arm_joint_idx + NUM_JOINTS + 2].node;

    var lposition = new THREE.Vector3();
    var lquaternion = new THREE.Quaternion();
    var lscale = new THREE.Vector3();

    lFinger.matrixWorld.decompose(lposition, lquaternion, lscale);

    var rFinger = kinematics.jointMap[arm_joint_idx + NUM_JOINTS + 3].node;

    var rposition = new THREE.Vector3();
    var rquaternion = new THREE.Quaternion();
    var rscale = new THREE.Vector3();

    rFinger.matrixWorld.decompose(rposition, rquaternion, rscale);

    var position = new THREE.Vector3();
    position.lerpVectors(rposition, lposition, 0.65);

    return { position: position, quaternion: lquaternion };
}

function getJointAngles() {
    var jointAngles = [];
    for (var i = 0; i < NUM_JOINTS; i++) {
        // Map the input angle to the joint range
        //var jointLimits = kinematics.joints[arm_joint_idx + i].limits;
        //var newAngle = map_range(kinematics.getJointValue(arm_joint_idx + i), jointLimits.min, jointLimits.max, 0, 1);
        //jointAngles.push(newAngle);
        jointAngles.push(kinematics.getJointValue(arm_joint_idx + i));
    }
    return jointAngles;
}


function setJointAngles(angles) {
    for (var i = 0; i < NUM_JOINTS; i++) {
        kinematics.setJointValue(arm_joint_idx + i, angles[i]);
    }
}

var starting_position = [45, 25.000949999999996, 88.80845, -66.5005, 0, -62.4525, 0];
var lastAngles = starting_position;
function solveIK(target, iter) {
    function loss(angles) {
        var constrainLoss = 0;
        var updatedAngles = [];
        for (var i = 0; i < NUM_JOINTS; i++) {
            var jointLimits = kinematics.joints[arm_joint_idx + i].limits;
            // Some joints can spin 360 degrees, so we don't want to calculate a constraint loss for those
            if ( !(jointLimits.min == -360 && jointLimits.max == 360) ) {
                // Map the input angle to the joint range
                //var newAngle = map_range(angles[i], 0, 1, jointLimits.min, jointLimits.max);
    
                // Limit the input angle to the joint range
                var newAngle = Math.min(Math.max(angles[i], jointLimits.min), jointLimits.max);
    
                updatedAngles.push(newAngle);
    
                if (angles[i] < jointLimits.min) {
                    constrainLoss += jointLimits.min - angles[i];
                } else if (angles[i] > jointLimits.max) {
                    constrainLoss += angles[i] - jointLimits.max;
                }
            } else {
                updatedAngles.push(angles[i] % 360)
            }
        }

        setJointAngles(updatedAngles);

        dae.updateMatrixWorld(true);

        var eePose = getEEPose()

        var posLoss = calcDist(target.position, eePose.position);
        var rotLoss = calcQuaternionDist(target.quaternion, eePose.quaternion)

        var changeLoss = calcAngleDist(lastAngles, updatedAngles);
        tempLastAngles = updatedAngles;

        return posLoss * kPos + rotLoss * kRot + changeLoss * kChange + constrainLoss * kConstraint;
    }

    dae.updateMatrixWorld(true);

    var tempLastAngles = [];

    var startingAngles = Array(NUM_JOINTS).fill(0);
    startingAngles = starting_position; // Realistic angles (without range mapping)
    //startingAngles = getJointAngles();

    fmin.nelderMead(loss, startingAngles, { maxIterations: iter });

    lastAngles = tempLastAngles;
}