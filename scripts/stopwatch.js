function Stopwatch(){
    this.duration = 0;
    this.interval = null;

    this.startTime = new Date().getTime();

    this.start = function(){
        this.inteval = setInterval((function(stopwatch){
            return function(){
                stopwatch.duration++;
            }
        })(this),50);
    }

    this.stop = function(stopwatch){
        clearInterval(this.interval);
    }

    this.reset = function(){
        this.duration = 0;
    }
}
var stopwatch = new Stopwatch();
setTimeout(function(){

    stopwatch.start();

}, 5000);


onmessage = function (oEvent) {
    postMessage(stopwatch.duration*50);
};