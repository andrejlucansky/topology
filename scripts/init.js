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
 * This is the main JavaScript file of the project. It should contain initialization of the graph, bound events
 * and other necessary tasks which should be executed before visualization can be started.
 *
 * All functions and variables must be encapsulated inside the anonymous function, in order to not interfere with other global functions.
 */
(function (window, document, $, undefined) {
    /**
     * =================================================================================================================
     * Initiation
     * =================================================================================================================
     */

    $(window).load(function () {
        var graphElementId = "graph";
        var graphElementWrapper;

        //create new graph and configuration
        var graph = new Graph(graphElementId);
        //var menu = new Menu().init();           //removing commentary will create experimental menu in the top left corner of the visualization.

        //set graph properties
        if (typeof  Liferay != "undefined") {
            graph.imagePath = "/Topology-portlet/images/";
            graphElementWrapper = $("#" + graphElementId).parent().parent();
        }
        else {
            graph.imagePath = "../images/";
            graphElementWrapper = $(window);
        }

        //set height and width of the graph div element
        graphElementWrapper.css("overflow", "hidden");
        graphElementWrapper.width() == 0 ? $("#" + graphElementId).outerWidth($(window).width()) : $("#" + graphElementId).outerWidth(graphElementWrapper.width());
        graphElementWrapper.height() == 0 ? $("#" + graphElementId).outerHeight($(window).height()) : $("#" + graphElementId).outerHeight(graphElementWrapper.height());

        $(window).resize(function () {
            resize(graph, graphElementWrapper.width(), graphElementWrapper.height());
        })

        //bind Liferay events
        if (typeof Liferay !== "undefined") {
            Liferay.on('updatedLayout', function (event) {
                resize(graph, graphElementWrapper.width(), graphElementWrapper.height());
            });

            Liferay.on('time_timestamps', function (event) {
                ;
                graph.updateLinks(event.to);
                graph.updateRoles(event.to);
            });

            Liferay.on('time_init', function (event) {
                if (event.id == "topology") {
                    graph.init(event);
                }
            })
        }

        //initiatiate attributes necessary for events
        graph.preInit();

        //bind topology graph events
        subnetworkLineMouseDown(graph);
        drag(graph);
        zoom(graph);
        nodeZoom(graph);
        routerDblClick(graph);
        mouseOut(graph);
        mouseOver(graph);
        nodeMouseMove(graph);
        subnetworkLineMouseMove(graph);
        networkLineMouseMove(graph);
        linebreakDblClick(graph);
        end(graph);

        //start graph
        if (typeof Liferay !== "undefined")
            Liferay.fire('init', {'id': "topology"});
        else {
            graph.init({"api": "http://kypotest.fi.muni.cz:8080/visualisationdata"});

            //start animation and coloring simulation - no Time Manager portlet available
            graph.startSimulation();
            console.log("Testing simulation started!");

            //on pressing Esc, stop simulation.
            window.onkeydown = function (event) {
                if (event.keyCode == 27)
                    graph.stopSimulation();
            };
        }
    });

    /**
     * =================================================================================================================
     * Initiation functions
     * =================================================================================================================
     */

    function resize(graph, width, height) {
        graph.setWidth(width);
        graph.setHeight(height);
        graph.getElement().style({'width': width + 'px', 'height': height + 'px'});
        d3.select("svg").style({'width': width + 'px', 'height': height + 'px'});
        graph.getForce().size([width, height]);
    }

    /**
     * =================================================================================================================
     * Topology graph events
     * =================================================================================================================
     */

    function subnetworkLineMouseDown(graph) {
        graph.subnetworkLineMouseDown = function (d) {
            d3.event.stopPropagation();

            var coordinates = d3.mouse(this);

            //compute coordinates of new node, taking into account pane translate vector and zoom scale
            var xx = (coordinates[0] - graph.translate[0]) / graph.scale;
            var yy = (coordinates[1] - graph.translate[1]) / graph.scale;

            //parent is set to node closest to the router
            var n = {
                "name": null,
                "id": null,

                "topologyId": graph.generateId(),
                "dataReferenceId": d.target.dataReferenceId,
                "address4": null,
                "physicalRole": "linebreak",
                "parent": d.source,
                "children": [d.target],
                "size": {
                    "width": graph.linebreakNodeSize,
                    "height": graph.linebreakNodeSize
                },
                "x": xx,
                "y": yy,
                "fixed": true
            };

            //add node as child to his parent router
            d.source.children.push(n);

            //remove old leaf from old parent
            d.source.children.splice(d.source.children.indexOf(d.target), 1);

            //set parent of old leaf to this node
            d.target.parent = n;

            graph.update();
            //To color new links immediately after creation, otherwise they would remain black until next timestamp
            graph.setLinkProperties(0);

            graph.simulate(document.getElementById(n.topologyId), "mousedown", {pointerX: d3.event.x, pointerY: d3.event.y});
        };
    }

    function drag(graph) {
        graph.drag =
            d3.behavior.drag()
                .on("dragstart", function (d) {
                    d.fixed = true;
                    d3.select(this).classed("fixed", true);
                    d3.event.sourceEvent.stopPropagation();
                })
                .on("drag", function (d) {
                    //remove tooltip
                    graph.mouseOut();

                    //compute coordinates of dragged node (NOTE: if some coordinates are wrong, it is probably because of simulate() function)
                    d.px += d3.event.dx / graph.scale;
                    d.py += d3.event.dy / graph.scale;

                    //compute coordinate of children if they are not hidden
                    if (d.physicalRole == "router") {
                        setNodePosition(d, d3.event);
                    }

                    //compute coordinates of children if they are hidden
                    if (d.physicalRole == "cloud") {
                        d._children.forEach(function (ch) {
                            ch.px += d3.event.dx / graph.scale;
                            ch.py += d3.event.dy / graph.scale;
                            setNodePosition(ch, d3.event);
                        });
                    }
                    graph.getForce().resume()
                });

        function setNodePosition(node, event) {
            if (node.children)
                node.children.forEach(function (ch) {
                    setNodePosition(ch, event);
                    ch.px += event.dx / graph.scale;
                    ch.py += event.dy / graph.scale;
                })
        }
    }

    function zoom(graph) {
        graph.zoom =
            d3.behavior.zoom()
                .x(graph.x)
                .y(graph.y)
                .scaleExtent([0.1, 10])
                .on("zoom", function () {
                    if (d3.event) {
                        graph.scale = d3.event.scale;
                        graph.translate = d3.event.translate;
                        graph.scaledNormalLength = graph.defaultNormalLength / graph.scale;
                    }

                    d3.select("svg").selectAll(".router").each(function (d) {
                        if ((graph.scale <= graph.zoomShrinkCondition && d.physicalRole == "router") || (graph.scale > graph.zoomShrinkCondition && d.physicalRole == "cloud"))
                            if (d.locked == undefined || !d.locked) {
                                graph.nodeZoom(d);
                            }
                    });

                    //remove tooltip
                    graph.mouseOut();
                    //calculate positions - graph will freeze without this
                    graph.tick();
                });
    }

    function nodeZoom(graph) {
        graph.nodeZoom = function (d) {
            if (d.children) {
                d.children.forEach(function (ch) {
                    ch.circled = false;
                });
                d._children = d.children;
                d.children = null;
                d.physicalRole = "cloud";
            } else {
                d.children = d._children;
                d._children = null;
                d.physicalRole = "router";
            }

            graph.update();
            /*To color new links immediately after creation, otherwise they would remain black until next timestamp or
             to start animation again after update, otherwise links wouldn't move until next timestamp*/
            graph.setLinkProperties(0);

            /*To show roles again after interface nodes have been displayed*/
            graph.setRoles();
        };
    }

    function routerDblClick(graph) {
        graph.routerDblClick = function (d) {
            if (!d3.event.defaultPrevented) {
                //we have 3 options. 1. lock unlock 2. lock and locked forever 3. lock and unlock only in origin state (applied now)
                if (d.locked) {
                    if (graph.scale <= graph.zoomShrinkCondition && d.lockOrigin <= graph.zoomShrinkCondition || graph.scale > graph.zoomShrinkCondition && d.lockOrigin > graph.zoomShrinkCondition) {
                        d.locked = false;
                    }
                    else {
                        d.lockOrigin = graph.scale;
                    }
                }
                else {
                    d.locked = true;
                    d.lockOrigin = graph.scale;
                }

                graph.nodeZoom(d);

                //remove tooltip
                graph.mouseOut();
            }
        };
    }

    function mouseOver(graph) {
        graph.mouseOver = function () {
            graph.tooltip
                .transition()
                .delay(500)
                .duration(500)
                .style("opacity", 1);
        }
    }


    function mouseOut(graph) {
        graph.mouseOut = function () {
            graph.tooltip
                .transition()
                .duration(0)
                .style("opacity", 0);
        }
    }

    function nodeMouseMove(graph) {
        graph.nodeMouseMove = function (d) {
            graph.tooltip
                .html(
                    "<b>Node:</b>" +
                        "<br>Name: " + d.name +
                        "<br>IPv4 address: " + d.address4 +
                        "<br>Physical role: " + d.physicalRole +
                        "<br>Logical role: " + d.logicalRole +
                        "<br>Topology Id: " + d.topologyId +
                        "<br>Id: " + d.id)
                .style("left", (d3.event.layerX + 15) + "px")
                .style("top", (d3.event.layerY + 15) + "px");
        }
    }

    function subnetworkLineMouseMove(graph) {
        graph.subnetworkLineMouseMove = function (d) {
            var interfaceIn,
                interfaceOut;

            graph.getLinks().forEach(function (l) {
                if (l.topologyId == (d.target.topologyId + "In")) {
                    interfaceIn = l;
                } else if (l.topologyId == (d.target.topologyId + "Out")) {
                    interfaceOut = l;
                }
            });

            graph.tooltip
                .html(
                    "<b>" + interfaceIn.source.name + " to " + interfaceIn.target.name + ":</b>" +
                        "<br>Number of Bits: " + interfaceIn.numberOfBits +
                        "<br>Bandwidth: " + interfaceIn.bandwidth + " " + interfaceIn.bwUnit +
                        "<br>Load: " + graph.roundNumber(interfaceIn.load, 2) +
                        "<br>Speed: " + graph.roundNumber(interfaceIn.speed, 2) +
                        "<br>" +
                        "<br><b>" + interfaceIn.target.name + " to " + interfaceIn.source.name + ":</b>" +
                        "<br>Number of Bits: " + interfaceOut.numberOfBits +
                        "<br>Bandwidth: " + interfaceOut.bandwidth + " " + interfaceOut.bwUnit +
                        "<br>Load: " + graph.roundNumber(interfaceOut.load, 2) +
                        "<br>Speed: " + graph.roundNumber(interfaceOut.speed, 2))
                .style("left", (d3.event.layerX + 15) + "px")
                .style("top", (d3.event.layerY + 15) + "px");
        }
    }

    function networkLineMouseMove(graph) {
        graph.networkLineMouseMove = function (d) {
            var sourceToTargetLine,
                targetToSourceLine;

            graph.getLinks().forEach(function (l) {
                if (l != d && l.source == d.source && l.target == d.target)
                    sourceToTargetLine = l;
                else if (l.source == d.target && l.target == d.source)
                    targetToSourceLine = l;

            })

            graph.tooltip
                .html(
                    "<b>" + sourceToTargetLine.source.name + " to " + sourceToTargetLine.target.name + ":</b>" +
                        "<br>Number of Bits: " + sourceToTargetLine.numberOfBits +
                        "<br>Bandwidth: " + sourceToTargetLine.bandwidth + " " + sourceToTargetLine.bwUnit +
                        "<br>Load: " + graph.roundNumber(sourceToTargetLine.load, 2) +
                        "<br>Speed: " + graph.roundNumber(sourceToTargetLine.speed, 2) +
                        "<br>" +
                        "<br><b>" + targetToSourceLine.source.name + " to " + targetToSourceLine.target.name + ":</b>" +
                        "<br>Number of Bits: " + targetToSourceLine.numberOfBits +
                        "<br>Bandwidth: " + targetToSourceLine.bandwidth + " " + targetToSourceLine.bwUnit +
                        "<br>Load: " + graph.roundNumber(targetToSourceLine.load, 2) +
                        "<br>Speed: " + graph.roundNumber(targetToSourceLine.speed, 2))
                .style("left", (d3.event.layerX + 15) + "px")
                .style("top", (d3.event.layerY + 15) + "px");
        }
    }

    function linebreakDblClick(graph) {
        graph.linebreakDblClick = function (d) {

            //remove node from parental children list
            d.parent.children.splice(d.parent.children.indexOf(d), 1);

            //move all children from node to parent
            //change parent of all children to their new parent
            d.children.forEach(function (n) {
                d.parent.children.push(n);
                n.parent = d.parent;
            });

            graph.update();
            //To start animation again after update, otherwise links wouldn't move until next timestamp
            graph.setLinkProperties(0);
        };
    }

    function end(graph) {
        graph.end = function () {
            for (var i = 0; i < graph.getNodes().length; i++) {
                graph.getNodes()[i].fixed = true;
            }
            d3.selectAll(".node").classed("fixed", true);
        }
    }
})(window, document, jQuery);