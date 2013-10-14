d3.json("../data/topology.json", function(error, json){

    var nodes = json.nodes;
    var links = json.links;
    var width = 800;
    var height = 800;

    var svg = d3.select("body").append("svg")
        .attr("width", width)
        .attr("height", height);

    var force = d3.layout.force().nodes(nodes).links(links).size([width,height])
        .on("tick", tick)
        .on("end", end)
        .linkDistance(80)
        .charge(-500)
        .start();

    var nodeDrag = force.drag()
        .on("dragstart", function(d){
            d.fixed = true;
            d3.select(this).classed("fixed", true);
        });

    var lineDrag = force.drag()
        .on("dragstart", function(d){
            //breaking lines here
        })
        .on("dragend", function(d){
           //stop move
        });

    //straight lines
    var link = svg.selectAll(".link").data(links).enter().append("line")
        .attr("class", "link")
        .attr("sourceid", function(d){ return d.source.index})
        .attr("targetid", function(d){ return d.target.index});

//Nodes represented by images
    var node = svg.selectAll(".node").data(nodes).enter().append("g")
        .attr("class", "node")
        .attr("index", function(d){return d.index})
        .call(nodeDrag);

    node.append("image")
        .attr("xlink:href", function(d){return d.image;})
        .attr("x", -16)
        .attr("y", -16)
        .attr("width", 32)
        .attr("height", 32);

    node.append("text")
        .attr("dx", 18)
        .attr("dy", ".35em")
        .attr("class", "label")
        .text(function(d) { return d.type });

    function end(){
        for (var i = 0; i < nodes.length; i++){
            nodes[i].fixed = true;
        }
        d3.selectAll(".node").classed("fixed", true);
    }

    function tick() {
        node.attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });

         // this part of code is working for straight lines between nodes
         link.attr("x1", function(d) {
             if(d.source.index > d.target.index)
             {
                 return computeCoordinates(d.source.x, d.source.y, d.target.x, d.target.y)[0];
             }
             else
             {
                 return computeCoordinates(d.source.x, d.source.y, d.target.x, d.target.y)[0];
             }
         })
         .attr("y1", function(d) {
                 if(d.source.index > d.target.index)
                 {
                     return computeCoordinates(d.source.x, d.source.y, d.target.x, d.target.y)[1];
                 }
                 else
                     return computeCoordinates(d.source.x, d.source.y, d.target.x, d.target.y)[1];
             })
         .attr("x2", function(d) {
                 if(d.source.index > d.target.index)
                 {
                     return computeCoordinates2(d.target.x, d.target.y, d.source.x, d.source.y)[0];
                 }
                 else
                 {
                     return  computeCoordinates2(d.target.x, d.target.y, d.source.x, d.source.y)[0];
                 }
             })
         .attr("y2", function(d) {
                 if(d.source.index > d.target.index)
                 {
                     return  computeCoordinates2(d.target.x, d.target.y, d.source.x, d.source.y)[1];
                 }
                 else
                 {
                     return  computeCoordinates2(d.target.x, d.target.y, d.source.x, d.source.y)[1];
                 }
             })
             .style("stroke", function(d) {if(d.source.index > d.target.index) return "green"; else return "red";});

    }

    function computeCoordinates(source_x, source_y, target_x, target_y){
        //body
        var a1 = source_x;
        var a2 = source_y;

        var b1 = target_x;
        var b2 = target_y;

        var c1 = a2 + a1 - b2;
        var c2 = a2 - a1 + b1;

        // pytagorova veta na vypocet dlzky ab
        var ab_squared = Math.pow((b1 - a1), 2) + Math.pow((b2 - a2), 2);

        var ac = 2.5;
        var ac_squared = Math.pow(ac, 2);
        var ratio = ac_squared / ab_squared;

        if(c1 >= a1)
            var new_c1 = Math.sqrt(Math.pow((c1-a1),2) * ratio) + a1;
        else
            var new_c1 = -(Math.sqrt(Math.pow((c1-a1),2) * ratio)) + a1;

        if(c2 >= a2)
            var new_c2 = Math.sqrt(Math.pow((c2-a2),2) * ratio) + a2;
        else
            var new_c2 = -(Math.sqrt(Math.pow((c2-a2),2) * ratio)) + a2;

        return [new_c1,new_c2];
    }

    function computeCoordinates2(source_x, source_y, target_x, target_y){
        //body
        var a1 = source_x;
        var a2 = source_y;

        var b1 = target_x;
        var b2 = target_y;

        var c1 = a1 - a2 + b2;
        var c2 = a1 + a2 - b1;

        // pytagorova veta na vypocet dlzky ab
        var ab_squared = Math.pow((b1 - a1), 2) + Math.pow((b2 - a2), 2);

        var ac = 2.5;
        var ac_squared = Math.pow(ac, 2);
        var ratio = ac_squared / ab_squared;

        if(c1 >= a1)
            var new_c1 = Math.sqrt(Math.pow((c1-a1),2) * ratio) + a1;
        else
            var new_c1 = -(Math.sqrt(Math.pow((c1-a1),2) * ratio)) + a1;

        if(c2 >= a2)
            var new_c2 = Math.sqrt(Math.pow((c2-a2),2) * ratio) + a2;
        else
            var new_c2 = -(Math.sqrt(Math.pow((c2-a2),2) * ratio)) + a2;
        return [new_c1,new_c2];
    }
});