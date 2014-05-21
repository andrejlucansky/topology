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
 * This is the graph visualization core. It contains drawing logic of the visualization, constants and settings.
 * Graph events are only mock objects and should be bound in init.js file
 */
function Graph(id) {
    /*
     * This section contains all necessary constants required to set up a graph. Every setting
     * of the graph should be available here.
     */
    this.imagePath;
    this.width;
    this.height;

    this.linebreakNodeSize = 10;
    this.scale = 1;
    this.translate = [0, 0];
    this.defaultNormalLength = 2;
    this.scaledNormalLength = this.defaultNormalLength;
    this.zoomShrinkCondition = 1;

    this.x;
    this.y;

    this.graphElement = d3.select("#" + id);
    this.tooltip = this.graphElement.append("div").attr("class", "tooltip").style("opacity", 0);

    //mock events
    this.subnetworkLineMouseDown = function(){};
    this.zoom = d3.behavior.zoom();
    this.drag = d3.behavior.drag();
    this.nodeZoom = function(){};
    this.routerDblClick = function(){};
    this.mouseOver = function(){};
    this.mouseOut = function(){};
    this.nodeMouseMove = function(){};
    this.subnetworkLineMouseMove = function(){};
    this.networkLineMouseMove = function(){};
    this.linebreakDblClick = function(){};

    //getters for private attributes
    this.getLinks = function(){
        return links;
    }

    this.getNodes = function(){
        return nodes;
    }

    this.getForce = function(){
        return force;
    }

    var nodeSize = 48,

        root,
        timestamps,
        linkUsage,
        topologyRoles,
        simulationInterval,
        simulationIntervalLength = 5000,
        defaultSpeed = 1105,
        performanceTest = false,
        graph = this,
        imageFormat = ".svg",
        svg = this.graphElement.append("svg"),
        link = svg.selectAll(".link"),
        node = svg.selectAll(".node"),
        router = svg.selectAll(".router"),
        nodes,
        links,
        force,

        connectionString,
        topologyConnectionString,
        linkUsageConnectionString,
        logicalRolesConnectionString,
        timestampsConnectionString;

    var cloudBackground = {
        "stroke": "#3D3D3F",
        "strokeWidth": function () {
            return 2.5 / this.multiplier;
        },
        "fill": "none",
        "path": "M7343.97,7179.669 c0.99-5.167,1.526-10.494,1.526-15.949c0-46.603-37.779-84.382-84.383-84.382c-28.39,0-53.483,14.031-68.775,35.521 c-9.882-4.058-20.688-6.31-32.031-6.31c-44.044,0-80.189,33.75-84.026,76.795c-1.733-0.134-3.48-0.223-5.25-0.223 c-37.149,0-67.268,30.116-67.268,67.267c0,37.151,30.119,67.267,67.268,67.267c2.698,0,5.356-0.178,7.97-0.485h245.84 c39.248,0,71.064-31.816,71.064-71.065C7395.906,7215.492,7373.922,7188.025,7343.97,7179.669L7343.97,7179.669z",
        "scale": function () {
            return (1.5452539 * this.multiplier);
        },
        "translateX": function () {
            return (-10725.828 * this.multiplier);
        },
        "translateY": function () {
            return (-10725.055 * this.multiplier);
        },
        "height": function () {
            return (850 * this.multiplier);
        },
        "width": function () {
            return (900 * this.multiplier);
        },
        "minimalHeight": function () {
            return 850;
        },
        "multiplier": 0.8
    };

    var colors = {
        "red": {
            "start": 255,
            "end": 255
        },
        "green": {
            "start": 70,
            "end": 190
        },
        "blue": {
            "start": 46,
            "end": 106
        },
        "intervals": 5
    };

    this.preInit = function(){
        graph.width = parseInt(d3.select("#" + id).style("width"));
        graph.height = parseInt(d3.select("#" + id).style("height"));

        graph.x = d3.scale.linear()
            .domain([0, graph.width])
            .range([0, graph.width]);

        graph.y = d3.scale.linear()
            .domain([0, graph.height])
            .range([0, graph.height]);

        force = d3.layout.force()
            .size([graph.width, graph.height])
            .on("tick", graph.tick)
            .on("end", end)
            .linkDistance(function (d) {
                if (d.type == "internetworking" || d.type == "internetworkingOverlay")
                    return 500;
                else
                    return 80;
            })
            .charge(-5000)
            .chargeDistance(1000);
    }

    this.init = function (event) {
        svg.style({'width': graph.width + 'px', 'height': graph.height + 'px', 'overflow': 'hidden'});
        svg.call(graph.zoom).on("dblclick.zoom", null);

        connectionString = event.api,
        topologyConnectionString = connectionString + "/network/topology",
        linkUsageConnectionString = connectionString + "/network/usage/link",
        logicalRolesConnectionString = connectionString + "/network/topology/logicalRoles",
        timestampsConnectionString = connectionString + "/time/all-timestamps";

        d3.json(timestampsConnectionString, function (json) {
            timestamps = json.timestamps;
        });

        d3.json(topologyConnectionString, function (json) {
            if (performanceTest)
                root = createTestingNodesAndLinks();
            else
                root = json;

            graph.update();
            graph.zoom.event(svg);

            if (event.to == undefined) {
                console.log("Testing simulation started!");
                //startSimulation();
            }
        });

        //on pressing Esc, stop simulation.
        window.onkeydown = function (event) {
            if (event.keyCode == 27)
                stopSimulation();
        };
    };

    this.resize = function () {
        graph.graphElement.style({'width': graph.width + 'px', 'height': graph.height + 'px'});
        svg.style({'width': graph.width + 'px', 'height': graph.height + 'px'});
        force.size([graph.width, graph.height]);
    };


    function getChildren(root) {
        var nodes = [], i = 0;

        function recurse(node, parent) {
            if (node.children) node.children.forEach(function (ch) {
                recurse(ch, node)
            });
            //if it doesn't exist already, because we would be rewriting our own data otherwise
            if (!node.size) node.size = {"width": nodeSize, "height": nodeSize};
            if (!node.dataReferenceId) node.dataReferenceId = node.topologyId;
            node.parent = parent;

            nodes.push(node);
        }

        recurse(root, null);

        //remove root node
        nodes.splice(nodes.indexOf(root), 1);
        return nodes;
    }

//this function could return node index in nodes array, but it easier to return whole node reference
    function findNodeById(topologyId) {
        for (var i = 0; i < nodes.length; i++) {
            if (nodes[i].topologyId == topologyId)
                return nodes[i];
        }
    }

    function end() {
        for (var i = 0; i < nodes.length; i++) {
            nodes[i].fixed = true;
        }
        d3.selectAll(".node").classed("fixed", true);
    }

    this.update = function() {
        nodes = getChildren(root),
            links = d3.layout.tree().links(nodes);

        createLinks();
        createNodes();

        //start force graph simulation
        force.nodes(nodes)
            .links(links)
            .start();

        //bind doubleclick for routers to be collabsible
        svg.selectAll(".router").on("dblclick", graph.routerDblClick);
        //bind doubleclick for line breaks to disappear
        svg.selectAll(".linebreak").on("dblclick", graph.linebreakDblClick);
    }

    /**
     * Why link topologyIDs are so weird? Because if they were generated with every update, data wouldn't match associated lines after the update,
     * therefore they would be redrawn every time update is called. This way, only new lines are added, old ones are removed, and those which should stay are not redrawn again.
     * This IDs work because target.topologyId is always the same -> comes from database, as well as id for router links and router nodes.
     *
     * This means, all nodes and all lines are drawn and erased only when needed. No extra operations. This should increase performance, because we do not edit DOM structure every time we call update.
     */
    function createLinks() {
        /**
         * Before every update, all animation intervals must be removed. Otherwise, they would be running forever, becuase update removes references to these intervals.
         * This is the price you have to pay for using D3.tree, because it creates new set of links on every node structure update.
         */
        link.each(function (d) {
            clearInterval(d.interval);
            clearTimeout(d.timeout);
        });

        links.forEach(function (l) {
            //set additional properties for original links
            l.topologyId = l.target.topologyId + "In";
            l.type = "interfaceIn";

            //create link in opposite direction
            links.push({"source": l.source, "target": l.target, "type": "interfaceOut", "topologyId": l.target.topologyId + "Out"});

            //add invisible overlay link to the list
            links.push({"source": l.source, "target": l.target, "type": "interfaceOverlay", "topologyId": l.target.topologyId + "Overlay"});
        });

        //add links which are between routers
        root.links.forEach(function (l) {
            var source = findNodeById(l.source),
                target = findNodeById(l.target);

            links.push({"source": source, "target": target, "type": "internetworking", "topologyId": l.id});
        })

        //add overlay on internetworking links
        links.forEach(function (d) {
            if (d.type == "internetworking" && d.source.id < d.target.id) {
                links.push({"source": d.source, "target": d.target, "type": "internetworkingOverlay", "topologyId": d.topologyId + "Overlay"});
            }

        })

        link = link.data(links, function (d) {
            return d.topologyId;
        });

        link.exit().remove();

        link.enter()
            .insert("line", ".node")
            .attr("class", function (d) {
                return "link " + d.type;
            })
            .attr("sourceid", function (d) {
                return d.source.topologyId;
            })
            .attr("targetid", function (d) {
                return d.target.topologyId;
            })
            .attr("id", function (d) {
                return d.topologyId;
            });

        /**
         * Data liniek ktore si vymyslim sa pri update vzdy zmazu, pretoze sa vyrabaju nove ciste links(data) v metode getChildren z noveho setu uzlov.
         * Preto animation, interval, atd. sa vzdy resetne po update. S tym treba pocitat a pozor na to.
         */
        links.forEach(function (d) {
            //add link properties
            d.animation = new Animation();
            d.animation.speed = 1055;
            d.interval = undefined;
            d.timeout = undefined;

            d.stopwatch = new Stopwatch();
            d.colorScale = new RGBScale(colors);
        })

        link.filter(".internetworking, .interfaceIn, .interfaceOut").each(function () {
            d3.select(this).attr("stroke-width", 2)
                .attr("stroke-width", 2)
                .attr("stroke-dasharray", "3, 2")
                .attr("stroke", "rgba(0, 0, 0, 1)");
        })

        link.filter(".interfaceOverlay").each(function (d) {
            d3.select(this)
                .on("mouseover", graph.mouseOver)
                .on("mousemove", graph.subnetworkLineMouseMove)
                .on("mouseout", graph.mouseOut)
                .on("mousedown", graph.subnetworkLineMouseDown);
        });

        link.filter(".internetworkingOverlay").each(function (d) {
            d3.select(this)
                .on("mouseover", graph.mouseOver)
                .on("mousemove", graph.networkLineMouseMove)
                .on("mouseout", graph.mouseOut);
        });
    }

    function createNodes() {
        node = node.data(nodes, function (d) {
            return d.topologyId;
        });

        node.exit().remove();

        //update router node icon on collapse
        node.select("image").attr("xlink:href", function (d) {
            return graph.imagePath + d.physicalRole + imageFormat;
        });

        node.each(function (d) {
            if (d.physicalRole == "cloud") {
                svg.select("#background" + d.topologyId).remove();
            }
            if (d.physicalRole == "router" && svg.select("#background" + d.topologyId).empty()) {
                insertCloudBackground(d);
            }
        });

        var group = node.enter()
            .append("g")
            .attr("class", function (d) {
                if (d.physicalRole == "router") {
                    return "node router";
                }
                else {
                    return "node interface " + d.physicalRole;
                }
            })
            .attr("index", function (d) {
                return d.index;
            })
            .attr("id", function (d) {
                return d.topologyId;
            })
            .call(graph.drag);

        group.append("image")
            .attr("xlink:href", function (d) {
                return graph.imagePath + d.physicalRole + imageFormat;
            })
            .attr("x", function (d) {
                return -(d.size.width / 2);
            })
            .attr("y", function (d) {
                return -(d.size.height / 2);
            })
            .attr("width", function (d) {
                return d.size.width;
            })
            .attr("height", function (d) {
                return d.size.height;
            });

        group.append("text")
            .attr("dx", 25)
            .attr("dy", function (d) {
                return -(d.size.height / 8)
            })
            .attr("class", "label")
            .text(function (d) {
                if (d.name == null && d.address4 == null)
                    d3.select(this).remove();
                else {
                    var description = "";

                    if (d.name != null)
                        description += d.name;
                    if (d.address4 != null)
                        description += "/" + d.address4;
                    return description;
                }
            });

        group.filter(".router").each(function (d) {
            insertCloudBackground(d);
        });

        //match same interfaces and circle them with same color
        insertCircles();

        //this sorts router nodes to the top of all nodes in document. It was used in first version of cloud background. Now just for fun.
        group.sort(function (a, b) {
            if (a.physicalRole == "router" && b.physicalRole != "router")
                return -1;
            else
                return 1;
        });

        group.filter(":not(.linebreak)")
            .on("mouseover", graph.mouseOver)
            .on("mousemove", graph.nodeMouseMove)
            .on("mouseout", graph.mouseOut);
    }

    function insertCircles() {
        var hostNodes = [
            []
        ];

        nodes.forEach(function (d) {
            if (d.hostNodeId != undefined) {
                var found = false;
                for (var i = 0; i < hostNodes.length; i++) {
                    if (d.hostNodeId == hostNodes[i][0]) {

                        found = true;
                        hostNodes[i][1] = hostNodes[i][1] + 1;
                    }
                }

                if (!found) {
                    hostNodes.push([]);
                    hostNodes[hostNodes.length - 1].push(d.hostNodeId);
                    hostNodes[hostNodes.length - 1].push(1);
                }
            }
        });

        hostNodes.forEach(function (h) {
            var color = "hsla(" + Math.random() * 360 + ",100%," + Math.max(Math.random() * 100, 25) + "%, 0.75)";

            node.filter(".interface").each(function (d) {
                if (h[1] > 1 && d.hostNodeId == h[0] && !d.circled) {

                    d3.select(this)
                        .insert("circle", ":first-child")
                        .attr("class", "hostnode")
                        .attr("r", 25)
                        .attr("fill", d.circleColor ? d.circleColor : color);

                    d.circled = true;

                    if (d.circleColor == undefined)
                        d.circleColor = color;
                } else if (h[1] <= 1 && d.hostNodeId == h[0] && d.circled) {
                    d.circled = false;

                    d3.select(this).select("circle").remove();
                }
            })
        })
    }

    function insertCloudBackground(d) {
        svg.insert("g", ":first-child")
            .attr("class", function () {
                return "cloud_bg ";
            })
            .attr("id", function () {
                return "background" + d.topologyId;
            })
            .append("g")
            .attr("transform", "matrix(" + cloudBackground.scale() + ",0,0," + cloudBackground.scale() + "," + cloudBackground.translateX() + "," + cloudBackground.translateY() + ")")
            .append("path")
            .attr("d", cloudBackground.path)
            .attr("stroke", cloudBackground.stroke)
            .attr("stroke-width", cloudBackground.strokeWidth())
            .attr("fill", cloudBackground.fill);
    }


    this.setNodePosition = function(node, event) {
        if (node.children)
            node.children.forEach(function (ch) {
                graph.setNodePosition(ch, event);
                ch.px += event.dx / graph.scale;
                ch.py += event.dy / graph.scale;
            })
    }

    /**
     * This function is called every time the graph needs to be refreshed. It computes new positions of nodes in the layout as well as
     * starting and ending points of all links(lines) between these nodes.
     */
    this.tick = function() {
        //refreshes position of all nodes in graph
        node.attr("transform", function (d) {
            //this changes position of network clouds
            var nodeBackground = svg.selectAll("#background" + d.topologyId);
            nodeBackground.attr("transform", function () {
                return "translate(" + (graph.x(d.x) - (cloudBackground.width() * graph.scale) / 2) + "," + (graph.y(d.y) - (cloudBackground.height() * graph.scale) / 2) + ")";
            });
            nodeBackground.select("g").attr("transform", function () {
                return "matrix(" + (cloudBackground.scale() * graph.scale) + ",0,0," + (cloudBackground.scale() * graph.scale) + "," + (cloudBackground.translateX() * graph.scale) + "," + (cloudBackground.translateY() * graph.scale) + ")";
            });
            nodeBackground.select("path").attr("stroke-width", cloudBackground.strokeWidth() / graph.scale);

            return "translate(" + graph.x(d.x) + "," + graph.y(d.y) + ")";
        });


        //refreshes starting and ending points of all links in graph
        link
            .attr("x1", function (d) {
                d.sourceNormalAttributes = getNormalAttributes(d.source, d.target, d.type, "out");
                return getScaledNormalEndCoordinate(d.sourceNormalAttributes.start.x, d.sourceNormalAttributes.end.x, d.sourceNormalAttributes.ratio, graph.x);
            })
            .attr("y1", function (d) {
                return  getScaledNormalEndCoordinate(d.sourceNormalAttributes.start.y, d.sourceNormalAttributes.end.y, d.sourceNormalAttributes.ratio, graph.y);
            })
            .attr("x2", function (d) {
                d.targetNormalAttributes = getNormalAttributes(d.target, d.source, d.type, "in");
                return   getScaledNormalEndCoordinate(d.targetNormalAttributes.start.x, d.targetNormalAttributes.end.x, d.targetNormalAttributes.ratio, graph.x);
            })
            .attr("y2", function (d) {
                return   getScaledNormalEndCoordinate(d.targetNormalAttributes.start.y, d.targetNormalAttributes.end.y, d.targetNormalAttributes.ratio, graph.y);
            });
    }

    /**
     * Function getNormalAttributes computes properties of normal vector belonging to a line segment. In graph, this line
     * segment is represented as a link between source and target nodes. Every link in graph can have two normal vectors,
     * each on the opposite end of the link. Direction of these vectors is computed according to the link properties,
     * such as source, type and traffic direction.
     * @param source Starting point of the line segment.
     * @param target Ending point of the line segment.
     * @param type Type of a link for which the normal attributes should be computed, e.g. interfaceIn, interfaceOut or overlay.
     * @param traffic Direction of the link. This direction can be only "in" or "out".
     * @returns Object containing starting point of the normal vector, ending point of the normal vector and the ratio
     *          for which the length of the normal vector should be shortened. Ending point is in the same distance from
     *          the starting point as is the length of the line segment for which these attributes are computed.
     */
    function getNormalAttributes(source, target, type, traffic) {
        var normalEndX,
            normalEndY,
            vectorDirection = getVectorDirection(type, traffic);

        if (vectorDirection == null)
            return {"start": source, "end": {"x": null, "y": null}, "ratio": null};

        if (vectorDirection == "right") {
            normalEndX = source.y + source.x - target.y;
            normalEndY = source.y - source.x + target.x;
        }
        else {
            normalEndX = source.x - source.y + target.y;
            normalEndY = source.x + source.y - target.x;
        }

        // pytagorova veta na vypocet dlzky ab
        var lineLengthSquared = Math.pow((target.x - source.x), 2) + Math.pow((target.y - source.y), 2),
            scaledNormalLengthSquared = Math.pow(graph.scaledNormalLength, 2),
            ratio = scaledNormalLengthSquared / lineLengthSquared;

        return {"start": source, "end": {"x": normalEndX, "y": normalEndY}, "ratio": ratio};
    }

    /**
     * Normal vectors of line segment between nodes are being used to compute starting/ending points of links coming to and
     * from the node in a graph. These normal vectors have length of the line which they belong to.
     * Function getScaledNormalEndCoordinate computes new ending point of the given normal vector to adjust vectors length.
     * This new ending point is retrieved by scaling original normal vector length by the given ratio.
     * @param normalStart Start of the normal vector and also the starting/ending point of the line segment which
     *                    the normal belongs to.
     * @param normalEnd End of the normal vector, which is in the same distance from the normalStart as is the length of
     *                  the line segment which the vector belongs to.
     * @param ratio Ratio for which the length of the normal vector should be shortened.
     * @param linearTransformation Function used to translate resulting coordinate to the range of a layout the graph is using.
     * @returns X or y coordinate of the new normal vector end, which was computed and transformed to fit the graph
     *          layout range.
     */
    function getScaledNormalEndCoordinate(normalStart, normalEnd, ratio, linearTransformation) {
        if (normalEnd == null) {
            return linearTransformation(normalStart);
        }

        var scaledNormalEnd;
        if (normalEnd >= normalStart)
            scaledNormalEnd = Math.sqrt(Math.pow((normalEnd - normalStart), 2) * ratio) + normalStart;
        else
            scaledNormalEnd = -(Math.sqrt(Math.pow((normalStart - normalEnd), 2) * ratio)) + normalStart;

        return linearTransformation(scaledNormalEnd);
    }

    function getVectorDirection(type, direction) {
        var result;

        switch (type) {
            //invisible overlay lines should end in centers of their source and target nodes, without any translation applied to them
            case "interfaceOverlay":
                result = null;
                break;
            //invisible overlay lines should end in centers of their source and target nodes, without any translation applied to them
            case "internetworkingOverlay":
                result = null;
                break;
            //every interfaceIn line should be aligned to the right from the source and to the left from the target side
            case "interfaceIn":
                if (direction == "out")
                    result = "right";
                else
                    result = "left";
                break;
            //every interfaceOut line should be aligned to the left from the source and to the right from the target side
            case "interfaceOut":
                if (direction == "in")
                    result = "right";
                else
                    result = "left";
                break;
            //links between routers should be always aligned to the right from the source and to the left from the target
            case "internetworking":
                if (direction == "out")
                    result = "right";
                else
                    result = "left";
                break;
            //if all else fails - lines should be centered to their source and target nodes, without any translation applied to them
            default:
                result = null;
        }

        return result;
    }

    function startSimulation() {
        var timestampIndex = -1;

        simulationInterval = window.setInterval(function () {
            timestampIndex++;
            if (timestampIndex >= timestamps.length - 1)
                window.clearInterval(simulationInterval);

            graph.updateLinks(timestamps[timestampIndex]);
            graph.updateRoles(timestamps[timestampIndex]);
        }, simulationIntervalLength);
    }

    function stopSimulation() {
        links.forEach(function (d) {
            window.clearInterval(d.interval);
            window.clearInterval(simulationInterval);
        })
    }

    /**
     * This function is used to update speed and color of links connecting nodes in the graph.
     * @param timestamp Timestamp is representing time interval in simulation. In this function, timestamp is used to
     * define interval, for which speed and color of links should be shown to the user.
     */
    this.updateLinks = function (timestamp) {
        d3.json(linkUsageConnectionString + "?timestamp=" + timestamp, function (json) {
            linkUsage = json;

            graph.setLinkProperties(500);
        });
    }

    /**
     * This function is used to update images appended to interfaces in the graph. Theese images represent logical roles of
     * theese interfaces in the attack simulation.
     * @param timestamp Timestamp is representing time interval in simulation. In this function, timestamp is used to
     * define interval, for which logical roles should be shown to the user.
     */
    this.updateRoles = function (timestamp) {
        d3.json(logicalRolesConnectionString + "?absoluteTimestamp=" + timestamp, function (json) {
            topologyRoles = json;
            graph.setRoles();
        });
    }

    this.setRoles = function() {
        if (topologyRoles) {
            var interfaces = svg.selectAll(".interface");
            interfaces.each(function (d) {
                var interface = d3.select(this);
                var newImageSource;

                for (var i = 0; i < topologyRoles.interfaceRoles.length; i++) {
                    if (d.topologyId == topologyRoles.interfaceRoles[i].topologyId) {
                        if (topologyRoles.interfaceRoles[i].role != null) {
                            newImageSource = graph.imagePath + topologyRoles.interfaceRoles[i].role + imageFormat;
                        }
                        d.logicalRole = topologyRoles.interfaceRoles[i].role;
                    }
                }

                var interfaceRole = interface.select(".role");

                //if role should be assigned
                if (newImageSource != undefined) {
                    //check if there already is an image element and: 1. if it not, append it
                    if (interfaceRole.empty()) {
                        interface.append("image")
                            .attr("xlink:href", newImageSource)
                            .attr("class", "role")
                            .attr("x", function (d) {
                                return d.size.width / 2;
                            })
                            .attr("y", function (d) {
                                return d.size.height / 32;
                            })
                            .attr("width", function (d) {
                                return d.size.width / 10 * 7;
                            })
                            .attr("height", function (d) {
                                return d.size.height / 10 * 7;
                            });
                    }
                    // 2. if it is, change source reference
                    else {
                        if (interfaceRole.attr("xlink:href") != newImageSource) {
                            interfaceRole.attr("xlink:href", newImageSource);
                        }
                    }
                }
                //else remove image element, because it wont be used
                else {
                    interfaceRole.remove();
                }
            });
        }
    }

    this.setLinkProperties = function(transitionLength) {
        if (linkUsage)
            link.each(function (d) {
                var l = d3.select(this);
                if (d.type != "interfaceOverlay" && d.type != "internetworkingOverlay") {
                    getLinkUsage(d, linkUsage);
                    colorLink(l, d, transitionLength);
                    animateLink(l, d);
                }
            });
    }

    function getLinkUsage(d, json) {
        switch (d.type) {
            case ("internetworking"):
            {
                for (var i = 0; i < json.routerLinks.length; i++) {
                    if (d.topologyId == json.routerLinks[i].id) {
                        d.load = json.routerLinks[i].load;
                        d.previousSpeed = d.speed;
                        d.speed = json.routerLinks[i].speed;

                        d.numberOfBits = json.routerLinks[i].numberOfBits;
                        d.bandwidth = json.routerLinks[i].bandwidth;
                        d.bwUnit = json.routerLinks[i].bwUnit;
                    }
                    /*                else
                     {
                     d.load = 1;
                     d.previousSpeed = 0;
                     d.speed = 1;
                     }*/
                }
                break;
            }
            case ("interfaceOut"):
            {
                for (var i = 0; i < json.interfaceLinksOut.length; i++) {
                    if (d.target.dataReferenceId == json.interfaceLinksOut[i].interfaceTopologyId) {
                        d.load = json.interfaceLinksOut[i].load;
                        d.previousSpeed = d.speed;
                        d.speed = json.interfaceLinksOut[i].speed;

                        d.numberOfBits = json.interfaceLinksOut[i].numberOfBits;
                        d.bandwidth = json.interfaceLinksOut[i].bandwidth;
                        d.bwUnit = json.interfaceLinksOut[i].bwUnit;
                    }
                    /*                else
                     {
                     d.load = 1;
                     d.previousSpeed = 0;
                     d.speed = 1;
                     }*/
                }
                break;
            }
            case ("interfaceIn") :
            {
                for (var i = 0; i < json.interfaceLinksIn.length; i++) {
                    if (d.target.dataReferenceId == json.interfaceLinksIn[i].interfaceTopologyId) {
                        d.load = json.interfaceLinksIn[i].load;
                        d.previousSpeed = d.speed;
                        d.speed = json.interfaceLinksIn[i].speed;

                        d.numberOfBits = json.interfaceLinksIn[i].numberOfBits;
                        d.bandwidth = json.interfaceLinksIn[i].bandwidth;
                        d.bwUnit = json.interfaceLinksIn[i].bwUnit;
                    }
                    /*                else
                     {
                     d.load = 1;
                     d.previousSpeed = 0;
                     d.speed = 1;
                     }*/
                }
                break;
            }
            default :
            {
                d.load = 0;
                d.previousSpeed = d.speed;
                d.speed = 0;

                d.numberOfBits = undefined;
                d.bandwidth = undefined;
                d.bwUnit = undefined;
            }
        }
    }

    function colorLink(l, d, transitionLength) {
        l.transition()
            .duration(transitionLength)
            .style("stroke", function () {
                var intervalIndex = Math.floor(d.load * colors.intervals),
                    color = d.colorScale.paint(intervalIndex);
                return color;
            });
    }

    function animateLink(l, d) {
        if (d.previousSpeed != d.speed) {
            var time = (defaultSpeed - (d.animation.speed * d.speed));

            //toto po update nema zmysel, lebo je to vynulovane, ale vola sa to pri novom timestampe
            clearInterval(d.interval);
            clearTimeout(d.timeout);
            d.stopwatch.stop();

            d.timeout = window.setTimeout(function () {
                l.style("stroke-dasharray", function () {
                    var style = d.animation.start(this, d.type);
                    return style;
                });

                d.stopwatch.start();
                d.interval = window.setInterval(function () {
                    l.style("stroke-dasharray", function () {
                        var style = d.animation.start(this, d.type);
                        return style;
                    });

                    d.stopwatch.restart();
                }, time);
            }, Math.max(time - d.stopwatch.measuredTime, 0));
        }
    }

    function Stopwatch() {
        this.startTime = undefined;
        this.measuredTime = 0;

        this.start = function () {
            this.startTime = new Date().getTime();
        }

        this.restart = function () {
            this.start();
        }

        this.stop = function () {
            this.measuredTime = this.duration();
        }

        this.duration = function () {
            var now = new Date().getTime();
            if (this.startTime)
                return now - this.startTime;
            else
                return 0;
        }
    }

    function Animation() {
        this.step = ["3,2", "0,1,3,1", "0,2,3,0", "1,2,2,0", "2,2,1,0"];
        this.lastStep = 4;
        this.speed = 1000;

        this.start = function (link, type) {
            return type == "interfaceOut" ? this.incoming(link) : this.outcoming(link);
        }

        this.outcoming = function (link) {
            this.lastStep < 4 ? this.lastStep += 1 : this.lastStep = 0;
            return this.step[this.lastStep];
        };

        this.incoming = function (link) {
            this.lastStep > 0 ? this.lastStep -= 1 : this.lastStep = 4;
            return this.step[this.lastStep];
        };
    }

    function RGBScale(colors) {
        this.red = new ColorScale(colors.red, colors.intervals);
        this.green = new ColorScale(colors.green, colors.intervals);
        this.blue = new ColorScale(colors.blue, colors.intervals);

        this.paint = function (intervalIndex) {
            //console.log("rgb("+ this.red.color(intervalIndex) +"," + this.green.color(intervalIndex) + "," + this.blue.color(intervalIndex) +")");
            return "rgb(" + this.red.color(intervalIndex) + "," + this.green.color(intervalIndex) + "," + this.blue.color(intervalIndex) + ")";
        }

        function ColorScale(color, intervals) {
            this.start = color.start;
            this.end = color.end;

            this.intervalLength = function () {
                return (this.end - this.start) / (intervals - 1);
            }
            //ternar operator is used because last color should not display maximum capacity and we should use only as many colors as there are intervals
            this.color = function (intervalIndex) {
                return this.end - (this.intervalLength() * (intervalIndex > (intervals - 1) ? (intervals - 1) : intervalIndex));
            }
        }
    }

    function createTestingNodesAndLinks() {
        var numberOfAttackers = 10;
        var numberOfRouters = 10;
        var numberOfSheeps = 1;

        var result = {};
        result.children = [];
        result.links = [];

        //create attacker networks
        var index = 0;
        for (var i = 0; i < numberOfRouters; i++) {
            var router = {};
            router.id = i;
            router.topologyId = "r_" + i;
            router.name = "Attacker network " + i;
            router.address4 = "unknown";
            router.physicalRole = "router";
            router.children = [];

            for (var j = 0; j < numberOfAttackers; j++) {
                var node = {};
                node.id = index;
                node.topologyId = "i_" + index;
                node.hostNodeId = j;
                node.name = "attacker " + j;
                node.address4 = "unknown";
                node.physicalRole = "computer";

                index++;
                router.children.push(node);
            }
            result.children.push(router);
        }

        //create links
        var index = 0;
        for (var l = 0; l < numberOfRouters; l++) {
            for (var k = 0; k < numberOfRouters; k++) {
                if (l != k) {
                    var link = {};

                    link.id = index;
                    link.source = "r_" + l;
                    link.target = "r_" + k;
                    index++;

                    result.links.push(link);
                }
            }
        }

        return result;
    }

    function createTestingNodesAndLinks2() {
        var numberOfNOdes = 333;

        var result = {};
        result.children = [];
        result.links = [];

        //create attacker networks
        var index = 0;
        for (var i = 0; i < numberOfNOdes; i++) {
            var router = {};
            router.id = i;
            router.topologyId = "r_" + i;
            router.name = "Attacker network " + i;
            router.address4 = "unknown";
            router.physicalRole = "router";
            router.children = [];

            result.children.push(router);
        }

        //create links
        var index = 0;
        for (var l = 0; l < numberOfNOdes; l++) {
            for (var k = 0; k < numberOfNOdes; k++) {
                if (l == k - 1) {
                    var link = {};

                    link.id = index;
                    link.source = "r_" + l;
                    link.target = "r_" + k;
                    index++;

                    result.links.push(link);
                }
            }
        }

        return result;
    }

    this.roundNumber = function(number, digits) {
        var multiple = Math.pow(10, digits);
        return  (Math.round(number * multiple) / multiple);
    }

    this.generateId = function() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    this.simulate = function(element, eventName) {
        var options = extend(defaultOptions, arguments[2] || {});
        var oEvent, eventType = null;

        for (var name in eventMatchers) {
            if (eventMatchers[name].test(eventName)) {
                eventType = name;
                break;
            }
        }

        if (!eventType)
            throw new SyntaxError('Only HTMLEvents and MouseEvents interfaces are supported');

        if (document.createEvent) {
            oEvent = document.createEvent(eventType);
            if (eventType == 'HTMLEvents') {
                oEvent.initEvent(eventName, options.bubbles, options.cancelable);
            }
            else {
                oEvent.initMouseEvent(eventName, options.bubbles, options.cancelable, document.defaultView,
                    options.button, options.pointerX, options.pointerY, options.pointerX, options.pointerY,
                    options.ctrlKey, options.altKey, options.shiftKey, options.metaKey, options.button, element);
            }
            element.dispatchEvent(oEvent);
        }
        else {
            options.clientX = options.pointerX;
            options.clientY = options.pointerY;
            var evt = document.createEventObject();
            oEvent = extend(evt, options);
            element.fireEvent('on' + eventName, oEvent);
        }
        return element;
    }

    function extend(destination, source) {
        for (var property in source)
            destination[property] = source[property];
        return destination;
    }

    var eventMatchers = {
        'HTMLEvents': /^(?:load|unload|abort|error|select|change|submit|reset|focus|blur|resize|scroll)$/,
        'MouseEvents': /^(?:click|dblclick|mouse(?:down|up|over|move|out))$/
    };

    var defaultOptions = {
        pointerX: 0,
        pointerY: 0,
        button: 0,
        ctrlKey: false,
        altKey: false,
        shiftKey: false,
        metaKey: false,
        bubbles: true,
        cancelable: true
    };

}