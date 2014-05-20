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
 * This is the main JavaScript file of the project. It should contain initialization of the graph, bound events
 * and other necessary tasks which should be executed before visualization can be started.
 */
(function(window, document, $, undefined){
    $(window).load(function () {
        var graphElementId = "graph";
        var portletElement = $(window);

        //set variables based on Liferay, get Liferay portlet body element and hide portlet overflow
        if (typeof Liferay !== "undefined") {
            portletElement =  $("#"+graphElementId).parent().parent();
            portletElement.css("overflow", "hidden");
        }

        //set height and width of the graph div element
        portletElement.height() == 0 ?  $("#" + graphElementId).outerHeight($(window).height()) : $("#" + graphElementId).outerHeight(portletElement.height());
        portletElement.width() == 0 ?  $("#" + graphElementId).outerWidth($(window).width()) : $("#" + graphElementId).outerWidth(portletElement.width());

        //create graph and configuration
        var graph = new Graph(graphElementId);
        var configuration = new Configuration();

        //set graph properties based on Liferay presence
        if(typeof  Liferay != "undefined"){
            graph.imagePath = "/Topology-portlet/images/";
        }

        $(window).resize(function(){
            graph.width = portletElement.width();
            graph.height = portletElement.height();
            graph.resize();
        })

        /**
         * Liferay events
         */
        if(typeof Liferay !== "undefined"){
            Liferay.on('updatedLayout', function (event) {
                graph.width = portletElement.width();
                graph.height = portletElement.height();
                graph.resize();
            });

            Liferay.on('time_timestamps', function(event) {;
                graph.updateLinks(event.to);
                graph.updateRoles(event.to);
            });

            Liferay.on('time_init', function(event){
                if(event.id == "topology"){
                    graph.init(event);
                }
            })

            Liferay.fire('init', {'id' : "topology"});
        }else{
            graph.init({"api": "http://kypotest.fi.muni.cz:8080/visualisationdata"});
        }

        /**
         * Topology graph events
         */

    });
})(window, document, jQuery);

