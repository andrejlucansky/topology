/**
 * Configuration.js is a library which is used to create configuration popup for topology graph.
 */

function Configuration() {
    var drag = d3.behavior.drag().on("drag", configurationDragListener);

    var topology = d3.select("#topology");

    var configuration = d3.select("#config_wrapper").call(drag);

    var menuButton = d3.select("#menu_button")
        .on("click", menuButtonClickListener);

    var svgButton = configuration.select("#svg_button").on("click", svgButtonClickListener);

    var acceptButton = configuration.select("#accept_button")
        .on("click", acceptConfiguration);

    var cancelButton = configuration.select("#cancel_button")
        .on("click", hideConfiguration);

    var configurationInput = configuration.selectAll("input").on("mousedown", configurationClickListener),
        configurationButton = configuration.selectAll("button").on("mousedown", configurationClickListener);

    function svgButtonClickListener() {
        var counter = 0;

        document.getElementById("svg_button").disabled = true;

        svg.selectAll("image").each(function () {
            var help = d3.select(this);
            var src = d3.select(this).attr("href");

            if (src.substring(0, 10) != "data:image") {
                counter++;

                convertImgToBase64(src, function (base64img) {
                    help.attr("href", base64img);
                    counter--;
                });
            }
        });

        var conversionInterval = window.setInterval(function () {
            if (counter == 0) {
                document.getElementById("svg_button").disabled = false;
                window.clearInterval(conversionInterval);

                writeDownloadLink();
            }
        }, 100);
    }

    function convertImgToBase64(url, callback, outputFormat) {
        var canvas = document.createElement('CANVAS');
        var ctx = canvas.getContext('2d');
        var img = new Image();
        img.crossOrigin = 'Anonymous';
        img.src = url;
        img.onload = function () {
            canvas.height = img.height;
            canvas.width = img.width;
            ctx.drawImage(img, 0, 0);
            var dataURL = canvas.toDataURL(outputFormat || 'image/png');
            callback.call(this, dataURL);
            // Clean up
            canvas = null;
        };
    }

    function writeDownloadLink() {

        //remove old download links
        removeDownloadLink();

        var html = "<svg xmlns='http://www.w3.org/2000/svg' xmlns:xlink='http://www.w3.org/1999/xlink' version='1.1' height='" + window.innerHeight + "' width='" + window.innerWidth + "'>" + d3.select("svg").node().innerHTML + "</svg>";

        d3.select("#config_export").append("div")
            .attr("id", "download")
            .html("Right-click on this preview and choose Save as<br />Left-Click to dismiss<br />")
            .append("img")
            .attr("width", 300)
            .attr("height", 300)
            .attr("src", "data:image/svg+xml;base64," + btoa(html));

        d3.select("#download")
            .on("click", function () {
                if (d3.event.button == 0) {
                    d3.select(this).transition()
                        .style("opacity", 0)
                        .remove();
                }
            })
            .transition()
            .duration(500)
            .style("opacity", 1);

    }

    function removeDownloadLink() {
        configuration.selectAll("#download").remove();
    }

    function configurationClickListener() {
        d3.event.stopPropagation();
    }

    function menuButtonClickListener() {
        if (!configuration.classed("shown"))
            showConfiguration();
        else
            hideConfiguration();
    }

    function configurationDragListener() {
        var top = parseInt(configuration.style("top")),
            left = parseInt(configuration.style("left"));

        configuration
            .style("top", (top + d3.event.dy) + "px")
            .style("left", (left + d3.event.dx) + "px");
    }

    function acceptConfiguration() {
        nodeSize = configuration.select("#config_node_size").property("value");

        nodes.forEach(function (d) {
            d.size.width = nodeSize;
            d.size.height = nodeSize;
        });

        node.each(function (d) {
            d3.select(this).select("image")
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

        });

        lineBreakNodeSize = configuration.select("#config_linebreak_size").property("value");
        defaultNormalLength = configuration.select("#config_line_width").property("value");

        update();
        hideConfiguration();
    }

    function showConfiguration() {
        //you can also use parseInt(configuration.style("width")) for computation of element position
        configuration
            .style({'display': 'block', 'opacity': 1})
            .style("left", (window.innerWidth - document.getElementById("config_wrapper").offsetWidth) / 2 + "px")
            .style("top", (window.innerHeight - document.getElementById("config_wrapper").offsetHeight) / 2 + "px")
            .classed("shown", true);

        //fill inputs with default values
        configuration.select("#config_node_size").attr("value", nodeSize);
        configuration.select("#config_linebreak_size").attr("value", lineBreakNodeSize);
        configuration.select("#config_line_width").attr("value", defaultNormalLength);
    }

    function hideConfiguration() {
        //remove old download links
        configuration.selectAll("#download").remove();

        configuration.style("opacity", 0)
            .style("display", "none")
            .classed("shown", false);
    }
}