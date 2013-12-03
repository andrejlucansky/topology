var width = window.innerWidth - 20,
    height = window.innerHeight - 20,
    nodeSize = 32,
    lineBreakNodeSize = 10,
    defaultNormalLength = 2,
    scaledNormalLength = defaultNormalLength,
    scale = 1,
    translate = [0,0],
    root;

var connectionString = "http://147.251.43.124:8080/visualisationdata/network/topology";
//var connectionString = "../data/clusterTopologyTreePresentation.json";

//data refreshing interval 60 seconds
var refreshInterval = 60000;

var colors = {
    "red" : {
        "start" : 255,
        "end" : 255
    },
    "green": {
        "start" : 70,
        "end" : 190
    },
    "blue": {
        "start" : 46,
        "end" : 106
    },
    "intervals" : 5
};

var imagePath = "../images/",
    imageType = "_transparent",
    imageFormat = ".svg";

var x = d3.scale.linear()
    .domain([0, width])
    .range([0, width]);

var y = d3.scale.linear()
    .domain([0, height])
    .range([0, height]);

var svg = d3.select("body")
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .call(d3.behavior.zoom().x(x).y(y).scaleExtent([1, 10]).on("zoom", zoom)).on("dblclick.zoom", null);

var force = d3.layout.force()
    .size([width, height])
    .on("tick", tick)
    .on("end", end)
    .linkDistance(120)
    .charge(-500);

var link = svg.selectAll(".link"),
    node = svg.selectAll(".node"),
    router = svg.selectAll(".router");

var nodes,
    links;

d3.json(connectionString, function (json) {
    root = json;
    update();
    //paintLines();
});

function update() {
    nodes = getChildren(root),
    links = d3.layout.tree().links(nodes);

    createLinks();
    createNodes();

    //start animation
    slide();

    //start simulation
    force.nodes(nodes)
        .links(links)
        .start();

    //bind click links from router to computer
    svg.selectAll(".invisible").on("mousedown", lineMouseDownListener);
    //bind doubleclick for routers to be collabsible
    svg.selectAll(".router").on("dblclick", routerNodeDblClickListener);
    //bind doubleclick for line breaks to disappear
    svg.selectAll(".lineBreak").on("dblclick", lineBreakNodeDblClickListener);
}

function createLinks(){
    links.forEach(function (l) {
        //set additional properties for original links
        l.topologyId = generateId();
        l.type = "outcoming";
        l.visible = true;

        //create link in opposite direction
        links.push({"source": l.source, "target": l.target, "type": "incoming", "visible" : true, "topologyId": generateId()});

        //add invisible overlay link to the list
        links.push({"source": l.source, "target": l.target, "type": "invisible", "visible": false, "topologyId": generateId()});
    });

    //add links which are between routers
    root.links.forEach(function (l) {
        var source = findNodeById(l.source),
            target = findNodeById(l.target);

        links.push({"source": source, "target": target, "type": "routerToRouter", "visible" : true, "topologyId": generateId()});
        //links.push({"source": target, "target": source, "type": "routerToRouter", "topologyId": generateId()});
    })

    //add invisible link overlay on all links
/*    links.forEach(function(d){
        links.push({"source": d.source, "target": d.target, "type": d.type, "visible": false, "topologyId": generateId()});
    });*/

    link = link.data(links, function (d) {
        return d.topologyId;
    });

    link.exit().remove();

    link.enter()
        .insert("line", ".node")
        .attr("class", function(d){var visibility = d.visible ? "visible" : "invisible"; return "link " + d.type + " " + visibility;})
        .attr("sourceid", function (d) {
            return d.source.topologyId;
        })
        .attr("targetid", function (d) {
            return d.target.topologyId;
        })
        .attr("id", function (d) {
            return d.topologyId;
        });

    links.forEach(function(d){
        //activate animation
        d.animation = new Animation();
        d.animation.speed = Math.floor(Math.random()*1000);

        //color lines
        d.colorScale = new RGBScale(colors);
    })
}

function createNodes(){
    node = node.data(nodes, function (d) {
        return d.topologyId;
    });

    node.exit().remove();

    //update router node icon on collapse
    node.select("image").attr("xlink:href", function(d){
        if(d.physicalRole == "lineBreak")
            return imagePath + d.physicalRole + imageType + ".png";
        else
            return imagePath + d.physicalRole + imageType + imageFormat;
    });

    var group = node.enter()
        .append("g")
        .attr("class", function (d) {
            return "node " + d.physicalRole
        })
        .attr("index", function (d) {
            return d.index;
        })
        .attr("id", function (d) {
            return d.topologyId;
        })
        .call(routerNodeDragListener);

    group.append("image")
        .attr("xlink:href", function (d) {
            if(d.physicalRole == "lineBreak")
                return imagePath + d.physicalRole + imageType + ".png";
            else
                return imagePath + d.physicalRole + imageType + imageFormat;
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
        .attr("dy", function(d){ return -(d.size.height / 8)})
        .attr("class", "label")
        .text(function (d) {
            if(d.name == null && d.address4 == null)
                return "";
            else
                return d.name + "/" + d.address4;
        });

    group.append("image")
        .attr("xlink:href", function (d) {
            if(d.logicalRole != null)
                return imagePath + d.logicalRole + ".svg";
        })
        .attr("x", function (d) {
            return d.size.width / 2;
        })
        .attr("y", function (d) {
            return d.size.height / 32;
        })
        .attr("width", function (d) {
            return d.size.width / 2 ;
        })
        .attr("height", function (d) {
            return d.size.height / 2;
        });
}

function setPosition(node, event){
    if(node.children)
    node.children.forEach(function(ch){
        setPosition(ch, event);
        ch.x += event.dx / scale;
        ch.y += event.dy / scale;
        ch.px += event.dx / scale;
        ch.py += event.dy / scale;
    })
}

function getChildren(root) {
    var nodes = [], i = 0;

    function recurse(node) {
        if (node.children) node.children.forEach(recurse);
        //TODO temporary id assignment, should be omitted after json will be fetched from the database
        //if (/*!node.topologyId*/ node.physicalRole != "router") node.topologyId = generateId();
        if (!node.size) node.size = {"width": nodeSize, "height": nodeSize};
        nodes.push(node);
    }

    recurse(root);

    //remove root node
    nodes.splice(nodes.indexOf(root), 1);
    return nodes;
}

function zoom(){
    scale = d3.event.scale;
    translate = d3.event.translate;
    scaledNormalLength = defaultNormalLength / scale;
    svg.selectAll(".test").attr("transform",
        "translate(" + translate + ")"
            + " scale(" + scale + ")");

    tick();
}

var routerNodeDragListener =
    d3.behavior.drag()
        .on("dragstart", function(d){
            d.fixed = true;
            d3.select(this).classed("fixed", true)
            d3.event.sourceEvent.stopPropagation();
        })
        .on("drag", function(d){
            d.px += d3.event.dx / scale;
            d.py += d3.event.dy / scale;
            d.x += d3.event.dx / scale;
            d.y += d3.event.dy / scale;
            //for routers, compute coordinates of their children if they are hidden
            if((d.physicalRole == "router" || d.physicalRole =="cloud") && d.children == null) {
                d._children.forEach(function(ch){
                    setPosition(ch, d3.event);
                    ch.x += d3.event.dx / scale;
                    ch.y += d3.event.dy / scale;
                    ch.px += d3.event.dx / scale;
                    ch.py += d3.event.dy / scale;
                });
            }
            force.resume()
        });

function routerNodeDblClickListener(d) {
    if (!d3.event.defaultPrevented) {
        if (d.children) {
            d._children = d.children;
            d.children = null;
            d.physicalRole = "cloud";
        } else {
            d.children = d._children;
            d._children = null;
            d.physicalRole = "router";
        }
        update();
    }
};

function lineMouseDownListener(d) {
    d3.event.stopPropagation();

    var coordinates = d3.mouse(this);

    //compute coordinates of new node, taking into account pane translate vector and zoom scale
    var xx = (coordinates[0] - translate[0]) / scale;
    var yy = (coordinates[1] - translate[1]) / scale;

    //parent is set to node closest to the router
    var n = {
        "name": null,
        "id" : null,
        "topologyId": generateId(),
        "address4" : null,
        "logicalRole": null,
        "physicalRole": "lineBreak",
        "parent": d.source,
        "children": [d.target],
        "size": {
            "width": lineBreakNodeSize,
            "height": lineBreakNodeSize
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

    update();
    simulate(document.getElementById(n.topologyId), "mousedown", {pointerX: coordinates[0], pointerY: coordinates[1]});
};

function lineBreakNodeDblClickListener(d) {

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

/*function tick() {
    node.attr("transform", function(d){  return "translate(" + x(d.x) + "," + y(d.y) + ")";});

    // this part of code is working for straight lines between nodes
    link.attr("x1", function (d) {
        return computeCoordinates(d.source.x, d.source.y, d.target.x, d.target.y, {"direction": "right", "type": d.type})[0];
    })
        .attr("y1", function (d) {
            return computeCoordinates(d.source.x, d.source.y, d.target.x, d.target.y, {"direction": "right", "type": d.type})[1];
        })
        .attr("x2", function (d) {
            return  computeCoordinates(d.target.x, d.target.y, d.source.x, d.source.y, {"direction": "left", "type": d.type})[0];
        })
        .attr("y2", function (d) {
            return  computeCoordinates(d.target.x, d.target.y, d.source.x, d.source.y, {"direction": "left", "type": d.type})[1];
        });
}*/

function tick() {
    node.attr("transform", function(d){  return "translate(" + x(d.x) + "," + y(d.y) + ")";});

    // this part of code is working for straight lines between nodes
    link
        .attr("x1", function (d) {
            d.sourceNormalAttributes = getNormalAttributes(d.source, d.target, d.type, "out");
            return getScaledNormalEnd(d.sourceNormalAttributes.start.x, d.sourceNormalAttributes.end.x, d.sourceNormalAttributes.ratio, x);
        })
        .attr("y1", function (d) {
            return  getScaledNormalEnd(d.sourceNormalAttributes.start.y, d.sourceNormalAttributes.end.y, d.sourceNormalAttributes.ratio, y);
        })
        .attr("x2", function (d) {
            d.targetNormalAttributes = getNormalAttributes(d.target, d.source, d.type, "in");
            return   getScaledNormalEnd(d.targetNormalAttributes.start.x, d.targetNormalAttributes.end.x, d.targetNormalAttributes.ratio, x);
        })
        .attr("y2", function (d) {
            return   getScaledNormalEnd(d.targetNormalAttributes.start.y, d.targetNormalAttributes.end.y, d.targetNormalAttributes.ratio, y);
        });
}

function getNormalAttributes(source, target, type, traffic){
    var normalEndX,
        normalEndY,
        vectorDirection = getVectorDirection(type, traffic);

    if(vectorDirection == null)
        return {"start": source, "end": {"x":null, "y": null}, "ratio": null};

    if(vectorDirection == "right")
    {
        normalEndX = source.x - source.y + target.y;
        normalEndY = source.x + source.y - target.x;
    }
    else
    {
        normalEndX = source.y + source.x - target.y;
        normalEndY = source.y - source.x + target.x;
    }

    // pytagorova veta na vypocet dlzky ab
    var lineLengthSquared = Math.pow((target.x - source.x), 2) + Math.pow((target.y - source.y), 2),
        scaledNormalLengthSquared = Math.pow(scaledNormalLength, 2),
        ratio = scaledNormalLengthSquared / lineLengthSquared;

    return {"start": source, "end": {"x": normalEndX, "y": normalEndY}, "ratio": ratio};
}

function getScaledNormalEnd(normalStart, normalEnd, ratio, linearTransformation){
    if(normalEnd == null){
        return linearTransformation(normalStart);
    }

    var scaledNormalEnd;
    if (normalEnd >= normalStart)
        scaledNormalEnd = Math.sqrt(Math.pow((normalEnd - normalStart), 2) * ratio) + normalStart;
    else
        scaledNormalEnd = -(Math.sqrt(Math.pow((normalStart - normalEnd), 2) * ratio)) + normalStart;

    return linearTransformation(scaledNormalEnd);
}

function getVectorDirection(type, direction){
   var result;

    switch (type) {
        case "invisible":   //invisible overlay lines should end in centers of their source and target nodes, without any translation applied to them
            result = null;
            break;
        case "outcoming":   //every outcoming line should be aligned to the right from the source and to the left from the target side
            if (direction == "out")
                result = "right";
            else
                result = "left";
            break;
        case "incoming":    //every incoming line should be aligned to the left from the source and to the right from the target side
            if (direction == "in")
                result = "right";
            else
                result = "left";
            break;
        case "routerToRouter":  //links between routers should be always aligned to the right from the source and to the left from the target
            if(direction == "out")
                result = "right";
            else
                result = "left";
            break;
        default:    //if all else fails - lines should be centered to their source and target nodes, without any translation applied to them
            result = null;
    }

    return result;
}
/*
function computeCoordinates(a1, a2, b1, b2, options) {

    var c1, c2, new_c1, new_c2;

    //changing side based on direction of the traffic(type = incoming/outcoming)
    if (options.type.search("incoming") != -1) {
        if (options.direction == "right")
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

    var ac = scaledNormalLength;
    var ac_squared = Math.pow(ac, 2);
    var ratio = ac_squared / ab_squared;

    if (c1 >= a1)
        new_c1 = Math.sqrt(Math.pow((c1 - a1), 2) * ratio) + a1;
    else        //obratit c1 a a1
        new_c1 = -(Math.sqrt(Math.pow((c1 - a1), 2) * ratio)) + a1;

    if (c2 >= a2)
        new_c2 = Math.sqrt(Math.pow((c2 - a2), 2) * ratio) + a2;
    else            //obratit c2 a a2
        new_c2 = -(Math.sqrt(Math.pow((c2 - a2), 2) * ratio)) + a2;

    return [x(new_c1), y(new_c2)];
}*/

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

function generateId() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

/*
function slide(){
    var l = d3.select(this);
    l.interval = window.setInterval(function(){
        l.style("stroke-dasharray", function(d){
            return d.animation.start(this, d.type);
        })
    }, l.datum().animation.speed)
}*/

function slide(){
    link.each(function(d){
        var l = d3.select(this);
        if(d.visible)
        l.interval = window.setInterval(function(){
            l.style("stroke-dasharray", function(d){
                style = d.animation.start(this, d.type);
                return style;
            });
        }, l.datum().animation.speed);
    })
}

function paintLines(){
    window.setInterval(function(){
        //change colour based on trafic
        link.transition()
            .duration(4000)
            .style("stroke", function (d) {
            if(d.visible){
                var intervalIndex = Math.floor((/*d.load / d.bandwidth*/0.8) * colors.intervals);
                return d.colorScale.paint(Math.min(Math.floor(Math.random()*10),4));
            }
            else
                return "rgba(255,255,255,0)";
        });

    },5000);
}

function Animation() {
    this.step =  ["3,2","0,1,3,1","0,2,3,0","1,2,2,0","2,2,1,0"];
    this.lastStep  = 4;
    this.speed = 1000;

    this.start = function(link, type){
        return type == "incoming" ? this.in(link) : this.out(link);
    }

    this.out = function(link){
        this.lastStep < 4 ? this.lastStep += 1 :this.lastStep = 0;
        return this.step[this.lastStep];
    };

    this.in = function(link){
        this.lastStep > 0 ? this.lastStep -= 1 :this.lastStep = 4;
        return this.step[this.lastStep];
    };
}

function RGBScale(colors){
    this.red = new ColorScale(colors.red, colors.intervals);
    this.green = new ColorScale(colors.green, colors.intervals);
    this.blue = new ColorScale(colors.blue, colors.intervals);

    this.paint = function(intervalIndex){
        //console.log("rgb("+ this.red.color(intervalIndex) +"," + this.green.color(intervalIndex) + "," + this.blue.color(intervalIndex) +")");
        return "rgb("+ this.red.color(intervalIndex) +"," + this.green.color(intervalIndex) + "," + this.blue.color(intervalIndex) +")";
    }

    function ColorScale(color, intervals){
        this.start = color.start;
        this.end = color.end;

        this.intervalLength = function(){
            return (this.end - this.start) / (intervals - 1);
        }
        this.color = function(intervalIndex){
            return this.start + (this.intervalLength() * intervalIndex);
        }
    }
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