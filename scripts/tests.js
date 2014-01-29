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