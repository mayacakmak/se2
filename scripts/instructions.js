var controlTypes = ["arrow", "drag", "target", "targetdrag", "panel"];
var transitionTypes = ["press/release", "click"];

// Because right now not all of the videos are finished
//    some urls are repeated or placeholders are used just to test that everything is working
var videoIds = {
    "arrow": {
        "press/release": "8jFbHrpaptU",
        "click": "ADlGCOGRjxc"
    },
    "drag": {
        "press/release": "A-mzWlPjxDU",
        "click": "W2uMjeDp4LI"
    },
    "target": {
        "click": "-qUV753YINg"
    },
    "targetdrag": {
        "press/release": "YEVwIV0PPDE",
        "click": "VpbocBmKBLk"
    },
    "panel": {
        "press/release": "B8QkeA3O_RY",
        "click": "Y_t3GDRDD_s"
    }
}

var interface_nums = [[0,0], [0,1], [1,0], [1,1], [2,1], [3,0], [3,1], [4,0], [4,1]];

function loadVideo(interface_num) {
    var currentControl = interface_nums[interface_num][0];
    var currentTransitionType = interface_nums[interface_num][1];

    var url = `https://www.youtube.com/embed/${videoIds[controlTypes[currentControl]][transitionTypes[currentTransitionType]]}?rel=0`;
    $("#instruction-video").prop("src", url);

    $("#next").click(function() {
        startInterface(currentControl, currentTransitionType);
    })
}