///<reference path="Interpreter.ts"/>
///<reference path="Graph.ts"/>

/**
 * Wrapper node class wrapping world state with the action that was
 * the source for moving into this state.
 */
class WorldWrapperNode {
    state:WorldState;
    action:string;

    constructor(state:WorldState, action:string) {
        this.state = state;
        this.action = action;
    }

    toString() {
        return this.state.arm + this.state.holding + this.state.stacks.join();
    }
}

/**
 * A graph describing different states of a Shrdlite world.
 */
class WorldGraph implements Graph<WorldWrapperNode> {

    /**
     * Dynamically generating outgoing edges of a particular state
     * @param node - the node to generate edges from
     * @returns {Edge<WorldWrapperNode>[]} - the edges going out from this node. Respectign physical laws and such.
     */
    outgoingEdges(node:WorldWrapperNode):Edge<WorldWrapperNode>[] {
        var edges:Edge<WorldWrapperNode>[];
        edges = [];
        var state = node.state;
        if (!state.holding) {
            if (state.stacks[state.arm].length > 0) {
                edges.push(this.createPickUpActionEdge(node));
            }
        } else {
            if (state.stacks[state.arm].length > 0) {
                if (canDrop(state)) {
                    edges.push(this.createDropActionEdge(node));
                }
            } else {
                edges.push(this.createDropActionEdge(node))
            }
        }

        if (state.arm > 0) {
            edges.push(this.createLeftMoveActionEdge(node));
        }

        if (state.arm < state.stacks.length - 1) {
            edges.push(this.createRightMoveActionEdge(node));
        }
        return edges;
    }

    /**
     * Utility method to compare two nodes and tell if they're alike.
     * @param ws1 - first node
     * @param ws2 - second node
     * @returns {number} - if non-zero they're different. The value is otherwise nonsensical.
     */
    compareNodes(ws1:WorldWrapperNode, ws2:WorldWrapperNode):number {
        var s1 = ws1.state;
        var s2 = ws2.state;
        if (s1.arm === s2.arm && s1.holding === s2.holding) {
            for(var i = 0; i < s1.stacks.length; i++) {
                if(s1.stacks[i].length !== s2.stacks[i].length) {
                    return 1;
                }
            }

            for(var i = 0; i < s1.stacks.length; i++) {
                if(s1.stacks[i].length !== s2.stacks[i].length){
                    return 1;
                }
                for(var j = 0; j < s1.stacks[i].length; j++){
                    if(s1.stacks[i][j] !== s2.stacks[i][j]){
                        return 1;
                    }
                }
            }
            return 0;
        } else {
            return 1;
        }
    }

    private createPickUpActionEdge(node:WorldWrapperNode):Edge<WorldWrapperNode> {
        var e = new Edge<WorldWrapperNode>();
        e.cost = 1;
        e.from = node;
        var nextState = copyWorld(node.state);
        nextState.holding = nextState.stacks[nextState.arm].pop();
        e.to = new WorldWrapperNode(nextState, "p");

        return e;
    }

    private createDropActionEdge(node:WorldWrapperNode):Edge<WorldWrapperNode> {
        var e = new Edge<WorldWrapperNode>();
        e.cost = 1;
        e.from = node;
        var nextState = copyWorld(node.state);
        nextState.stacks[nextState.arm].push(nextState.holding);
        nextState.holding = null;
        e.to = new WorldWrapperNode(nextState, "d");
        return e;
    }

    private createLeftMoveActionEdge(node:WorldWrapperNode):Edge<WorldWrapperNode> {
        var e = new Edge<WorldWrapperNode>();
        e.cost = 1;
        e.from = node;
        var nextState = copyWorld(node.state);
        nextState.arm--;
        e.to = new WorldWrapperNode(nextState, "l");
        return e;
    }

    private createRightMoveActionEdge(node:WorldWrapperNode):Edge<WorldWrapperNode> {
        var e = new Edge<WorldWrapperNode>();
        e.cost = 1;
        e.from = node;
        var nextState = copyWorld(node.state);
        nextState.arm++;
        e.to = new WorldWrapperNode(nextState, "r");
        return e;
    }


}

/**
 * Utility method to copy the world.
 * @param s - Worlstate
 * @returns - a copy of the world.
 */
function copyWorld(s:WorldState):WorldState {
    return JSON.parse(JSON.stringify(s));
}

/**
 * Wrapper method to Interpreter's canPlaceOnTopOrInside to help tell if it is possible to drop current item
 * in the arm at it's location.
 * @param s - current world state
 * @returns {boolean} - if a drop is allowed or not according to the physical laws.
 */
function canDrop(s:WorldState) : boolean {
    var key1 = s.holding;
    var stack = s.stacks[s.arm];
    var key2 = stack[stack.length - 1];
    return Interpreter.canPlaceOnTopOrInside(key1, key2, s);
}