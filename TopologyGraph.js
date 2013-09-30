/*
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
*/

var nodes = d3.range(13).map(function(){
    return {};
})

var links = [
    {"source": 0, "target": 1},
    {"source": 1, "target": 0},

    {"source": 1, "target": 2},
    {"source": 2, "target": 1},

    {"source": 2, "target": 0},
    {"source": 0, "target": 2},

    {"source": 1, "target": 3},
    {"source": 3, "target": 1},

    {"source": 3, "target": 2},
    {"source": 2, "target": 3},

    {"source": 3, "target": 4},
    {"source": 4, "target": 3},

    {"source": 4, "target": 5},
    {"source": 5, "target": 4},

    {"source": 5, "target": 6},
    {"source": 6, "target": 5},

    {"source": 5, "target": 7},
    {"source": 7, "target": 5},

    {"source": 6, "target": 7},
    {"source": 7, "target": 6},

    {"source": 6, "target": 8},
    {"source": 8, "target": 6},

    {"source": 7, "target": 8},
    {"source": 8, "target": 7},

    {"source": 9, "target": 4},
    {"source": 4, "target": 9},

    {"source": 9, "target": 11},
    {"source": 11, "target": 9},

    {"source": 9, "target": 10},
    {"source": 10, "target": 9},

    {"source": 10, "target": 11},
    {"source": 11, "target": 10},

    {"source": 11, "target": 12},
    {"source": 12, "target": 11},

    {"source": 12, "target": 10},
    {"source": 10, "target": 12}
];

var width = 800;
var height = 800;

var svg = d3.select("body").append("svg")
    .attr("width", width)
    .attr("height", height);

var force = d3.layout.force().nodes(nodes).links(links).size([width,height])
    .on("tick", tick)
    .linkDistance(50)
    .charge(-500)
    .start();

var drag = force.drag()
    .on("dragstart", dragstart);
    //.on("dragend", function(d){d.fixed = false; d3.select(this).classed("fixed", false);})

function dragstart(d) {

    d.fixed = true;
    d3.select(this).classed("fixed", true);
}

var link = svg.selectAll(".link").data(links).enter().append("path")
    .attr("class", "link");

var node = svg.selectAll(".node").data(nodes).enter().append("circle")
    .attr("class", "node")
    .attr("r", 12)
    .attr("cx", function(d) { return d.x; })
    .attr("cy", function(d) { return d.y; })
    .call(drag);

function tick() {
    link.attr("d", function(d) {
        var dx = d.target.x - d.source.x,
            dy = d.target.y - d.source.y,
            dr = Math.sqrt(dx * dx + dy * dy);
        return "M" + d.source.x + "," + d.source.y + "A" + dr + "," + dr + " 0 0,1 " + d.target.x + "," + d.target.y;
    });

    node.attr("cx", function(d) { return d.x; })
        .attr("cy", function(d) { return d.y; });

/*   // this part of code is working for straight lines between nodes - obsolete
     link.attr("x1", function(d) { return d.source.x; })
     .attr("y1", function(d) { return d.source.y; })
     .attr("x2", function(d) { return d.target.x; })
     .attr("y2", function(d) { return d.target.y; });*/
}