// INDEXES of the interfaces in Firebase
// 0:[0, 0] - arrow **
// 1:[0, 1] - arrow-click
// 2:[1, 0] - drag **
// 3:[1, 1] - drag-click
// 4:[2, 1] - target-click **
// 5:[3, 0] - targetdrag
// 6:[3, 1] - targetdrag-click **
// 7:[4, 0] - panel **
// 8:[4, 1] - panel-click

var interface_nums = [[0, 0], [0, 1], [1, 0], [1, 1], [2, 1], [3, 0], [3, 1], [4, 0], [4, 1]];
var interface_nums_inverse = {
  0: {
    0: 0,
    1: 1
  },
  1: {
    0: 2,
    1: 3
  },
  2: {
    1: 4
  },
  3: {
    0: 5,
    1: 6
  },
  4: {
    0: 7,
    1: 8
  }
}

var controlTypesMap = ["arrow", "drag", "target", "targetdrag", "panel"];
var transitionTypesMap = ["press/release", "click"];


let controlType = getURLParameter("c");
let transitionType = getURLParameter("t");
if (controlType == undefined)
  controlType = 0;
if (transitionType == undefined)
  transitionType = 1;

function moveToPage(location) {
  window.location.href = location;
}

function moveToPracticePage() {
  moveToPage("practice.html");
}

function moveToTestPage(controlType, transitionType) {
  moveToPage("test.html?c=" + controlType + "&t=" + transitionType);
}

function startInterface(controlType, transitionType) {
  moveToPage("practice.html?c=" + controlType + "&t=" + transitionType);
}

function moveToSurveyPage() {
  moveToPage("questionnaire.html?c=" + controlType + "&t=" + transitionType);
}

function getURLParameter(paramName) {
  var url = window.location.toString();
  var urlParamIndex = url.indexOf(paramName + "=");
  var paramValue = null;
  if (urlParamIndex != -1) {
    var valueIndex = urlParamIndex + paramName.length + 1;
    paramValue = url.substring(valueIndex,);
    var andParamIndex = paramValue.indexOf("&");
    if (andParamIndex > 0)
      paramValue = paramValue.substring(0, andParamIndex);
    console.log(paramName + ":" + paramValue);
  }
  return paramValue;
}