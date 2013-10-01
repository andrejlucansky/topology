var data = [
    [30, 70],
    [50, 70],
    [70, 70],
    [30, 30],
    [50, 30],
    [70, 30],
    [30, 50],
    [70, 50]
];

var width = 800;
var height = 800;
var radius = 30;

var x = d3.scale.linear().domain([0, 100]).range([0, width]);
var y = d3.scale.linear().domain([0, 100]).range([0, height]);

var svg = d3.select("body").append("svg").attr("width", width).attr("height", height);

var circle = svg.selectAll(".big_blue_circle").data(data).enter().append("circle").attr("class", "big_blue_circle")
    .attr("style", "fill: darkblue");

circle.attr("cx", function (d) {
    return d[0] - radius
})
    .attr("cy", function (d) {
        return d[1] - radius
    })
    .attr("transform", function (d) {
        return "translate(" + (x(d[0]) - radius) + "," + (y(d[1]) - radius) + ")"
    })
    .attr("r", 0)
    .transition()
    .attr("r", radius);