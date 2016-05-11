var Edge = (function () {
    function Edge() {
    }
    return Edge;
}());
var SearchResult = (function () {
    function SearchResult() {
    }
    return SearchResult;
}());
function aStarSearch(graph, start, goal, heuristics, timeout) {
    var result = {
        path: [start],
        cost: 0
    };
    var currentNode = start;
    var currentEdge;
    var neighbourEs;
    var searchPath;
    var queue = new collections.PriorityQueue(function (e1, e2) {
        var cost1 = e1.cost + heuristics(e1.to);
        var cost2 = e2.cost + heuristics(e2.to);
        if (cost1 < cost2) {
            return 1;
        }
        else if (cost1 > cost2) {
            return -1;
        }
        else {
            return 0;
        }
    });
    var it = 0;
    searchPath = [];
    while (!goal(currentNode)) {
        it = it + 1;
        neighbourEs = graph.outgoingEdges(currentNode);
        console.log("nEs: " + neighbourEs.toString());
        console.log(it.toString());
        var currentPathCost = searchPath.reduce(function (acc, e) { return acc + e.cost; }, 0);
        neighbourEs.forEach(function (e) {
            var updatedEdge = new Edge();
            updatedEdge.to = e.to;
            updatedEdge.from = e.from;
            updatedEdge.cost = e.cost + currentPathCost;
            queue.add(updatedEdge);
        });
        queue.enqueue;
        currentEdge = queue.dequeue();
        currentNode = currentEdge.to;
        if (searchPath.length == 0) {
            searchPath[0] = currentEdge;
        }
        else {
            var cond = true;
            var i = 0;
            while (cond && (i < searchPath.length)) {
                if ((searchPath[i].from).toString() === (currentEdge.from).toString()) {
                    searchPath = searchPath.slice(0, i);
                    cond = false;
                }
                i = i + 1;
            }
            searchPath[i - 1] = currentEdge;
        }
    }
    var count;
    for (count = 0; count < searchPath.length; count++) {
        result.path[count + 1] = searchPath[count].to;
        console.log("in for loop, create path, node: " + result.path[count + 1]);
        result.cost = result.cost + searchPath[count].cost;
    }
    return result;
}
var GridNode = (function () {
    function GridNode(pos) {
        this.pos = pos;
    }
    GridNode.prototype.add = function (delta) {
        return new GridNode({
            x: this.pos.x + delta.x,
            y: this.pos.y + delta.y
        });
    };
    GridNode.prototype.compareTo = function (other) {
        return (this.pos.x - other.pos.x) || (this.pos.y - other.pos.y);
    };
    GridNode.prototype.toString = function () {
        return "(" + this.pos.x + "," + this.pos.y + ")";
    };
    return GridNode;
}());
var GridGraph = (function () {
    function GridGraph(size, obstacles) {
        this.size = size;
        this.walls = new collections.Set();
        for (var _i = 0, obstacles_1 = obstacles; _i < obstacles_1.length; _i++) {
            var pos = obstacles_1[_i];
            this.walls.add(new GridNode(pos));
        }
        for (var x = -1; x <= size.x; x++) {
            this.walls.add(new GridNode({ x: x, y: -1 }));
            this.walls.add(new GridNode({ x: x, y: size.y }));
        }
        for (var y = -1; y <= size.y; y++) {
            this.walls.add(new GridNode({ x: -1, y: y }));
            this.walls.add(new GridNode({ x: size.x, y: y }));
        }
    }
    GridGraph.prototype.outgoingEdges = function (node) {
        var outgoing = [];
        for (var dx = -1; dx <= 1; dx++) {
            for (var dy = -1; dy <= 1; dy++) {
                if (!(dx == 0 && dy == 0)) {
                    var next = node.add({ x: dx, y: dy });
                    if (!this.walls.contains(next)) {
                        outgoing.push({
                            from: node,
                            to: next,
                            cost: Math.sqrt(dx * dx + dy * dy)
                        });
                    }
                }
            }
        }
        return outgoing;
    };
    GridGraph.prototype.compareNodes = function (a, b) {
        return a.compareTo(b);
    };
    GridGraph.prototype.toString = function () {
        var borderRow = "+" + new Array(this.size.x + 1).join("--+");
        var betweenRow = "+" + new Array(this.size.x + 1).join("  +");
        var str = "\n" + borderRow + "\n";
        for (var y = this.size.y - 1; y >= 0; y--) {
            str += "|";
            for (var x = 0; x < this.size.x; x++) {
                str += this.walls.contains(new GridNode({ x: x, y: y })) ? "## " : "   ";
            }
            str += "|\n";
            if (y > 0)
                str += betweenRow + "\n";
        }
        str += borderRow + "\n";
        return str;
    };
    GridGraph.prototype.drawPath = function (start, goal, path) {
        function pathContains(path, n) {
            for (var _i = 0, path_1 = path; _i < path_1.length; _i++) {
                var p = path_1[_i];
                if (p.pos.x == n.pos.x && p.pos.y == n.pos.y)
                    return true;
            }
            return false;
        }
        var borderRow = "+" + new Array(this.size.x + 1).join("--+");
        var betweenRow = "+" + new Array(this.size.x + 1).join("  +");
        var str = "\n" + borderRow + "\n";
        for (var y = this.size.y - 1; y >= 0; y--) {
            str += "|";
            for (var x = 0; x < this.size.x; x++) {
                str += this.walls.contains(new TestNode({ x: x, y: y })) ? "## " :
                    (x == start.pos.x && y == start.pos.y ? " S " :
                        (x == goal.pos.x && y == goal.pos.y ? " G " :
                            ((pathContains(path, new TestNode({ x: x, y: y })) ? ' * ' : "   "))));
            }
            str += "|\n";
            if (y > 0)
                str += betweenRow + "\n";
        }
        str += borderRow + "\n";
        return str;
    };
    return GridGraph;
}());
