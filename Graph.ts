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

//interface KeyValuePair extends Array<string | number> { 0: string; 1: number; }

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
function aStarSearch<Node, Edge> (
    graph : Graph<Node>,
    start : Node,
    goal : (n:Node) => boolean,
    heuristics : (n:Node) => number,
    timeout : number
) : SearchResult<Node> {
    var toVisit = new collections.Set<Node>();
    var visited = new collections.Set<Node>();
    var stepBefore = new collections.Dictionary<Node,Node>();
    var costs = new collections.Dictionary<Node,number>();

    toVisit.add(start);
    costs.setValue(start, 0);
    console.log("hehehehehe");

    // SearchResult should contain cheapest path from the start node to every other node
    // including the goal node
    var result : SearchResult<Node> = {
        path: [],
        cost: 0
    };
    while (!goal(getNext(toVisit, costs, heuristics))) { // null check needed
        var current = getNext(toVisit, costs, heuristics); // first node in queue
        console.log("current: " + current.toString());
        visited.add(current);
        toVisit.remove(current);
        for (var edge of graph.outgoingEdges(current)) {
              var neighbour = edge.to;
              var cost = getValue(costs, current) + edge.cost;
              if (toVisit.contains(neighbour) && cost < getValue(costs, neighbour)) {
                  toVisit.remove(neighbour);
              }
              if (visited.contains(neighbour) && cost < getValue(costs, neighbour)) { // should never happen
                  visited.remove(neighbour);
                  toVisit.add(neighbour); // perhaps add to toVisit again??
              }
              if (!toVisit.contains(neighbour) && !visited.contains(neighbour)) { // refacror
                  costs.setValue(neighbour, cost);
                  toVisit.add(neighbour);
                  console.log("ny kompis!")
                  stepBefore.setValue(neighbour, current);
              }
          }
          console.log("toVisit: " + toVisit.toString());
          console.log("Nästa nod i toVisit:");
          console.log("getNext: " + getNext(toVisit, costs, heuristics));
      }
      result.path.push(getNext(toVisit, costs, heuristics));
      var backPropNode = result.path[0];
      result.cost = costs.getValue(backPropNode);

      while (backPropNode.toString() !== start.toString()) {
          var next = stepBefore.getValue(backPropNode);
          result.path.unshift(next);
          backPropNode = next;
      }
      console.log(result.path[0].toString());
      return result;
}

function getNext<Node> (
  nodes : collections.Set<Node>,
  costs : collections.Dictionary<Node, number>,
  heuristics : (n:Node) => number)
  : Node {
    var result : Node; //take first element to have something to start with to prevent null
    nodes.forEach( node => {
      if (result == undefined) {
        result = node;
      }
      if (getValue(costs, node) + heuristics(node) < getValue(costs, result) + heuristics(result)) {
        //console.log("in if")
        result = node;
        }
    });
    return result;
  }

  function getValue<Node> (
    dict : collections.Dictionary<Node,number>,
    key : Node )
    : number {
      var result = dict.getValue(key);
      return result !== undefined ? result : Infinity;
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
}
