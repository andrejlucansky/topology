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
 * This is experimental script file. It contains various functions to test new implemented functionality.
 */


/**
 * Test of stopwatch time measurements. Can be modified to use worker or classic version of stopwatch.
 * It was used to compute if worker version is more accurate than classic version of Stopwatch.
 */
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

/**
 * Test of stopwatch worker accessibility.
 */
function stopwatchWorkerTest() {
    var stopwatch = new Worker("../scripts/stopwatch.js");
    stopwatch.onmessage = function (oEvent) {
        console.log(oEvent.data);
    }
}

/**
 * Example of how forEach skips elements when array is edited in process of iteration
 */
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


/**
 * Generates network topology data.
 */
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

/**
 * Generates network topology data, only router nodes. Useful for performance testing.
 */
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
