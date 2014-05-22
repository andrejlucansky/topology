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
 * This is experimental script file. It contains worker(thread) implementation of Stopwatch, which is used in for the graph animation.
 * In the end, it was not used because of browser limitations for number of active workers. For example, Firefox can create only about 20,
 * which is not enough. One worker version of stopwatch is used instead. It can be found in the graph.js file.
 */

function Stopwatch(){
    this.startTime = null;
    this.stopTime = null;

    this.start = function(){
        this.startTime = new Date().getTime();
    }

    this.stop = function(){
        this.stopTime = this.duration();
    }

    this.duration = function(){
        var now = new Date().getTime();
        if(this.startTime)
            return now - this.startTime;
        else
            return 0;
    }
}

var stopwatch = new Stopwatch();

onmessage = function (oEvent) {
    switch (oEvent.data)
    {
        case "restart":
        {
            stopwatch.start();
           // postMessage("Stopwatch restarted");
            break;
        }
        case "start":
        {
            stopwatch.start();
            //postMessage("Stopwatch started");
            break;
        }
        case "duration":
        {
            postMessage(stopwatch.duration());
            break;
        }
        case "stop":
        {
            stopwatch.stop();
            postMessage("Stopwatch stopped");
            break;
        }
        case "stopTime":
            postMessage(stopwatch.stopTime);
        case "startTime":
            postMessage(stopwatch.startTIme);
        default :
            postMessage("Wrong input");
    }
};

/**
 * Worker alternative of the animateLink function of the graph.js
 */
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
}
