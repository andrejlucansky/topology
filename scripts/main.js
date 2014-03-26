/**
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

        //set variables based on LifeRay
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

        //set graph properties based on LifeRay
        if(typeof  Liferay != "undefined"){
            graph.imagePath = "/Topology-portlet/images/";
        }

        $(window).resize(function(){
            graph.width = portletElement.width();
            graph.height = portletElement.height();
            graph.resize();
        })

        //LifeRay events
        if(typeof Liferay !== "undefined"){
            Liferay.on('updatedLayout', function (event) {
                graph.width = portletElement.width();
                graph.height = portletElement.height();
                graph.resize();
            });

            Liferay.on('time_timestamps', function(event) {
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
            graph.init({"api": "http://147.251.43.124:8080/visualisationdata-test"});
        }
    });
})(window, document, jQuery);

