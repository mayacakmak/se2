var controlTypes = ["arrow", "drag", "target", "targetdrag", "panel"];
var transitionTypes = ["press/release", "click"];
var currentControl = 0;
var currentTransitionType = 1;

// Because right now not all of the videos are finished
//    some urls are repeated or placeholders are used just to test that everything is working
var videoIds = {
    "arrow": {
        "press/release": "8jFbHrpaptU",
        "click": "8jFbHrpaptU"
    },
    "drag": {
        "press/release": "A-mzWlPjxDU",
        "click": "A-mzWlPjxDU"
    },
    "target": {
        "press/release": "zpOULjyy-n8",
        "click": "zpOULjyy-n8"
    },
    "targetdrag": {
        "press/release": "YEVwIV0PPDE",
        "click": "YEVwIV0PPDE"
    },
    "panel": {
        "press/release": "B8QkeA3O_RY",
        "click": "B8QkeA3O_RY"
    }
}

function loadVideo() {
    let controlParam = getURLParameter("c");
    let transitionParam = getURLParameter("t");
    if (controlParam != undefined)
        currentControl = controlParam;
    if (transitionParam != undefined)
        currentTransitionType = transitionParam;

    var url = `https://www.youtube.com/embed/${videoIds[controlTypes[currentControl]][transitionTypes[currentTransitionType]]}?rel=0`;
    $("#instruction-video").prop("src", url);

    $("#next").click(function() {
        startInterface(currentControl, currentTransitionType);
    })
}