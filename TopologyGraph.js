var data = [
    [30,30],
    [50,50],
    [70,70]
];

var radius = 30;

var width = 500;
var height = 500;

var x = d3.scale.linear().domain([0, 100]).range([0, width]);
var y = d3.scale.linear().domain([0, 100]).range([0, height]);


var svg = d3.select("body").append("svg").attr("width", width).attr("height", height)
    .attr("position", "absolute")
    .attr("top", "50px")
    .attr("left", "100px");

var circle = svg.selectAll("circle").data(data).enter().append("circle");

circle.attr("cx", function(d){return d[0] - radius})
    .attr("cy", function(d) {return d[1] - radius})
    .attr("transform", function(d) {return "translate(" + (x(d[0])-radius) + "," + (y(d[1])-radius) + ")"})
    .attr("r", 0)
    .transition()
    .attr("r", radius);

    var matrix = [
        [11975,  5871, 8916, 2868],
        [ 1951, 10048, 2060, 6171],
        [ 8010, 16145, 8090, 8045],
        [ 1013,   990,  940, 6907]
    ];

    var tr = d3.select("body").append("table").selectAll("tr")
        .data(matrix)
        .enter().append("tr");

    var td = tr.selectAll("td")
        .data(function(d) { return d; })
        .enter().append("td")
        .text(function(d) { return d; });


d3.select("table").attr("border", 1)
                  .attr("align", "left");