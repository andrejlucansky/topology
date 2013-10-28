var width = window.innerWidth - 20,
    height = window.innerHeight - 20,
    nodeSize = 32,
    lineBreakNodeSize = 10,
    root;

var imagePath = "../images/",
    imageType = ".png";

var svg = d3.select("body")
    .append("svg")
    .attr("width", width)
    .attr("height", height);


var force = d3.layout.force()
    .size([width, height])
    .on("tick", tick)
    .on("end", end)
    .linkDistance(80)
    .charge(-500);

var link = svg.selectAll(".link"),
    node = svg.selectAll(".node"),
    router = svg.selectAll(".router");

var nodes,
    links;

d3.json("../data/clusterTopologyTree.json", function (json) {
    root = json;
    update();
});

function update() {
    nodes = getChildren(root),
        links = d3.layout.tree().links(nodes);

    links.forEach(function (l) {
        //create unique id for each opposite direction link
        l.id = generateId();
        //set type of original link to outcoming/upload
        l.type = "outcoming";
        //create link in opposite direction
        links.push({"source": l.source, "target": l.target, "type": "incoming", "id": generateId()});
    });

    //add links which are between routers
    root.links.forEach(function (l) {
        var source = findNodeById(l.source),
            target = findNodeById(l.target);

        links.push({"source": source, "target": target, "type": l.type, "id": generateId()});
        links.push({"source": target, "target": source, "type": l.type, "id": generateId()});
    })

    force.nodes(nodes)
        .links(links)
        .start();

    link = link.data(links, function (d) {
        return d.id;
    });

    link.exit().remove();

    link.enter()
        .insert("line", ".node")
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
        .attr("type", function (d) {
            return d.type;
        })
        .on("mousedown", lineMouseDownEvent);

    node = node.data(nodes, function (d) {
        return d.id;
    });

    node.exit().remove();

    var group = node.enter()
        .append("g")
        .attr("class", function (d) {
            return "node " + d.type
        })
        .attr("index", function (d) {
            return d.index;
        })
        .attr("id", function (d) {
            return d.id;
        })
        .call(nodeDrag)
        .on("dblclick", lineBreakNodeDblClickEvent);

    group.append("image")
        .attr("xlink:href", function (d) {
            return imagePath + d.type + imageType;
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
        .attr("dx", 18)
        .attr("dy", ".35em")
        .attr("class", "label")
        .text(function (d) {
            return d.name
        });

    //bind doubleclick for routers to be collabsible
    svg.selectAll(".router").on("dblclick", routerNodeDblClickEvent);
}

function getChildren(root) {
    var nodes = [], i = 0;

    function recurse(node) {
        if (node.children) node.children.forEach(recurse);
        //TODO temporary id assignment, should be omitted after json will be fetched from the database
        if (/*!node.id*/ node.type != "router") node.id = generateId();
        if (!node.size) node.size = {"width": nodeSize, "height": nodeSize};
        nodes.push(node);
    }

    recurse(root);

    //remove root node
    nodes.splice(nodes.indexOf(root), 1);
    return nodes;
}

//TODO refactor
var nodeDrag = force.drag()
    .on("dragstart", function (d) {
        d.fixed = true;
        d3.select(this).classed("fixed", true);
    });

function routerNodeDblClickEvent(d) {
    if (!d3.event.defaultPrevented) {
        if (d.children) {
            d._children = d.children;
            d.children = null;
        } else {
            d.children = d._children;
            d._children = null;
        }
        update();
    }
};

//TODO router links
function lineMouseDownEvent(d) {
    //create drag node
    var coordinates = d3.mouse(this);
    var x = coordinates[0];
    var y = coordinates[1];

    //parent is set to node closest to the router
    var n = {
        "name": null,
        "type": "lineBreak",
        "role": null,
        "id": generateId(),
        "x": x,
        "y": y,
        "fixed": true,
        "parent": d.source,
        "children": [d.target],
        "size": {
            "width": lineBreakNodeSize,
            "height": lineBreakNodeSize
        }
    };

    //add node as child to his parent router
    d.source.children.push(n);

    //remove old leaf from old parent
    d.source.children.splice(d.source.children.indexOf(d.target), 1);

    //set parent of old leaf to this node
    d.target.parent = n;

    update();
    simulate(document.getElementById(n.id), "mousedown", {pointerX: d3.mouse(this)[0], pointerY: d3.mouse(this)[1]});
};

function lineBreakNodeDblClickEvent(d) {

    //remove node from parental children list
    d.parent.children.splice(d.parent.children.indexOf(d), 1);

    //move all children from node to parent
    //change parent of all children to their new parent
    d.children.forEach(function (n) {
        d.parent.children.push(n);
        n.parent = d.parent;
    });

    update();
};

//TODO refactor
function tick() {
    node.attr("transform", function (d) {
        return "translate(" + d.x + "," + d.y + ")";
    });

    // this part of code is working for straight lines between nodes
    link.attr("x1", function (d) {
        return computeCoordinates(d.source.x, d.source.y, d.target.x, d.target.y, {"direction": "right", "type" : d.type})[0];
    })
        .attr("y1", function (d) {
            return computeCoordinates(d.source.x, d.source.y, d.target.x, d.target.y, {"direction": "right", "type" : d.type})[1];
        })
        .attr("x2", function (d) {
            return  computeCoordinates(d.target.x, d.target.y, d.source.x, d.source.y, {"direction": "left", "type" : d.type})[0];
        })
        .attr("y2", function (d) {
            return  computeCoordinates(d.target.x, d.target.y, d.source.x, d.source.y, {"direction": "left", "type" : d.type})[1];
        })
        .style("stroke", function (d) {
            if (d.type == "outcoming")
                return "#FF2E83";
            else if(d.type == "incoming")
                return "#339FFF";
            else
                return "#C73EFF";
        });
}

//TODO refactor
function computeCoordinates(a1, a2, b1, b2, options) {

    var c1, c2, new_c1, new_c2;

    //changing side based on direction of the traffic(type = incoming/outcoming)
    if(options.type == "incoming"){
        if(options.direction == "right")
            options.direction = "left";
        else
            options.direction = "right";
    }


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

function findNodeById(id) {
    for (var i = 0; i < nodes.length; i++) {
        if (nodes[i].id == id)
            return nodes[i];
    }
}

function end() {
    for (var i = 0; i < nodes.length; i++) {
        nodes[i].fixed = true;
    }
    d3.selectAll(".node").classed("fixed", true);
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

function testArrayRemove() {
    pole = [1, 2, 3, 4, 5];

    pole.forEach(function (d) {
        console.log("Prvok: " + d);
        if (d == 3 || d == 4) {
            console.log("mazem" + d);

            pole.splice(2, 1);
        }
    });

    pole = [1, 2, 3, 4, 5];
    var i = 0;

    while (i < pole.length) {
        console.log("Prvok: " + pole[i]);
        if (pole[i] == 3 || pole[i] == 4) {
            console.log("mazem" + pole[i]);
            pole.splice(2, 1);
        }
        else
            i++;
    }
}