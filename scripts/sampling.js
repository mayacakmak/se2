var ws = document.getElementById("dist-xy");
var size = ws.getBoundingClientRect();
var background_group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
var dot_group = document.createElementNS('http://www.w3.org/2000/svg', 'g');


var dist_theta_ws = document.getElementById("dist-theta");
var dist_theta_group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
var thresh_xy_ws = document.getElementById("thresh-xy");
var thresh_xy_group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
var thresh_theta_ws = document.getElementById("thresh-theta");
var thresh_theta_group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
var pos_dist_ws = document.getElementById("pos-dist");
var pos_dist_group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
var pos_angle_ws = document.getElementById("pos-angle");
var pos_angle_group = document.createElementNS('http://www.w3.org/2000/svg', 'g');


var upper_bound = 80;
var middle_outer_radius = (size.height / 2) - upper_bound;
var dist_xy = {
  1: { start: 0, end: middle_outer_radius * 0.5 },
  2: { start: middle_outer_radius * 0.5, end: middle_outer_radius },
  3: { start: middle_outer_radius, end: middle_outer_radius * 1.5 }
};

var dist_theta = {
  1: { start: 0, end: 60 },
  2: { start: 60, end: 120 },
  3: { start: 120, end: 180 }
};

var thresh_xy = {
  1: { start: 5, end: 17.5 },
  2: { start: 17.5, end: 30 }
};

var thresh_theta = {
  1: { start: 5, end: 32.5 },
  2: { start: 32.5, end: 60 }
};

var current_dot;
var ee;
var ee_display_scale = 1 / 3;

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

function createDot(dot_data, radius = 3, fill = "black", stroke = "blue") {
  var size = ws.getBoundingClientRect();
  var dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  dot.setAttribute('cx', dot_data.x);
  dot.setAttribute('cy', dot_data.y);
  dot.setAttribute('r', radius);
  dot.setAttribute("fill", fill);
  dot.setAttribute("stroke", stroke);
  dot.setAttribute("stroke-width", 0);
  dot.style.pointerEvents = "all";
  $(dot).hover(function () {
    showDotEE();
    renderDotEE(dot, dot_data);
  }, hideDotEE);
  current_dot = dot;
  return dot;
}

function renderDotEE(dot, dot_data) {
  // Remove the outline from the old dot
  current_dot.setAttribute("stroke-width", 0);
  current_dot = dot;

  // Add an outline to the newly selected dot
  dot.setAttribute("stroke-width", 2);

  // Create and set the position of the EE
  var size = ws.getBoundingClientRect();
  var eePose = new Pose(dot_data.x * ee_display_scale, dot_data.y * ee_display_scale, dot_data.theta, dot_data.thresh_xy, dot_data.thresh_theta);
  ee = new SE2("target", eePose, "#AAA", dot_data.thresh_xy, dot_data.thresh_theta);
  ee.setPose(eePose);

  ee.group.setAttribute("transform", ee.group.getAttribute("transform") + "scale (" + ee_display_scale + ", " + ee_display_scale + ")");
  ee.addToWorkspace();
}

function hideDotEE() {
  current_dot.setAttribute("stroke-width", 0);
  ee.removeFromWorkspace();
  $("#workspace").hide();
}

function showDotEE() {
  $("#workspace").show();
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

function plotHistogram(ws, points, n_bins = 10) {
  removeChildren(ws);

  var max = Math.max(...points);
  var min = Math.min(...points);
  var range = max - min;

  var bin_size = range / n_bins;
  var bins = Array(n_bins).fill(0);
  var bin_ranges = [];
  for (var i = min; i < max; i += bin_size) {
    bin_ranges.push([i, i + bin_size]);
  }

  for (var i = 0; i < points.length; i++) {
    for (var j = 0; j < n_bins; j++) {
      if (bin_ranges[j][0] <= points[i] && points[i] <= bin_ranges[j][1]) {
        bins[j] += 1;
        break;
      }
    }
  }

  var size = ws.getBoundingClientRect();
  var outer = 40;
  var padding = 10;
  var font_size = 15;
  var bin_width = (size.width - padding * (n_bins + 1) - outer) / n_bins;

  var bin_max = Math.max(...bins);
  var bins_mapped = bins.map(function (bin_val) {
    return map_range(bin_val, 0, bin_max, 0, size.height - font_size);
  });

  for (var i = 0; i < n_bins; i++) {
    var bin_height = bins_mapped[i];
    var rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('x', outer / 2 + padding + (i * (bin_width + padding)));
    rect.setAttribute('y', size.height - bin_height - font_size / 2);
    rect.setAttribute('rx', 5);
    rect.setAttribute('width', bin_width);
    rect.setAttribute('height', Math.max(bin_height - font_size / 2, 0));
    rect.setAttribute("fill", "#111");
    rect.setAttribute("real_num", bins[i])
    rect.style.opacity = 0.3
    $(rect).hover(function () {
      $("#histogram-display").show();
      $("#histogram-display").text(this.getAttribute("real_num"));
      this.style.opacity = 0.45;
    }, function () {
      $("#histogram-display").hide();
      this.style.opacity = 0.3;
    });
    ws.appendChild(rect);


    label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    label.setAttribute('x', outer / 2 + (i * (bin_width + padding)) + padding / 2);
    label.setAttribute('y', size.height);
    label.setAttribute("fill", "#000");
    label.setAttribute("style", `font-family:Varela Round, sans-serif; font-size: ${font_size}px;`);
    label.setAttribute("text-anchor", "middle");
    label.innerHTML = bin_ranges[i][0].toFixed(1);
    ws.appendChild(label);
  }

  label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  label.setAttribute('x', outer / 2 + (n_bins * (bin_width + padding)) + padding / 2);
  label.setAttribute('y', size.height);
  label.setAttribute("fill", "#000");
  label.setAttribute("style", `font-family:Varela Round, sans-serif; font-size: ${font_size}px;`);
  label.setAttribute("text-anchor", "middle");
  label.innerHTML = bin_ranges[n_bins - 1][1].toFixed(1);
  ws.appendChild(label);
}

function sample(num) {
  removeChildren(dot_group);

  var dist_theta_list = [];
  var thresh_xy_list = [];
  var thresh_theta_list = [];
  var pos_dist_list = [];
  var pos_angle_list = [];
  for (var i = 0; i < num; i++) {
    for (var j = 1; j <= 3; j++) { // dist_xy
      for (var k = 1; k <= 3; k++) { // dist_theta
        for (var l = 1; l <= 2; l++) { // thresh_xy
          for (var m = 1; m <= 2; m++) { // thresh_theta
            var dist_xy_range = dist_xy[j];

            var loc = {
              x: -1,
              y: -1,
              dist: -1,
              angle: -1
            }

            while (loc.y < upper_bound || loc.y > size.height - upper_bound) {
              var dist = getRandomArbitrary(dist_xy_range.start, dist_xy_range.end);
              var angle = getRandomArbitrary(0, 360);

              loc.x = Math.cos(angle) * dist + centerX;
              loc.y = Math.sin(angle) * dist + centerY;
              loc.dist = dist;
              loc.angle = angle;
            }

            pos_dist_list.push(loc.dist);
            pos_angle_list.push(loc.angle);

            var dist_theta_range = dist_theta[k];
            var theta_val = getRandomArbitrary(dist_theta_range.start, dist_theta_range.end) * (Math.random() < 0.5 ? -1 : 1)
            dist_theta_list.push(theta_val);

            var thresh_xy_range = thresh_xy[l];
            var thresh_xy_val = getRandomArbitrary(thresh_xy_range.start, thresh_xy_range.end);
            thresh_xy_list.push(thresh_xy_val);

            var thresh_theta_range = thresh_theta[m];
            var thresh_theta_val = getRandomArbitrary(thresh_theta_range.start, thresh_theta_range.end);
            thresh_theta_list.push(thresh_theta_val);

            dot_data = {
              x: loc.x,
              y: loc.y,
              theta: theta_val,
              thresh_xy: thresh_xy_val,
              thresh_theta: thresh_theta_val
            };

            dot_group.appendChild(createDot(dot_data));
          }
        }
      }
    }
  }

  plotHistogram(dist_theta_ws, dist_theta_list);
  plotHistogram(thresh_xy_ws, thresh_xy_list);
  plotHistogram(thresh_theta_ws, thresh_theta_list);
  plotHistogram(pos_dist_ws, pos_dist_list);
  plotHistogram(pos_angle_ws, pos_angle_list);
}

// Draw background sampling area
for (var i = 1; i <= 3; i++) {
  var rect = ws.getBoundingClientRect();
  var centerX = Math.round(rect.width / 2);
  var centerY = Math.round(rect.height / 2);

  var circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  circle.setAttribute('cx', centerX);
  circle.setAttribute('cy', centerY);
  circle.setAttribute('r', dist_xy[i].end);
  circle.setAttribute("fill", "#000");
  circle.style.opacity = 0.2;
  background_group.appendChild(circle);
}

var top_rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
top_rect.setAttribute('x', 0);
top_rect.setAttribute('y', 0);
top_rect.setAttribute('width', size.width);
top_rect.setAttribute('height', upper_bound);
top_rect.setAttribute("fill", "#FFF");
background_group.appendChild(top_rect);

var top_rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
top_rect.setAttribute('x', 0);
top_rect.setAttribute('y', size.height - upper_bound);
top_rect.setAttribute('width', size.width);
top_rect.setAttribute('height', upper_bound);
top_rect.setAttribute("fill", "#FFF");
background_group.appendChild(top_rect);

ws.appendChild(background_group);
ws.appendChild(dot_group);
dist_theta_ws.appendChild(dist_theta_group);
thresh_xy_ws.appendChild(thresh_xy_group);
thresh_theta_ws.appendChild(thresh_theta_group);
pos_dist_ws.appendChild(pos_dist_group);
pos_angle_ws.appendChild(pos_angle_group);

function initializeSampling() {
  // Hide and set the correct scale of the workspace
  $("#workspace").hide();
  $("#workspace").width($("#workspace").width() * ee_display_scale);
  $("#workspace").height($("#workspace").height() * ee_display_scale);

  // Add an event listner to move the workspace to the position of the mouse
  $(document).mousemove(function (event) {
    $("#workspace").css("margin-top", event.clientY + window.scrollY + "px");
    $("#workspace").css("margin-left", (event.clientX - $("#workspace").width() - 5 + window.scrollX) + "px");

    $("#histogram-display").css("margin-top", (event.clientY - $("#histogram-display").height() + window.scrollY) + "px");
    $("#histogram-display").css("margin-left", (event.clientX - $("#histogram-display").width() + window.scrollX) + "px");
  });


  $("#histogram-display").hide();
  sample(1);
}
