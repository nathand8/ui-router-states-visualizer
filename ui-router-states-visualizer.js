'use strict';

angular.module('ui-router-states-visualizer', [])

.directive('ngStatesVisuzlizer', function() {

    // Go through the registered states and nest them into a json structure
    // statesTree = {
    //      name: "app",
    //      children: [
    //          {name: "products", children: [etc...]}
    //      ]
    // }
    var parseStatesToJson = function() {
        var statesTree = {
            name: "app"
        };

        for (var i = 0; i < $state.get().length; i++) {
            var stateObj = $state.get()[i];
            var stateName = stateObj.name;
            if (stateName === "") {
                continue;
            }
            var splitStateName = stateName.split('.');
            var currentWorkingState = statesTree;

            for (var j = 0; j < splitStateName.length; j++) {
                var levelName = splitStateName[j];

                if (currentWorkingState.children === undefined) {
                    currentWorkingState.children = [];
                }

                var childStateExists = false;
                for (var k = 0; k < currentWorkingState.children.length; k++) {
                    var childState = currentWorkingState.children[k];
                    if (childState.name === levelName) {
                        // Reassign pointer
                        currentWorkingState = childState;
                        childStateExists = true;
                        break;
                    }
                }

                if (!childStateExists) {
                    var childState = {
                        name: levelName,
                        linked: stateObj.linked
                    };
                    currentWorkingState.children.push(childState);

                    // Reassign pointer
                    currentWorkingState = childState;
                }
            }
        }

        return statesTree;
    };
	

    var showChart = function() {
        var json = parseStatesToJson();

        var width = 1600;
        var height = 900;
        var maxLabel = 150;
        var duration = 500;
        var radius = 5;
        var maxRadius = 20;

        var i = 0;
        var root;

        var tree = d3.layout.tree()
            .size([height, width]);

        var diagonal = d3.svg.diagonal()
            .projection(function(d) { return [d.y, d.x]; });

        var svg = d3.select("#tree").append("svg")
            .attr("width", width)
            .attr("height", height)
            .append("g")
            .attr("transform", "translate(" + maxLabel + ",0)");

        root = json;
        root.x0 = height / 2;
        root.y0 = 0;

        root.children.forEach(collapse);

        function update(source)
        {
            // Compute the new tree layout.
            var nodes = tree.nodes(root).reverse();
            var links = tree.links(nodes);

            // Normalize for fixed-depth.
            nodes.forEach(function(d) { d.y = d.depth * maxLabel; });

            // Update the nodes…
            var node = svg.selectAll("g.node")
                .data(nodes, function(d){
                    return d.id || (d.id = ++i);
                });

            // Enter any new nodes at the parent's previous position.
            var nodeEnter = node.enter()
                .append("g")
                .attr("class", "node")
                .attr("transform", function(d){ return "translate(" + source.y0 + "," + source.x0 + ")"; })
                .on("click", click);

            nodeEnter.classed("linked", function(d){ return d.linked;});

            nodeEnter.append("circle")
                .attr("r", 0)
                .style("fill", function(d){
                    return d._children ? "lightsteelblue" : "white";
                });

            nodeEnter.append("text")
                .attr("x", function(d){
                    var spacing = computeRadius(d) + 5;
                    return d.children || d._children ? -spacing : spacing;
                })
                .attr("dy", "3")
                .attr("text-anchor", function(d){ return d.children || d._children ? "end" : "start"; })
                .text(function(d){ return d.name; })
                .style("fill-opacity", 0)
                .append("svg:title")
                .text(function(d){ return d.linked; });

            // Transition nodes to their new position.
            var nodeUpdate = node.transition()
                .duration(duration)
                .attr("transform", function(d) { return "translate(" + d.y + "," + d.x + ")"; });

            nodeUpdate.select("circle")
                .attr("r", function(d){ return computeRadius(d); })
                .style("fill", function(d) { return d._children ? "lightsteelblue" : "#fff"; });

            nodeUpdate.select("text").style("fill-opacity", 1);

            // Transition exiting nodes to the parent's new position.
            var nodeExit = node.exit().transition()
                .duration(duration)
                .attr("transform", function(d) { return "translate(" + source.y + "," + source.x + ")"; })
                .remove();

            nodeExit.select("circle").attr("r", 0);
            nodeExit.select("text").style("fill-opacity", 0);

            // Update the links…
            var link = svg.selectAll("path.link")
                .data(links, function(d){ return d.target.id; });

            // Enter any new links at the parent's previous position.
            link.enter().insert("path", "g")
                .attr("class", "link")
                .attr("d", function(d){
                    var o = {x: source.x0, y: source.y0};
                    return diagonal({source: o, target: o});
                });

            // Transition links to their new position.
            link.transition()
                .duration(duration)
                .attr("d", diagonal);

            // Transition exiting nodes to the parent's new position.
            link.exit().transition()
                .duration(duration)
                .attr("d", function(d){
                    var o = {x: source.x, y: source.y};
                    return diagonal({source: o, target: o});
                })
                .remove();

            // Stash the old positions for transition.
            nodes.forEach(function(d){
                d.x0 = d.x;
                d.y0 = d.y;
            });

            // Update tooltips for linked states
            $(".node.linked circle").tooltip({
                container: 'body',
                placement: 'right',
                html: true,
                title: function() {
                    var d = this.__data__;
                    return 'Copy of <b>' + d.linked + '</b>';
                }
            });
        }

        function computeRadius(d)
        {
            var computedRadius = 0;
            if(d.children || d._children) {
                computedRadius = radius + (radius * nbEndNodes(d) / 10);
            } else {
                computedRadius = radius;
            }
            return Math.min(maxRadius, computedRadius);
        }

        function nbEndNodes(n)
        {
            nb = 0;

            // Don't count linked states
            if(n.linked) {
                return nb;
            }

            if(n.children){
                n.children.forEach(function(c){
                    nb += nbEndNodes(c);
                });
            }
            else if(n._children){
                n._children.forEach(function(c){
                    nb += nbEndNodes(c);
                });
            }
            else nb++;

            return nb;
        }

        function click(d)
        {
            if (d.children){
                d._children = d.children;
                d.children = null;
            }
            else{
                d.children = d._children;
                d._children = null;
            }
            update(d);
        }

        function collapse(d){
            if (d.children){
                d._children = d.children;
                d._children.forEach(collapse);
                d.children = null;
            }
        }

        update(root);
    };
    $(document).ready(function () {
        showChart();
    });
}