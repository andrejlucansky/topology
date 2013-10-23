d3.json("../data/clusterTopology.json", function (error, json) {
    var nodes = json.nodes;
    var links = json.links;
    var width = 800;
    var height = 800;

    var nodeSize = 32;
    var lineBreakNodeSize = 10;

    //generate unique id for each node
    nodes.forEach(function (n) {
        n.id = generateId();
        n.size = {
            "width" : nodeSize,
            "height" : nodeSize
        };
        //set every router as his own parent
        if(n.type == "router")
            n.parent = n;
    });

    //generate unique id for each opposite direction link and add the link
    links.forEach(function (l) {
        l.id = generateId();
        //create link in opposite direction
        links.push({"source": l.target, "target": l.source, "type": "upload", "id": generateId()});
    });

    var svg = d3.select("body").append("svg")
        .attr("width", width)
        .attr("height", height);

    var force = d3.layout.force().nodes(nodes).links(links).size([width, height])
        .on("tick", tick)
        .on("end", end)
        .linkDistance(80)
        .charge(-500)
        .start();

    //create parent-child relationship in tree
    links.forEach(function(l){
        if(l.source.type  == "router" && l.target.type != "router"){
            l.target.parent = l.source;
            l.source.children.push(l.target);
        }
    });

    var nodeDrag = force.drag()
        .on("dragstart", function (d) {
            d.fixed = true;
            d3.select(this).classed("fixed", true);
        });

    //straight lines
    var link = svg.selectAll(".link").data(links,function (d) {
        return d.id;
    }).enter().append("line")
        .attr("class", "link")
        .attr("sourceid", function (d) {
            return d.source.index;
        })
        .attr("targetid", function (d) {
            return d.target.index;
        })
        .attr("id", function (d) {
            return d.id;
        })
        .on("mousedown", lineMouseDownEvent);

//Nodes represented by images
    var node = svg.selectAll(".node").data(nodes,function (d) {
        return d.id;
    }).enter().append("g")
        .attr("class", function(d){return "node " + d.type})
        .attr("index", function (d) {
            return d.index;
        })
        .attr("id", function (d) {
            return d.id;
        })
        .call(nodeDrag);

    node.append("image")
        .attr("xlink:href", function (d) {
            return d.image;
        })
        .attr("x",  function(d){ return -(d.size.width/2);})
        .attr("y",  function(d){ return -(d.size.height/2);})
        .attr("width", function(d){ return d.size.width;})
        .attr("height", function(d){ return d.size.height;});

    node.append("text")
        .attr("dx", 18)
        .attr("dy", ".35em")
        .attr("class", "label")
        .text(function (d) {
            return d.type
        });

    var router = svg.selectAll(".router").on("dblclick", routerNodeDblClickEvent);

    function routerNodeDblClickEvent(d) {
        if (!d3.event.defaultPrevented) {
            if (d.children.length > 0) {
                d.children.forEach(function(n){
                    nodes.splice(nodes.indexOf(n),1);
                });
                d._children = d.children;
                d.children = [];

                d._children.forEach(function(ch){
                    removeLinks(ch);
                });

                exitNodes();
                exitLinks();
                update();

            } else {
                d.children = d._children;
                d._children = [];
                d.children.forEach(function(n){
                    nodes.push(n);

                    //TODO toto neplati pre line break uzly
                    links.push({"source": d, "target": n, "type": "upload", "id": generateId()});
                    links.push({"source": n, "target": d, "type": "upload", "id": generateId()});
                    links.push({"source": d, "target": n, "type": "upload", "id": generateId()});
                    links.push({"source": n, "target": d, "type": "upload", "id": generateId()});
                });
                update();
            }
        }
    };

    function update(){
        node = node.data(nodes, function (d) {
            return d.id;
        });

        //update node indexes in elements
        node.attr("index", function (d) {
            return d.index;
        });

        //add new nodes
        node.enter().append("g")
            .attr("class", function(d){return "node " + d.type})
            .attr("index", function (d) {
                return d.index;
            })
            .attr("id", function (d) {
                return d.id;
            })
            .call(nodeDrag)
            .append("image")
            .attr("xlink:href", function (d) {
                return d.image;
            })
            .attr("x", function(d){ return -(d.size.width/2);})
            .attr("y", function(d){ return -(d.size.width/2);})
            .attr("width", function(d){ return d.size.width;})
            .attr("height", function(d){ return d.size.height;})
            .on("dblclick", lineBreakNodeDblClickEvent);

        node.append("text")
            .attr("dx", 18)
            .attr("dy", ".35em")
            .attr("class", "label")
            .text(function (d) {
                return d.type
            });


        force.start();
        link = link.data(links, function (d) {
            return d.id;
        });

        link.enter().insert("line", ".node")
            .attr("class", "link")
            .attr("sourceid", function (d) {
                return d.source.index;
            })
            .attr("targetid", function (d) {
                return d.target.index;
            })
            .attr("id", function (d) {
                return d.id;
            })
            .on("mousedown", lineMouseDownEvent);
    }

    function lineBreakNodeDblClickEvent(d) {
            var nodeLinks = [];
            links.forEach(function (l) {
                if (l.source == d)
                    nodeLinks.push(l);
            });

                links.push({
                    "source": nodeLinks[0].target,
                    "target": nodeLinks[1].target,
                    "type": "upload",
                    "id": generateId()
                });

                links.push({
                    "source": nodeLinks[1].target,
                    "target": nodeLinks[0].target,
                    "type": "upload",
                    "id": generateId()
                });

                removeLinks(d);
                exitLinks();

                nodes.splice(nodes.indexOf(d), 1);
                exitNodes();
                update();
    };

    function lineMouseDownEvent(d) {
        //create drag node
        var coordinates = d3.mouse(this);
        var x = coordinates[0];
        var y = coordinates[1];

        var n = {
            "type": "invisible",
            "image": "../images/drag.png",
            "x": x,
            "y": y,
            "fixed": true,
            "id": generateId(),
            "parent" : d.source.parent,
            "size" : {
                "width" : lineBreakNodeSize,
                "height" : lineBreakNodeSize
            }
        };

        nodes.push(n);
        links.push({"source": d.source, "target": n, "type": "upload", "id": generateId()});
        links.push({"source": n, "target": d.target, "type": "upload", "id": generateId()});
        links.push({"source": d.target, "target": n, "type": "upload", "id": generateId()});
        links.push({"source": n, "target": d.source, "type": "upload", "id": generateId()});

        //add node as child to his parent router
        d.source.parent.children.push(n);

        links.forEach(function (l) {
            if (l.source == d.target && l.target == d.source)
                links.splice(links.indexOf(l), 1);
        });
        links.splice(links.indexOf(d), 1);
        exitLinks();
        update();
        simulate(document.getElementById(n.id), "mousedown", {pointerX: d3.mouse(this)[0], pointerY: d3.mouse(this)[1]});
    };

    function removeLinks(n){
        var i = 0;
        while(i < links.length){
            if(links[i].source == n || links[i].target == n)
                links.splice(links.indexOf(links[i]), 1);
            else
                i++;
        }
    }

    function exitNodes(){
        node.data(nodes,function (d) {
            return d.id;
        }).exit().remove();
    }

    function exitLinks(){
        link.data(links,function (d) {
            return d.id;
        }).exit().remove();
    }

    function tick() {
        node.attr("transform", function (d) {
            return "translate(" + d.x + "," + d.y + ")";
        });

        // this part of code is working for straight lines between nodes
        link.attr("x1", function (d) {
            return computeCoordinates(d.source.x, d.source.y, d.target.x, d.target.y, {"direction": "right"})[0];
        })
            .attr("y1", function (d) {
                return computeCoordinates(d.source.x, d.source.y, d.target.x, d.target.y, {"direction": "right"})[1];
            })
            .attr("x2", function (d) {
                return  computeCoordinates(d.target.x, d.target.y, d.source.x, d.source.y, {"direction": "left"})[0];
            })
            .attr("y2", function (d) {
                return  computeCoordinates(d.target.x, d.target.y, d.source.x, d.source.y, {"direction": "left"})[1];
            })
            .style("stroke", function (d) {
                if (d.source.index > d.target.index)
                    return "#FF2E83";
                else
                    return "#339FFF";
            });
    }

    function end() {
        for (var i = 0; i < nodes.length; i++) {
            nodes[i].fixed = true;
        }
        d3.selectAll(".node").classed("fixed", true);
    }

    function computeCoordinates(a1, a2, b1, b2, options) {

        var c1, c2, new_c1, new_c2;

        if (options && options.direction == "right") {
            c1 = a2 + a1 - b2;
            c2 = a2 - a1 + b1;
        } else {
            c1 = a1 - a2 + b2;
            c2 = a1 + a2 - b1;
        }

        // pytagorova veta na vypocet dlzky ab
        var ab_squared = Math.pow((b1 - a1), 2) + Math.pow((b2 - a2), 2);

        var ac = 2;
        var ac_squared = Math.pow(ac, 2);
        var ratio = ac_squared / ab_squared;

        if (c1 >= a1)
            new_c1 = Math.sqrt(Math.pow((c1 - a1), 2) * ratio) + a1;
        else
            new_c1 = -(Math.sqrt(Math.pow((c1 - a1), 2) * ratio)) + a1;

        if (c2 >= a2)
            new_c2 = Math.sqrt(Math.pow((c2 - a2), 2) * ratio) + a2;
        else
            new_c2 = -(Math.sqrt(Math.pow((c2 - a2), 2) * ratio)) + a2;

        return [new_c1, new_c2];
    }

    function generateId() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    function simulate(element, eventName) {
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

    function roundNumber(number, digits) {
        var multiple = Math.pow(10, digits);
        return  (Math.round(number * multiple) / multiple);
    }

    function computeParallelism(segment1, segment2) {
        //compute direction vector of the first segment
        var u1 = segment1[1].x - segment1[0].x;
        var u2 = segment1[1].y - segment1[0].y;

        //compute direction vector of the second segment
        var v1 = segment2[1].x - segment2[0].x;
        var v2 = segment2[1].y - segment2[0].y;

        //compare ratio of first and second part of direction vectors rounded to 1 decimal number
        return roundNumber(u1 / v1, 1) == roundNumber(u2 / v2, 1);
    }

    function testArrayRemove(){
        pole = [1,2,3,4,5];

        pole.forEach(function(d){
            console.log("Prvok: "+d);
            if(d == 3 || d==4)  {
                console.log("mazem"+d);

                pole.splice(2,1);
            }
        });

        pole = [1,2,3,4,5];
        var i = 0;

        while(i < pole.length){
            console.log("Prvok: "+pole[i]);
            if(pole[i] == 3 || pole[i]==4)  {
                console.log("mazem"+pole[i]);
                pole.splice(2,1);
            }
            else
                i++;
        }
    }
});