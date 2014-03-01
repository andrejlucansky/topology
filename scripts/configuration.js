/**
 * Configuration.js is a library which is used to create configuration popup for topology graph.
 */

var topology = d3.select("#topology");

var menuButton = d3.select("#menuButton")
    .on("click", showConfiguration);

var configuration = d3.select("#configuration");

var closeButton = d3.select("#closeButton")
    .on("click", hideConfiguration);


function showConfiguration(){
    //you can also use parseInt(configuration.style("width")) for computation of element position
    configuration
        .style({'display' : 'block', 'opacity': 1})
        .style("left", (window.width - document.getElementById("configuration").offsetWidth)/2 + "px")
        .style("top", (window.height - document.getElementById("configuration").offsetHeight)/2 + "px");
}

function hideConfiguration(){
    configuration.style("opacity", 0)
        .style("display", "none");
}