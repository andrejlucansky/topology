/*
 * Copyright (c) 2014, Masaryk University
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

/*
 * @author Andrej Lucansky, Masaryk Univeristy, Brno
 * @version 1.0
 *
 * This is experimental script file. It will draw 8 blue circles on screen.
 */

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