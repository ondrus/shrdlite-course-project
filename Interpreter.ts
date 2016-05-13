///<reference path="World.ts"/>
///<reference path="Parser.ts"/>

/**
 * Interpreter module
 *
 * The goal of the Interpreter module is to interpret a sentence
 * written by the user in the context of the current world state. In
 * particular, it must figure out which objects in the world,
 * i.e. which elements in the `objects` field of WorldState, correspond
 * to the ones referred to in the sentence.
 *
 * Moreover, it has to derive what the intended goal state is and
 * return it as a logical formula described in terms of literals, where
 * each literal represents a relation among objects that should
 * hold. For example, assuming a world state where "a" is a ball and
 * "b" is a table, the command "put the ball on the table" can be
 * interpreted as the literal ontop(a,b). More complex goals can be
 * written using conjunctions and disjunctions of these literals.
 *
 * In general, the module can take a list of possible parses and return
 * a list of possible interpretations, but the code to handle this has
 * already been written for you. The only part you need to implement is
 * the core interpretation function, namely `interpretCommand`, which produces a
 * single interpretation for a single command.
 */
module Interpreter {

    //////////////////////////////////////////////////////////////////////
    // exported functions, classes and interfaces/types

    /**
     Top-level function for the Interpreter. It calls `interpretCommand` for each possible parse of the command. No need to change this one.
     * @param parses List of parses produced by the Parser.
     * @param currentState The current state of the world.
     * @returns Augments ParseResult with a list of interpretations. Each interpretation is represented by a list of Literals.
     */
    export function interpret(parses : Parser.ParseResult[], currentState : WorldState) : InterpretationResult[] {
        var errors : Error[] = [];
        var interpretations : InterpretationResult[] = [];
        parses.forEach((parseresult) => {
            try {
                var result : InterpretationResult = <InterpretationResult>parseresult;
                result.interpretation = interpretCommand(result.parse, currentState);
                interpretations.push(result);
            } catch(err) {
                errors.push(err);
            }
        });
        if (interpretations.length) {
            return interpretations;
        } else {
            // only throw the first error found
            throw errors[0];
        }
    }

    export interface InterpretationResult extends Parser.ParseResult {
        interpretation : DNFFormula;
    }

    export type DNFFormula = Conjunction[];
    type Conjunction = Literal[];

    /**
     * A Literal represents a relation that is intended to
     * hold among some objects.
     */
    export interface Literal {
        /** Whether this literal asserts the relation should hold
         * (true polarity) or not (false polarity). For example, we
         * can specify that "a" should *not* be on top of "b" by the
         * literal {polarity: false, relation: "ontop", args:
	 * ["a","b"]}.
         */
        polarity : boolean;
        /** The name of the relation in question. */
        relation : string;
        /** The arguments to the relation. Usually these will be either objects
         * or special strings such as "floor" or "floor-N" (where N is a column) */
        args : string[];
    }

    export function stringify(result : InterpretationResult) : string {
        return result.interpretation.map((literals) => {
            return literals.map((lit) => stringifyLiteral(lit)).join(" & ");
            // return literals.map(stringifyLiteral).join(" & ");
        }).join(" | ");
    }

    export function stringifyLiteral(lit : Literal) : string {
        return (lit.polarity ? "" : "-") + lit.relation + "(" + lit.args.join(",") + ")";
    }

    //////////////////////////////////////////////////////////////////////
    // private functions
    /**
     * The core interpretation function. The code here is just a
     * template; you should rewrite this function entirely. In this
     * template, the code produces a dummy interpretation which is not
     * connected to `cmd`, but your version of the function should
     * analyse cmd in order to figure out what interpretation to
     * return.
     * @param cmd The actual command. Note that it is *not* a string, but rather an object of type `Command` (as it has been parsed by the parser).
     * @param state The current state of the world. Useful to look up objects in the world.
     * @returns A list of list of Literal, representing a formula in disjunctive normal form (disjunction of conjunctions). See the dummy interpetation returned in the code for an example, which means ontop(a,floor) AND holding(b).
     */
    function interpretCommand(cmd : Parser.Command, state : WorldState) : DNFFormula {

        console.log();
        console.log();
        console.log("-------NEW CMD-------");
        console.log();
        console.log();
        console.log(cmd);

        //Entity: quantifier, Object
        //Object: size, form, color OR Location, Object
        //Location: relation, Entity
        //take Entity

        var interpretation : DNFFormula = [
            //{polarity: true, relation: "ontop", args: [a, "floor"]},
            //{polarity: true, relation: "holding", args: [b]}
        ];

        if(cmd.command === "take"){
          var keys = resolveEntityKeys(cmd.entity, state);

          for(var key of keys) {
            interpretation.push([{polarity:true, relation:"holding",
                args: [key]}]);
          }
            //move Entity Location
        }else if(cmd.command === "move"){
            console.log("move");


            var keys = resolveEntityKeys(cmd.entity, state);
            console.log("resolved keys " + keys);
            console.log("keysLocation entety: " + cmd.location.entity.object.form);
            var keysLocation = resolveEntityKeys(cmd.location.entity, state);

            console.log("keys: " + keys);
            console.log("relation      asdasdasdasdsa ", cmd.location.relation);
            console.log("keysLocation: " + keysLocation);

            var tuples = getOkayPairOfArgs(keys, keysLocation, cmd.location.relation, state);
            console.log("pairs", tuples);
            //var derp = checkBinaryConstraint(keys, keysLocation, cmd.location.relation, state);

            if(tuples.length === 0) {
                throw "No interpretations found";
            }

            for(var pair of tuples){
                interpretation.push([{polarity:true, relation:cmd.location.relation,
                    args: pair}]);

            }

        }

        // This returns a dummy interpretation involving two random objects in the world
        //var objects : string[] = Array.prototype.concat.apply([], state.stacks);
        //var a : string = objects[Math.floor(Math.random() * objects.length)];
        //var b : string = objects[Math.floor(Math.random() * objects.length)];
        //var interpretation : DNFFormula = [[
        //    {polarity: true, relation: "ontop", args: [a, "floor"]},
        //    {polarity: true, relation: "holding", args: [b]}
        //]];
        console.log();
        console.log();
        console.log("--------------");
        console.log();
        console.log();
        return interpretation;
    }

    function getOkayPairOfArgs(keys : string[], keys2 : string[], relation : string, state : WorldState) {
        console.log("getOkayPairOfArgs", keys2);
        console.log("getOkayPairOfArgs relation", relation);
        console.log("getOkayPairOfArgs keys: ", keys);


        //if(relation === "ontop"){
        //    keys2.push("floor");
        //}

        var pairs : string[][] = [];
        for(var fk of keys) {
            for (var sk of keys2) {
                if(sk === fk) {
                    continue;
                }
                switch(relation) {
                    case "inside":
                        if(state.objects[sk].form === "box" && state.objects[fk].form !== "floor" && boxCanHoldObject(sk, fk, state)){
                            pairs.push([fk, sk]);
                        }
                        break;
                    case "ontop":
                    //console.log("******inside ontop in switch " + state.objects[sk]);
                        if(sk === "floor" || state.objects[fk].form !== "ball"){
                            pairs.push([fk, sk]);
                        }
                        break;
                    case "beside":
                    case "leftof":
                    case "rightof":
                    case "above":
                        if(state.objects[fk].form !== "floor" && state.objects[sk].form !== "floor") {
                            pairs.push([fk, sk]);
                        }
                        break;
                }
            }
        }
        return pairs;
    }

    function boxCanHoldObject(boxKey : string, objectKey : string, state : WorldState) {
        var boxSize = state.objects[boxKey].size;
        var objectSize = state.objects[objectKey].size;
        return convertSizeToInt(boxSize) >= convertSizeToInt(objectSize);
    }

    function convertSizeToInt(size : String){
        switch (size) {
            case "large":
                return 3;
            case "medium":
                return 2;
            case "small":
                return 1;
            default:
                throw "Unkown size: " + size;
        }
    }

    function resolveEntityKeys(entity: Parser.Entity, state: WorldState): string []{
        var keys = getAllRelevantKeys(state);
        var keySets = [keys];
        var binaryConstraintSets : string [] = [];
        var curr = entity.object;
        //console.log("Init resolveEnitityKeys");
        while(curr.location){
            console.log("current object: " + curr);
            console.log("relation:", curr.location.relation);
            console.log("location object:", curr.location.entity.object);
            keySets.push(resolveUnaryKeys(curr.object, state));

            binaryConstraintSets.push(curr.location.relation);
            curr = curr.location.entity.object;
        }

        //console.log("After first loop");

        var currentKeys = resolveUnaryKeys(curr, state);
        console.log("AFter resolveUnaryKeys", currentKeys);
        console.log("Before second loop ", binaryConstraintSets.length, " ", binaryConstraintSets);
        while(binaryConstraintSets.length > 0){
            var nextKeys = keySets.pop();
            console.log("NExt keys: " + nextKeys);
            currentKeys = checkBinaryConstraint(currentKeys, nextKeys, binaryConstraintSets.pop(), state);
        }
        console.log("After second loop", currentKeys);
        //kolla sista binary constraintet, ta ut "snittet" mellan det och unary
        // fortsätt med nästa binary, kolla snittet med föregående ---^


        return currentKeys;
    }

    function checkBinaryConstraint(curr : string [], next : string [], constraint: string, state : WorldState): string []{
        //leftof rightof inside ontop under beside above
        //for every key in next, check relation with every key in curr

        console.log("checkBinaryConstraint ", constraint);

        var keys : string [] = [];
        if(constraint === "ontop") {
            //keys.push("floor");
            //curr.push("floor");
            state.objects["floor"] = {"form":"floor", "size":"floor", "color":"floor"};
        }

        for(var ck of curr){
            //console.log("comparing ck", ck);
            for(var nk of next){
                if(ck === nk) {
                    continue;
                }

                //console.log("nk", nk);
                switch (constraint){
                    case "rightof" :
                        //find column of nk key thingy
                        //check if nk is rightof ck
                        var nkInd = findIndex(nk, state);
                        var ckInd = findIndex(ck, state);
                        if(nkInd > ckInd){
                            keys.push(nk);
                        }
                        break;

                    case "leftof" :
                        var nkInd = findIndex(nk, state);
                        var ckInd = findIndex(ck, state);
                        if(nkInd < ckInd){
                            keys.push(nk);
                        }
                        break;
                    case "inside" :
                        //console.log("inside", "ontop");
                        var nkInd = findIndex(nk, state);
                        var ckInd = findIndex(ck, state);
                        //console.log("indexes", constraint, nkInd, nk, ckInd, ck);

                        if(nkInd > -1 && ckInd > -1 &&  nkInd === ckInd){
                            //console.log("nk", nk);
                            if(find(nk, state.stacks[nkInd]) - 1 === find(ck,   state.stacks[nkInd]) && state.objects[ck].form === "box"){
                                keys.push(nk);
                                //console.log("Inside pushed: ", nk);
                            }
                        }
                        break;
                    case "ontop" :
                        //console.log("inside", "ontop");
                        var nkInd = findIndex(nk, state);
                        var ckInd = findIndex(ck, state);
                        console.log("indexes", constraint, nkInd, nk, ckInd, ck);
                        if(ck === "floor") {
                            //console.log("floor", "find index", find(nk, state.stacks[nkInd]));
                            if(find(nk, state.stacks[nkInd]) === 0){
                                keys.push(nk);
                                break;
                            }
                        }

                        if(nkInd > -1 && ckInd > -1 &&  nkInd === ckInd){
                            if(find(nk, state.stacks[nkInd]) - 1 === find(ck,   state.stacks[nkInd])){
                                keys.push(nk);
                            }
                        }
                        break;
                    case "under" :
                        var nkInd = findIndex(nk, state);
                        var ckInd = findIndex(ck, state);
                        if(nkInd === ckInd){
                            if(find(nk, state.stacks[nkInd]) + 1 === find(ck,   state.stacks[nkInd])){
                                keys.push(nk);
                            }
                        }
                        break;
                    case "beside" :
                        var nkInd = findIndex(nk, state);
                        var ckInd = findIndex(ck, state);
                        if(nkInd === (ckInd - 1) || nkInd === (ckInd +1)){
                            keys.push(nk);
                        }
                        break;
                    case "above" :
                        var nkInd = findIndex(nk, state);
                        var ckInd = findIndex(ck, state);
                        if(nkInd === ckInd){
                            if(find(nk, state.stacks[nkInd]) > find(ck,   state.stacks[nkInd])){
                                keys.push(nk);
                            }
                        }
                        break;
                }
            }
        }
        return keys;
    }
    function find(needle : string, hayStack : string []){
        for(var i = 0; i < hayStack.length; i++){
            if(hayStack[i] === needle){
                return i;
            }
        }
        return -1;
    }

    function findIndex(needle : string, state: WorldState){
        for(var i = 0; i < state.stacks.length; i++){
            //console.log("searching stack ", i, state.stacks[i], needle);
            for(var s of state.stacks[i]){
                if(s === needle){
                    //console.log("s found ", i);
                    return i;
                }
            }
        }
        return -1;
    }
    function getAllRelevantKeys(state: WorldState) : string[] {
        var keys : string[] = [];
        for(var s of state.stacks) {
            for (var k of s) {
                keys.push(k);
            }
        }
        return keys;
    }

    function resolveUnaryKeys(needle : Parser.Object, state: WorldState){
        console.log("resolveUnaryKeys needle", needle);
        var allKeys = getAllRelevantKeys(state);
        if(needle.form === "floor"){
          return["floor"];
        }

        //state.objects["floor"] = {"form":"floor", "size":"floor", "color":"floor"};
        var possibleKeys : string [] = [];
        //console.log("allKeys ", allKeys);
        //console.log("needle", needle);
        for(var k of allKeys){
            //console.log("loop ", k, possibleKeys);
            if(objectsConsideredEqual(state.objects[k], needle)) {
                possibleKeys.push(k);
            }
            //console.log("end of iterations: ", k);
        }
        //console.log("possibleKeys ", possibleKeys);
        return possibleKeys;

    }

    function  objectsConsideredEqual(o1 : Parser.Object, o2 : Parser.Object) : boolean {
        //console.log("HALLÅ");
        //console.log(o1);
        //console.log(o2);
        var bool = ((!o1.form || !o2.form || o1.form === "anyform" || o2.form === "anyform" || o1.form === o2.form) &&
        (!o1.color || !o2.color || o1.color === o2.color) &&
        (!o1.size || !o2.size || o1.size === o2.size));
        //console.log("Equal ", bool, o1, o2);
        return bool;
    }

}
