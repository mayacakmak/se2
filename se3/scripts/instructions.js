var controlTypes = ["arrow", "drag", "target", "targetdrag", "panel"];
var transitionTypes = ["press/release", "click"];

// Because right now not all of the videos are finished
//    some urls are repeated or placeholders are used just to test that everything is working
var videoIds = {
    "arrow": {
        "press/release": "ciDJ-NLr_Tg",
        "click": "ciDJ-NLr_Tg"
    },
    "drag": {
        "press/release": "TopgXGcI9cQ",
        "click": "TopgXGcI9cQ"
    },
    "target": {
        "click": "W7hsfnFKDLU"
    },
    "targetdrag": {
        "press/release": "0-bn1FVWSxs",
        "click": "0-bn1FVWSxs"
    },
    "panel": {
        "press/release": "3fC6vZYEwyA",
        "click": "3fC6vZYEwyA"
    }
}

function loadVideo(interface_num) {
    var currentControl = interface_nums[interface_num][0];
    var currentTransitionType = interface_nums[interface_num][1];

    var url = `https://www.youtube.com/embed/${videoIds[controlTypes[currentControl]][transitionTypes[currentTransitionType]]}?rel=0`;
    $("#instruction-video").prop("src", url);

    $("#next").click(function() {
        startInterface(currentControl, currentTransitionType);
    })
}