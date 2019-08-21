function moveToPage(location) {
  window.location.href = location;
}

function moveToPracticePage() {
  moveToPage("practice.html");
}

function moveToTestPage() {
  moveToPage("test.html");
}

function startInterface(controlType, transitionType) {
  moveToPage("practice.html?c="+controlType+"&t="+transitionType);
}

function getURLParameter(paramName) {
  var url = window.location.toString();
  var urlParamIndex = url.indexOf(paramName+"=");
  var paramValue = null;
  if (urlParamIndex != -1) {
    var valueIndex = urlParamIndex + paramName.length + 1;
    paramValue = url.substring(valueIndex,);
    var andParamIndex = paramValue.indexOf("&");
    if (andParamIndex>0)
      paramValue = paramValue.substring(0,andParamIndex);
    console.log(paramName + ":" + paramValue);
  }
  return paramValue;
}