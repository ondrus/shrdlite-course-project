///<reference path="lib/collections.ts"/>
///<reference path="lib/node.d.ts"/>

/** Graph module
*
*  Types for generic A\* implementation.
*
*  *NB.* The only part of this module
*  that you should change is the `aStarSearch` function. Everything
*  else should be used as-is.
*/

/** An edge in a graph. */
class Edge<Node> {
    from : Node;
    to   : Node;
    cost : number;
}

/** A directed graph. */
interface Graph<Node> {
    /** Computes the edges that leave from a node. */
    outgoingEdges(node : Node) : Edge<Node>[];
    /** A function that compares nodes. */
    compareNodes : collections.ICompareFunction<Node>;
}

/** Type that reports the result of a search. */
class SearchResult<Node> {
    /** The path (sequence of Nodes) found by the search algorithm. */
    path : Node[];
    /** The total cost of the path. */
    cost : number;
}

/**
* A\* search implementation, parameterised by a `Node` type. The code
* here is just a template; you should rewrite this function
* entirely. In this template, the code produces a dummy search result
* which just picks the first possible neighbour.
*
* Note that you should not change the API (type) of this function,
* only its body.
* @param graph The graph on which to perform A\* search.
* @param start The initial node.
* @param goal A function that returns true when given a goal node. Used to determine if the algorithm has reached the goal.
* @param heuristics The heuristic function. Used to estimate the cost of reaching the goal from a given Node.
* @param timeout Maximum time to spend performing A\* search.
* @returns A search result, which contains the path from `start` to a node satisfying `goal` and the cost of this path.
*/
function aStarSearch<Node> (
    graph : Graph<Node>,
    start : Node,
    goal : (n:Node) => boolean,
    heuristics : (n:Node) => number,
    timeout : number
) : SearchResult<Node> {

    var result : SearchResult<Node> = {
        path: [start],
        cost: 0
    };

    var currentNode : Node = start;
    var currentEdge : Edge<Node>;
    var neighbourEs : Edge<Node> [];
    var searchPath : Edge<Node> [];
    var queue = new collections.PriorityQueue<Edge<Node>>(function(e1 : Edge<Node>, e2 : Edge<Node>){
        var cost1 = e1.cost + heuristics(e1.to);
        var cost2 = e2.cost + heuristics(e2.to);
        if(cost1 < cost2){
            return 1;
        }else if(cost1 > cost2){
            return -1;
        }else{
            return 0;
        }
    });
    var it = 0;
    searchPath = [];
    while(!goal(currentNode)){
        it = it + 1;
        neighbourEs = graph.outgoingEdges(currentNode);
        console.log("nEs: " + neighbourEs.toString());
        console.log(it.toString());
        //put all the edges connected to current node in priorityqueue
        var currentPathCost = searchPath.reduce((acc, e) => acc + e.cost, 0);
        neighbourEs.forEach(function(e : Edge<Node>){
            var updatedEdge = new Edge<Node>();
            updatedEdge.to = e.to;
            updatedEdge.from = e.from;
            updatedEdge.cost = e.cost + currentPathCost;
            queue.add(updatedEdge);
            /**console.log("added to queue, from: " + (updatedEdge.from).toString());
            console.log("added to queue, to: " + (updatedEdge.to).toString());
            console.log("added to queue, cost: " + (updatedEdge.cost).toString());
            console.log("added to queue, from heur: " + heuristics(updatedEdge.to));*/

        });
        queue.enqueue

        //get first element
        /**
var queueString = "\n";
var arr : Edge<Node> [] = [];

while(!queue.isEmpty()){
    arr.push(queue.dequeue());
}

arr.forEach(function (e : Edge<Node>) {
  queueString += " f " + e.from.toString() + " t " + e.to.toString() + " c " + e.cost.toString() + "\n";
  queue.add(e);
});

        console.log("queue after adding", queueString);*/

        currentEdge = queue.dequeue();
        //console.log("currEdge from: " + (currentEdge.from).toString());
        //console.log("currEdge to: " + (currentEdge.to).toString());

        currentNode = currentEdge.to;
        //console.log("currNode : " + currentNode.toString());
        //console.log("searchpath length: " + (searchPath.length).toString());

        if(searchPath.length == 0){
            searchPath[0] = currentEdge;
          //  console.log("search path, one element, from: " +
            //    (searchPath[0].from).toString());
          //  console.log("search path, one element, to: " +
              //  (searchPath[0].to).toString());
        }else{

            var cond = true;
            var i = 0;

            //check if the from node already has an edge connected to it, if so,
            //remove all the edges added after that node

            //console.log(searchPath);
            while(cond && (i < searchPath.length)){
                //console.log("inner while: " + i.toString());
                //console.log((searchPath[i]));
                if((searchPath[i].from).toString() === (currentEdge.from).toString()){
                    //console.log("current from node already exists in searchpath: " +
                    //    (searchPath[i].from).toString() + " " + (currentEdge.from).toString());
                    searchPath = searchPath.slice(0,i);
                    cond = false;

                }
                i = i + 1;
            }
            //if the node is not previously traversed, just add the edge at the end of the path
            searchPath[i-1] = currentEdge;
            //console.log("currentEdge added to searchPath, from: " + (searchPath[i-1].from).toString());
            //console.log("currentEdge added to searchPath, to: " + (searchPath[i-1].to).toString());
        }

    }
    //console.log(it.toString());

    var count : number;
    for(count = 0; count < searchPath.length; count++){
        result.path[count+1] = searchPath[count].to;
        //skrivs ej ut:
        console.log("in for loop, create path, node: " + result.path[count+1]);
        result.cost = result.cost + searchPath[count].cost;
    }

    return result;
}


//////////////////////////////////////////////////////////////////////
// here is an example graph

interface Coordinate {
    x : number;
    y : number;
}


class GridNode {
    constructor(
        public pos : Coordinate
    ) {}

    add(delta : Coordinate) : GridNode {
        return new GridNode({
            x: this.pos.x + delta.x,
            y: this.pos.y + delta.y
        });
    }

    compareTo(other : GridNode) : number {
        return (this.pos.x - other.pos.x) || (this.pos.y - other.pos.y);
    }

    toString() : string {
        return "(" + this.pos.x + "," + this.pos.y + ")";
    }
}

/** Example Graph. */
class GridGraph implements Graph<GridNode> {
    private walls : collections.Set<GridNode>;

    constructor(
        public size : Coordinate,
        obstacles : Coordinate[]
    ) {
        this.walls = new collections.Set<GridNode>();
        for (var pos of obstacles) {
            this.walls.add(new GridNode(pos));
        }
        for (var x = -1; x <= size.x; x++) {
            this.walls.add(new GridNode({x:x, y:-1}));
            this.walls.add(new GridNode({x:x, y:size.y}));
        }
        for (var y = -1; y <= size.y; y++) {
            this.walls.add(new GridNode({x:-1, y:y}));
            this.walls.add(new GridNode({x:size.x, y:y}));
        }
    }

    outgoingEdges(node : GridNode) : Edge<GridNode>[] {
        var outgoing : Edge<GridNode>[] = [];
        for (var dx = -1; dx <= 1; dx++) {
            for (var dy = -1; dy <= 1; dy++) {
                if (! (dx == 0 && dy == 0)) {
                    var next = node.add({x:dx, y:dy});
                    if (! this.walls.contains(next)) {
                        outgoing.push({
                            from: node,
                            to: next,
                            cost: Math.sqrt(dx*dx + dy*dy)
                        });
                    }
                }
            }
        }
        return outgoing;
    }

    compareNodes(a : GridNode, b : GridNode) : number {
        return a.compareTo(b);
    }

    toString() : string {
        var borderRow = "+" + new Array(this.size.x + 1).join("--+");
        var betweenRow = "+" + new Array(this.size.x + 1).join("  +");
        var str = "\n" + borderRow + "\n";
        for (var y = this.size.y-1; y >= 0; y--) {
            str += "|";
            for (var x = 0; x < this.size.x; x++) {
                str += this.walls.contains(new GridNode({x:x,y:y})) ? "## " : "   ";
            }
            str += "|\n";
            if (y > 0) str += betweenRow + "\n";
        }
        str += borderRow + "\n";
        return str;
    }

    drawPath(start : TestNode, goal : TestNode, path : TestNode[]) : string {
	function pathContains(path : TestNode[], n : TestNode) : boolean {
	    for (var p of path) {
		if (p.pos.x == n.pos.x && p.pos.y == n.pos.y)
		    return true;
	    }
	    return false;
	}
	var borderRow = "+" + new Array(this.size.x + 1).join("--+");
        var betweenRow = "+" + new Array(this.size.x + 1).join("  +");
        var str = "\n" + borderRow + "\n";
        for (var y = this.size.y-1; y >= 0; y--) {
            str += "|";
            for (var x = 0; x < this.size.x; x++) {
                str += this.walls.contains(new TestNode({x:x,y:y})) ? "## " :
		    (x == start.pos.x && y == start.pos.y ? " S " :
		     (x == goal.pos.x && y == goal.pos.y ? " G " :
		      ((pathContains(path, new TestNode({x:x,y:y})) ? ' * ' : "   "))));
            }
            str += "|\n";
            if (y > 0) str += betweenRow + "\n";
        }
        str += borderRow + "\n";
        return str;
    }
}
