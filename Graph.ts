///<reference path="lib/collections.ts"/>
///<reference path="lib/node.d.ts"/>
///<reference path="WorldGraph.ts"/>

/** Graph module
*
*  Types for generic A\* implementation.
*
*
*/

import forEach = collections.arrays.forEach;
import PriorityQueue = collections.PriorityQueue;
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
    iterations: number;
}

/**
 * Class to help wrap nodes with fscore to be used in the priority queue in A*
 */
class FScoreNodeWrapper<Node> {
    node : Node;
    fScore : number;
    constructor(node : Node, fscore : number){
        this.node = node;
        this.fScore = fscore;
    }
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
 * @param timeout Maximum time (in seconds) to spend performing A\* search.
 * @returns A search result, which contains the path from `start` to a node satisfying `goal` and the cost of this path.
 */

function aStarSearch<Node> (
    graph : Graph<Node>,
    start : Node,
    goal : (n:Node) => boolean,
    heuristics : (n:Node) => number,
    timeout : number
) : SearchResult<Node> {

    var startTime = Date.now();

    // count variable to help us keep track of number of iterations in the main loop
    var count = 0;

    var mHeuristicMap = new collections.Dictionary<Node,number>();
    var mHeuristics = memoizeHeuristics.bind(this, mHeuristicMap, heuristics);

    var closedSet : Node[] = [];
    var wrapperNodeCompare = (n1 : FScoreNodeWrapper<Node>, n2 : FScoreNodeWrapper<Node>) => {
        return n2.fScore - n1.fScore;
    };
    var openSetP = new PriorityQueue<FScoreNodeWrapper<Node>>(wrapperNodeCompare);
    var gScore = new collections.Dictionary<Node, number>();
    var cameFrom = new collections.Dictionary<Node,Node>(JSON.stringify);
    var fScore = new collections.Dictionary<Node, number>();

    gScore.setValue(start, 0);
    fScore.setValue(start, mHeuristics(start));
    openSetP.add(new FScoreNodeWrapper(start, fScore.getValue(start)));

    function updateScores(neighbor:Node, tentativeScore:number) : void {
        gScore.setValue(neighbor, tentativeScore);
        fScore.setValue(neighbor, gScore.getValue(neighbor) + mHeuristics(neighbor));
    }

    while (!openSetP.isEmpty()){

        count++;
        var current = openSetP.dequeue().node;
        if(goal(current)){
            console.log("Returning from aStar");
            return {
                path: reconstructPath(cameFrom, current),
                cost: gScore.getValue(current),
                iterations: count,
            };
        }

        closedSet.push(current);

        var outgoing = graph.outgoingEdges(current);
        for (var e of outgoing){
            var neighbor = e.to;

            if(closedSetContainsElement(closedSet, neighbor, graph)){
                continue;
            }

            var tentativeScore = lookupWithDefaultInfinity(current, gScore) + e.cost;
            if(!priorityQueueContainsElement<Node>(openSetP, neighbor, graph)){
                updateScores(neighbor, tentativeScore);
                openSetP.add(new FScoreNodeWrapper(neighbor, lookupWithDefaultInfinity(neighbor, fScore)));
            } else if (tentativeScore >= lookupWithDefaultInfinity(neighbor, gScore)) {
                continue;
            } else {
                updateScores(neighbor, tentativeScore);
                openSetP.add(new FScoreNodeWrapper(neighbor, lookupWithDefaultInfinity(neighbor, fScore)));
            }

            cameFrom.setValue(neighbor, current);
        }
        
        var now = Date.now();

        // While this solution for timeout isn't optimal:
        // (if an iteration takes 5 minutes the timout will trigger too late if set to less then 5 minutes)
        // we still believe it good enough for now at least.
        if(now - startTime > (timeout*1000)) {
            throw "Timeout reached";
        }
    }
    throw "No path found";
}

/**
 * Lookup function to check contains in priorityQueue, needed since the priority queue automatically uses the compare function
 * given and this results in state with same cost being considered equal. If we don't check that it isn't already contained we
 * risk never exhausting the search.
 * @param priorityQueue - queue to look in
 * @param neighbour - node to search for
 * @param g - graph to find compareNodes function in
 * @returns {boolean} - if the element was found or not in the queue.
 */
function priorityQueueContainsElement<Node>(priorityQueue : collections.PriorityQueue<FScoreNodeWrapper<Node>>, neighbour : Node, g : Graph<Node>){
    try {
        priorityQueue.forEach(n => {
            if(g.compareNodes(n.node, neighbour) === 0){
                throw "value found";
            }
        });
    } catch (error) {
        if(error === "value found"){
            return true;
        } else {
            throw error;
        }
    }
    return false;
}

/**
 * Lookup function to see if see if list contain particular node
 * @param s - list of nodes to search in
 * @param needle - node to search for
 * @param g - graph to find compare function for nodes in.
 * @returns {boolean} - if the element was found.
 */
function closedSetContainsElement<Node>(s : Node[], needle : Node, g : Graph<Node>) {
    for (var n of s) {
        if (g.compareNodes(n, needle) === 0) {
            return true;
        }
    }
    return false;
}

/**
 *  Helper function to backtrack and reconstruct the path to the goal.
 * @param cameFrom - map connecting nodes to eachother.
 * @param current - start node to reconstruct from
 * @returns {Node[]} - list of nodes in the order they were traversed to the goal
 */
function reconstructPath<Node>(
    cameFrom: collections.Dictionary<Node, Node>,
    current: Node
) : Node[] {
    var totalPath = [current];
    while(cameFrom.containsKey(current)){
        current = cameFrom.getValue(current);
        totalPath.unshift(current);
    }
    return totalPath;
}

/**
 * Lookup function which returns the default value Infinity if element wasn't found
 * @param key - key to look up
 * @param map - map to look up in
 * @returns {number} - the value of the key or infinity if not found.
 */
function lookupWithDefaultInfinity<Node>(
    key: Node,
    map: collections.Dictionary<Node, number>
) : number {
    var res = map.getValue(key);
    return res !== undefined ? res : Infinity;
}

/**
 * Helper function to help memoize heurstic value of node
 * @param map - map to store memoized values in
 * @param heuristics - heuristic function to use
 * @param n - node to lookup
 * @returns {number} - returns the number and populates the map if not there already.
 */
function memoizeHeuristics(
    map:collections.Dictionary<Node, number>,
    heuristics : (n:Node) => number,
    n:Node) {
    var res = map.getValue(n);
    if(res !== undefined){
        return res;
    } else {
        res = heuristics(n);
        map.setValue(n, res);
        return res;
    }
}

