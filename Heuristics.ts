///<reference path="Interpreter.ts"/>

/**
 * This module consist of different part of our hueristic function. Our heuristic function is composed of different functions
 * depending on which relation were searching for. Each relation has a corresponding function here with the exception of the composed function
 * insideOrOntopOrBelowHeuristic which takes more then one relation into account. This among with some utility/helper methods.
 * They should all have self explainatory names.
 */
module Heuristics {

    import Literal = Interpreter.Literal;

    var NBR_ACTIONS_NEEDED_TO_MOVE_OBJ_FROM_STACK = 3;
    
    
    export function besideHeuristic(literal : Literal, state : WorldState) {
        var key1 = literal.args[0];
        var key2 = literal.args[1];
        var key1StackIndex = Interpreter.findStackIndex(key1, state);
        var key2StackIndex = Interpreter.findStackIndex(key2, state);

        var distance : number = Math.abs(Math.abs(key2StackIndex - key1StackIndex) - 1);

        if(state.holding === key1 || state.holding === key2) {
            return distance;
        }

        return distance +
            Math.min(
                objectsAboveKey(key1, state.stacks[key1StackIndex]) * NBR_ACTIONS_NEEDED_TO_MOVE_OBJ_FROM_STACK,
                objectsAboveKey(key2, state.stacks[key2StackIndex]) * NBR_ACTIONS_NEEDED_TO_MOVE_OBJ_FROM_STACK
            );
    }

    export function leftOfHeuristic(literal : Literal, state : WorldState) {
        var key1 = literal.args[0];
        var key2 = literal.args[1];

        if(state.holding === key1) {
            return Math.abs(state.arm - Interpreter.findStackIndex(key2, state));
        }

        if(state.holding === key2) {
            return Math.abs(state.arm - Interpreter.findStackIndex(key1, state));
        }

        var key1StackIndex = Interpreter.findStackIndex(key1, state);
        var key2StackIndex = Interpreter.findStackIndex(key2, state);

        var distance : number = Math.abs(key2StackIndex - key1StackIndex);

        if(key2StackIndex < key1StackIndex) {
            return 0;
        } else {
            if(key2StackIndex === 0) {
                return objectsAboveKey(key2, state.stacks[key2StackIndex]) * NBR_ACTIONS_NEEDED_TO_MOVE_OBJ_FROM_STACK +
                    distance;
            } else {
                return distance + Math.min(
                        objectsAboveKey(key1, state.stacks[key1StackIndex]),
                        objectsAboveKey(key2, state.stacks[key2StackIndex])) * NBR_ACTIONS_NEEDED_TO_MOVE_OBJ_FROM_STACK;
            }
        }
    }

    export function rightOfHeuristic(literal : Literal, state : WorldState) {
        var key1 = literal.args[0];
        var key2 = literal.args[1];

        if(state.holding === key1) {
            return Math.abs(state.arm - Interpreter.findStackIndex(key2, state));
        }

        if(state.holding === key2) {
            return Math.abs(state.arm - Interpreter.findStackIndex(key1, state));
        }

        var key1StackIndex : number = Interpreter.findStackIndex(key1, state);
        var key2StackIndex : number = Interpreter.findStackIndex(key2, state);

        var distance : number = Math.abs(key2StackIndex - key1StackIndex);

        if(key2StackIndex > key1StackIndex) {
            return 0;
        } else {
            if(key2StackIndex === state.stacks.length - 1) {
                return objectsAboveKey(key2, state.stacks[key2StackIndex]) * NBR_ACTIONS_NEEDED_TO_MOVE_OBJ_FROM_STACK +
                    distance;
            } else {
                return distance + Math.min(
                        objectsAboveKey(key1, state.stacks[key1StackIndex]),
                        objectsAboveKey(key2, state.stacks[key2StackIndex])) * NBR_ACTIONS_NEEDED_TO_MOVE_OBJ_FROM_STACK;
            }
        }
    }

    export function aboveHeuristic(literal : Literal, state : WorldState) {
        var key1 = literal.args[0];
        var key2 = literal.args[1];

        if(state.holding === key1) {
            return Math.abs(state.arm - Interpreter.findStackIndex(key2, state));
        }
        var key1StackIndex = Interpreter.findStackIndex(key1, state);

        if(state.holding === key2) {
            return Math.abs(state.arm - Interpreter.findStackIndex(key1, state)) +
                objectsAboveKey(key1, state.stacks[key1StackIndex]) * NBR_ACTIONS_NEEDED_TO_MOVE_OBJ_FROM_STACK;
        }

        var key2StackIndex = Interpreter.findStackIndex(key2, state);
        var distance : number = Math.abs(key2StackIndex - key1StackIndex);

        return distance + objectsAboveKey(key1, state.stacks[key1StackIndex]) * NBR_ACTIONS_NEEDED_TO_MOVE_OBJ_FROM_STACK;
    }

    function distanceToKey(key:string, state:WorldState) {
        var stackIndex = Interpreter.findStackIndex(key, state);
        var objectsAboveStart = objectsAboveKey(key, state.stacks[stackIndex]) * NBR_ACTIONS_NEEDED_TO_MOVE_OBJ_FROM_STACK;
        var armIndex = state.arm;
        return Math.abs(armIndex - stackIndex) + objectsAboveStart;
    }

    export function holdingHeuristic(literal:Literal, state:WorldState):number {
        var key = literal.args[0];
        if (state.holding === key) {
            return 0;
        }
        return distanceToKey(key, state);
    }

    export function insideOrOntopOrBelowHeuristic(literal:Literal, state:WorldState):number {
        var startKey = literal.args[0];
        var goalKey = literal.args[1];
        var distanceToGoal:number = 0;

        if (goalKey === "floor") {
            if(startKey === state.holding) {
                return findClosestFloor(state.arm, state);
            } else {
                var startKeyIndex = Interpreter.findStackIndex(startKey, state);
                distanceToGoal = findClosestFloor(startKeyIndex, state);
                return Math.abs(state.arm - startKeyIndex) + objectsAboveKey(startKey, state.stacks[startKeyIndex]) * NBR_ACTIONS_NEEDED_TO_MOVE_OBJ_FROM_STACK + distanceToGoal;
            }
        }


        if(goalKey === state.holding) {
            var startKeyIndex = Interpreter.findStackIndex(startKey, state);
            return Math.abs(startKeyIndex - state.arm) + objectsAboveKey(startKey, state.stacks[startKeyIndex]) * NBR_ACTIONS_NEEDED_TO_MOVE_OBJ_FROM_STACK;
        } else if (startKey === state.holding) {
            var goalKeyIndex = Interpreter.findStackIndex(goalKey, state);
            return Math.abs(goalKeyIndex - state.arm) + objectsAboveKey(goalKey, state.stacks[goalKeyIndex]) * NBR_ACTIONS_NEEDED_TO_MOVE_OBJ_FROM_STACK;
        } else {
            var startKeyIndex = Interpreter.findStackIndex(startKey, state);
            var goalKeyIndex = Interpreter.findStackIndex(goalKey, state);
            var objectsAboveStart = objectsAboveKey(startKey, state.stacks[startKeyIndex]) * NBR_ACTIONS_NEEDED_TO_MOVE_OBJ_FROM_STACK;
            var objectsAboveGoal = objectsAboveKey(goalKey, state.stacks[goalKeyIndex]) * NBR_ACTIONS_NEEDED_TO_MOVE_OBJ_FROM_STACK;
            var distanceBetweenStartAndGoal = Math.abs(startKeyIndex - goalKeyIndex);
            var distanceBetweenArmAndStart = Math.abs(state.arm - startKeyIndex);

            return objectsAboveStart + objectsAboveGoal + distanceBetweenStartAndGoal + distanceBetweenArmAndStart;

        }

    }

    function objectsAboveKey(key:string, stack:string[]):number {
        return (stack.length - 1) - Interpreter.find(key, stack);
    }

    function findClosestFloor(index:number, state:WorldState):number {
        var closestFloor = Infinity;
        for (var i = 0; i < state.stacks.length; i++) {
            var curr:number = state.stacks[i].length + Math.abs(i - index);
            if (curr < closestFloor) {
                closestFloor = curr;
            }
        }
        return closestFloor;
    }
}