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

var nodes = [
    {"x": 469, "y": 410},
    {"x": 493, "y": 364},
    {"x": 442, "y": 365},
    {"x": 467, "y": 314},
    {"x": 477, "y": 248},
    {"x": 425, "y": 207},
    {"x": 402, "y": 155},
    {"x": 369, "y": 196},
    {"x": 350, "y": 148},
    {"x": 539, "y": 222},
    {"x": 594, "y": 235},
    {"x": 582, "y": 185},
    {"x": 633, "y": 200}
];

var links = [
    {"source": 0, "target": 1},
    {"source": 1, "target": 2},
    {"source": 2, "target": 0},
    {"source": 1, "target": 3},
    {"source": 3, "target": 2},
    {"source": 3, "target": 4},
    {"source": 4, "target": 5},
    {"source": 5, "target": 6},
    {"source": 5, "target": 7},
    {"source": 6, "target": 7},
    {"source": 6, "target": 8},
    {"source": 7, "target": 8},
    {"source": 9, "target": 4},
    {"source": 9, "target": 11},
    {"source": 9, "target": 10},
    {"source": 10, "target": 11},
    {"source": 11, "target": 12},
    {"source": 12, "target": 10}
];

var radius = 30;

var width = 800;
var height = 800;

var x = d3.scale.linear().domain([0, 100]).range([0, width]);
var y = d3.scale.linear().domain([0, 100]).range([0, height]);


var svg = d3.select("body").append("svg").attr("width", width).attr("height", height)
    .attr("position", "absolute")
    .attr("top", "50px")
    .attr("left", "100px");

var force = d3.layout.force().nodes(nodes).links(links).size([width, height]).on("tick", tick).start();

var drag = force.drag()
    .on("dragstart", dragstart);

function dragstart(d) {
    d.fixed = true;
    d3.select(this).classed("fixed", true);
}

var link = svg.selectAll(".link").data(links).enter().append("line")
    .attr("class", "link")
    .attr("x1", function(d){return d.source.x})
    .attr("y1", function(d){return d.source.y})
    .attr("x2", function(d){return d.target.x})
    .attr("y2", function(d){return d.target.y});

var node = svg.selectAll(".node").data(nodes).enter().append("circle")
    .attr("class", "node")
    .attr("r", 12)
    .attr("cx", function(d) { return d.x; })
    .attr("cy", function(d) { return d.y; })
    .call(drag);

function tick() {
    link.attr("x1", function(d) { return d.source.x; })
        .attr("y1", function(d) { return d.source.y; })
        .attr("x2", function(d) { return d.target.x; })
        .attr("y2", function(d) { return d.target.y; });

    node.attr("cx", function(d) { return d.x; })
        .attr("cy", function(d) { return d.y; });
}

/*Generovanie troch kruhov*/
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


/*Generovanie tabulky */

var matrix = [
    [11975, 5871, 8916, 2868],
    [ 1951, 10048, 2060, 6171],
    [ 8010, 16145, 8090, 8045],
    [ 1013, 990, 940, 6907]
];

var tr = d3.select("body").append("table").selectAll("tr")
    .data(matrix)
    .enter().append("tr");

var td = tr.selectAll("td")
    .data(function (d) {
        return d;
    })
    .enter().append("td")
    .text(function (d) {
        return d;
    });


d3.select("table").attr("border", 1)
    .attr("align", "left");