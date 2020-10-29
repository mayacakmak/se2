
function getRandomArbitrary(min, max) {
  return Math.random() * (max - min) + min;
}

function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomArrayItem(arr) {
  return arr[getRandomInt(0, arr.length - 1)];
}

function removeChildren(_obj) {
  // Remove all the children of object
  while (_obj.firstChild) {
    _obj.removeChild(_obj.firstChild);
  }
}

function map_range(value, low1, high1, low2, high2) {
  return low2 + (high2 - low2) * (value - low1) / (high1 - low1);
}

// Shuffle an array using Fisher-Yates Shuffle
function shuffle(array) {
  let counter = array.length;

  // While there are elements in the array
  while (counter > 0) {
    // Pick a random index
    let index = Math.floor(Math.random() * counter);

    // Decrease counter by 1
    counter--;

    // And swap the last element with it
    let temp = array[counter];
    array[counter] = array[index];
    array[index] = temp;
  }

  return array;
}

function sampleConfigs(num) {

  var sampleList = [];

  // Generate dimentions of targets T1 and T2
  var t_1_2_dim = new THREE.Vector3(getRandomArbitrary(0.12, 0.15), 0, 1);
  t_1_2_dim.y = t_1_2_dim.x;


  // T1, upright cylinder right in front of the EE
  sampleList.push({
    pos: new THREE.Vector3(getRandomArbitrary(6, 6.5),
      getRandomArbitrary(1.5, 3.5),
      getRandomArbitrary(-1, -0.5)),
    rot: new THREE.Euler(90 * DEG_TO_RAD, 0, 0),
    dim: t_1_2_dim,
    type: "cylinder"
  });

  // T2, upright cylinder, and a bit further away from the EE
  sampleList.push({
    pos: new THREE.Vector3(getRandomArbitrary(4, 6),
      getRandomArbitrary(1, 4),
      getRandomArbitrary(-2, 1)),
    rot: new THREE.Euler(90 * DEG_TO_RAD, 0, 0),
    dim: t_1_2_dim,
    type: "cylinder"
  });

  // Generate dimentions of  targets T3-T5
  var t_3_5_dim = new THREE.Vector3(getRandomArbitrary(0.08, 0.2),
    getRandomArbitrary(1.7, 2.3),
    getRandomArbitrary(0.3, 0.4));

  // T3, roughly phone-shaped box lying flat on a table
  sampleList.push({
    pos: new THREE.Vector3(getRandomArbitrary(1.5, 4),
      getRandomArbitrary(1, 3),
      getRandomArbitrary(-4, 2)),
    rot: new THREE.Euler(0, 0, 90 * DEG_TO_RAD),
    dim: t_3_5_dim,
    type: "box"
  });


  // T4, same as T3, but rotated 90 degrees
  sampleList.push({
    pos: new THREE.Vector3(getRandomArbitrary(2, 4),
      getRandomArbitrary(1, 3),
      getRandomArbitrary(-4, 2)),
    rot: new THREE.Euler(0, 90 * DEG_TO_RAD, 90 * DEG_TO_RAD),
    dim: t_3_5_dim,
    type: "box"
  });


  // T5, same as T3, but rotated 45 degrees
  sampleList.push({
    pos: new THREE.Vector3(getRandomArbitrary(2, 4),
      getRandomArbitrary(1, 3),
      getRandomArbitrary(-4, 2)),
    rot: new THREE.Euler(0, 45 * DEG_TO_RAD, 90 * DEG_TO_RAD),
    dim: t_3_5_dim,
    type: "box"
  });

  return sampleList;
}