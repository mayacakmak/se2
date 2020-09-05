
var target, dae, kinematics, collada;
var arm_link_name = 'l_shoulder_pan_link';
var NUM_JOINTS = 7;

var iterations = 10000; // Default is ten thousand iterations
var enableIK = true;

var container;

var views, scene, renderer;

var mouseX = 0, mouseY = 0;

var windowWidth = 1100, windowHeight = 733;
var cameraScale = 30;

var xScale = 1.222;
var zScale = 0.8;
var yScale = 1.222;

var views = [
    {
        screenPos: "bottom-left",
        type: "orthographic",
        left: 0,
        bottom: 0,
        width: 0.5,
        height: 0.5,
        background: new THREE.Color(0.8, 0.8, 0.8),
        eye: [15, 7, 0],
        rotation: new THREE.Vector3(0, Math.PI / 2, 0)
    },
    {
        screenPos: "top-left",
        type: "orthographic",
        left: 0,
        bottom: 0.5,
        width: 0.5,
        height: 0.5,
        background: new THREE.Color(0.8, 0.8, 0.8),
        eye: [0, 20, 0],
        rotation: new THREE.Vector3(-Math.PI / 2, 0, 0)
    },
    {
        screenPos: "bottom-right",
        type: "perspective",
        left: 0.5,
        bottom: 0,
        width: 0.5,
        height: 0.5,
        background: new THREE.Color(0.8, 0.8, 0.8),
        eye: [10, 10, 10],
        target: new THREE.Vector3(0, 4, 0),
        fov: 60
    },
    {
        screenPos: "top-right",
        type: "orthographic",
        left: 0.5,
        bottom: 0.5,
        width: 0.5,
        height: 0.5,
        background: new THREE.Color(0.8, 0.8, 0.8),
        eye: [0, 5, 15],
        rotation: new THREE.Vector3(0, 0, 0)
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
            var w = windowWidth / cameraScale;
            var h = windowHeight / cameraScale;
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
        //dae.getObjectByName(arm_link_name).traverseDepth(function (obj, i) { if (obj.material) { obj.material.color.setHex(0x669966); } }, 0);
        scene.add(dae);

        // Arm index
        arm_joint_idx = findJointByName(arm_link_name);
        console.log(arm_joint_idx);
    });


    // Add the target
    var geometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
    var material = new THREE.MeshBasicMaterial({ color: 'rgb(255,0,0)' });

    target = new THREE.Mesh(geometry, material);
    scene.add(target);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    //renderer.setPixelRatio(windowWidth / windowHeight);
    renderer.setSize(windowWidth, windowHeight);
    container.appendChild(renderer.domElement);
}

function animate() {

    render();

    try {
        var remapX = (ee.pose.x / (windowWidth / 2)) - 0.5; // remap the ee x coordinate from (0, windowWidth) to (-0.5, 0.5)
        var remapY = (ee.pose.y / (windowHeight / 2)) - 0.5; // remap the ee y coordinate from (0, windowHeight) to (-0.5, 0.5)
        target.position.x = remapX * cameraScale * xScale;
        target.position.z = remapY * cameraScale * zScale;
    }
    catch (e) {
        console.error(e);
    }

    if (kinematics) {
        solveIK(target, iterations);
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

function calcAngleDist(a1, a2) {
    var sum = 0;
    for (var i = 0; i < NUM_JOINTS; i++) {
        sum += Math.abs(a1[i] - a2[i]);
    }

    return sum
}

function map_range(raw_value, low1, high1, low2, high2) {
    var value = Math.min(Math.max(raw_value, low1), high1);
    return low2 + (high2 - low2) * (value - low1) / (high1 - low1);
}

function getEEPose() {

    // Set the endpoint to the tip of the hand
    var eeJoint = kinematics.jointMap[arm_joint_idx + NUM_JOINTS + 1].node;

    // Set the endpoint to the wrist
    // var eeJoint = kinematics.jointMap[arm_joint_idx + NUM_JOINTS - 1].node;

    var position = new THREE.Vector3();
    var quaternion = new THREE.Quaternion();
    var scale = new THREE.Vector3();

    eeJoint.matrixWorld.decompose(position, quaternion, scale);

    return { position: position, quaternion: quaternion };
}

var lastAngles = [45, 25.000949999999996, 88.80845, -66.5005, 0, -62.4525, 0];
function solveIK(target, iter) {
    function loss(angles) {
        var constrainLoss = 0;
        var updatedAngles = [];
        for (var i = 0; i < NUM_JOINTS; i++) {
            var jointLimits = kinematics.joints[arm_joint_idx + i].limits;

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

            kinematics.setJointValue(arm_joint_idx + i, newAngle);
        }

        dae.updateMatrixWorld(true);

        var eePose = getEEPose()

        var posLoss = calcDist(target.position, eePose.position);
        var rotLoss = calcQuaternionDist(target.quaternion, eePose.quaternion)

        var changeLoss = calcAngleDist(lastAngles, updatedAngles);
        tempLastAngles = updatedAngles;

        return posLoss + rotLoss * 7 + changeLoss * 1 / 400;
    }

    dae.updateMatrixWorld(true);

    var tempLastAngles = [];

    var startingAngles = Array(NUM_JOINTS).fill(0);
    startingAngles = [45, 25.000949999999996, 88.80845, -66.5005, 0, -62.4525, 0]; // Realistic angles (without range mapping)
    //startingAngles = getJointAngles();

    var solution = fmin.nelderMead(loss, startingAngles, { maxIterations: iter });

    lastAngles = tempLastAngles;
}