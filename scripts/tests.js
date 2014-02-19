function setLinePropertiesTest(){
    var int = setInterval(function(){
        update();
        //To color new links immediately after creation, otherwise they would remain black until next timestamp
        setLinkProperties(0);
    }, 20);

    window.setTimeout(function(){
        window.clearInterval(int);
    },5000);
}

function stopwatchTest() {
    var hodiny = new Stopwatch();

    console.log(hodiny.duration());
    hodiny.start();
    window.setTimeout(function () {
        console.log(hodiny.duration());
        hodiny.stop();
    }, 1000);
    window.setTimeout(function () {
        console.log(hodiny.stopTime);
    }, 3000);
}

function stopwatchWorkerTest() {
    var stopwatch = new Worker("../scripts/stopwatch.js");
    stopwatch.onmessage = function (oEvent) {
        console.log(oEvent.data);
    }
}

function timeoutTest() {
    window.setTimeout(function () {
        console.log("hi");
    }, 0);
}

function arrayRemoveTest() {
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

//Old methods, different solutions and old versions
/*
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

//alternativne vytvaranie pozadia pre routre
svg.selectAll(".router")
    .insert("rect")
    .attr("width", 600)
    .attr("height", 600)
    .attr("x", function (d) {
        return -300;
    })
    .attr("y", function (d) {
        return -300;
    })
    .attr("fill", "url(#img1)");

group.each(function (d) {
    if (d.physicalRole == "router") {
        d3.select(this).append("image")
            .attr("xlink:href", function (d) {
                return imagePath + "cloud_transparent_outline.svg";
            })
            .attr("class", "cloud_bg")
            .attr("x", function (d) {
                return d.x - 400;
            })
            .attr("y", function (d) {
                return d.y - 400;
            })
            .attr("width", function (d) {
                return 800;
            })
            .attr("height", function (d) {
                return 800;
            });
    }
});

function animateLink(link, datum){
 if (datum.type != "overlay") {
 if(!datum.stopwatch)
 datum.stopwatch = new Worker("../scripts/stopwatch.js");

 datum.stopwatch.addEventListener("message", function(oEvent){
 log.push(oEvent.data);
 });

 window.clearInterval(datum.interval);
 var time = defaultSpeed - (datum.animation.speed * datum.speed);

 datum.stopwatch.postMessage("start");
 datum.interval = window.setInterval(function(){
 datum.stopwatch.postMessage({t:time});
 link.style("stroke-dasharray", function () {
 var style = datum.animation.start(this, datum.type);
 return style;
 });

 datum.stopwatch.postMessage("restart");
 }, (defaultSpeed - (datum.animation.speed * datum.speed)));
 }
 }*/
