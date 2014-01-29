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