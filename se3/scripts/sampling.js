
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

  // T1, upright cylinder right in front of the EE
  sampleList.push({
    pos: new THREE.Vector3(getRandomArbitrary(7, 7.5),
      getRandomArbitrary(5, 6),
      getRandomArbitrary(-1, 0)),
    rot: new THREE.Euler(90 * DEG_TO_RAD, 0, 0),
    dim: new THREE.Vector3(0.10, 0.10, 1),
    type: "cylinder"
  });


  // T2, upright cylinder, slightly larger, and a bit further away from the EE
  sampleList.push({
    pos: new THREE.Vector3(getRandomArbitrary(7, 8),
      getRandomArbitrary(6, 8),
      getRandomArbitrary(-2, 0.2)),
    rot: new THREE.Euler(90 * DEG_TO_RAD, 0, 0),
    dim: new THREE.Vector3(0.16, 0.16, 1),
    type: "cylinder"
  });

  

  for (var i = 0; i < 100; i++) {
    // T3, roughly phone-shaped box lying flat on a table, rotated randomly on Z
    sampleList.push({
      pos: new THREE.Vector3(getRandomArbitrary(7, 8),
        getRandomArbitrary(6, 8),
        getRandomArbitrary(-4, 2)),
      rot: new THREE.Euler(0, getRandomArbitrary(-45, 45) * DEG_TO_RAD, 90 * DEG_TO_RAD),
      dim: new THREE.Vector3(getRandomArbitrary(0.1, 0.16),
                             getRandomArbitrary(1.7, 2.3), 
                             getRandomArbitrary(0.8, 1.1)),
      type: "box"
    });
  }

  return sampleList;
}