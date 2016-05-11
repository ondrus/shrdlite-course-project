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
        console.log(cmd);
        var needle = cmd.entity;
        var possibleObjs : Parser.Object [] = [];
        var i = 0;

        for(i ; i < keys.length; i++){
          if(state.objects[keys[i]].form === needle.object.form &&
            state.objects[keys[i]].size === needle.object.size &&
            state.objects[keys[i]].color === needle.object.color){
              possibleObjs.push(state.objects[keys[i]]);
            }
        }
        if(possibleObjs.length === 0){

        }


        //Entity: quantifier, Object
        //Object: size, form, color OR Location, Object
        //Location: relation, Entity
        //take Entity

        var interpretation : DNFFormula = [[
            //{polarity: true, relation: "ontop", args: [a, "floor"]},
            //{polarity: true, relation: "holding", args: [b]}
        ]];

        if(cmd.command === "take"){

        //move Entity Location
        }else if(cmd.command === "move"){

          var keys = resolveEntityKeys(cmd.entity, state);
          var keysLocation = resolveEntityKeys(cmd.location.entity, state);
          for(var k of keys){
            for(var kl of keysLocation){
              interpretation[0].push({polarity:true, relation:cmd.location.relation,
              args: [k, kl]});
            }
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
        return interpretation;
    }

    function resolveEntityKeys(entity: Parser.Entity, state: WorldState): string []{
      var keys = Object.keys(state.objects);
      var keySets = [keys];
      var binaryConstraintSets : string [] = [];
      var curr = entity.object;

      while(curr.location){
        keySets.push(Object.keys(state.objects));
        binaryConstraintSets.push(curr.location.relation);
        curr = curr.location.entity.object;
      }

      var currentKeys = resolveUnaryKeys(curr, state);
      while(binaryConstraintSets.length > 0){
        var nextKeys = keySets.pop();
        currentKeys = checkBinaryConstraint(currentKeys, nextKeys,                    binaryConstraintSets.pop(), state);
      }
      //kolla sista binary constraintet, ta ut "snittet" mellan det och unary
      // fortsätt med nästa binary, kolla snittet med föregående ---^


      return currentKeys;
    }

    function checkBinaryConstraint(curr : string [], next : string [], constraint: string, state : WorldState): string []{
      //leftof rightof inside ontop under beside above
      //for every key in next, check relation with every key in curr
      var keys : string [] = [];
      for(var ck of curr){
        for(var nk of next){
          switch (constraint){
            case "rightof" :
              //find column of nk key thingy
              //check if nk is rightof ck
              var nkInd = findIndex(nk, state);
              var ckInd = findIndex(ck, state);
              if(nkInd === (ckInd + 1)){
                keys.push(nk);
              }
              break;

            case "leftof" :
              var nkInd = findIndex(nk, state);
              var ckInd = findIndex(ck, state);
              if(nkInd === (ckInd - 1)){
                keys.push(nk);
              }
              break;
            case "inside" :
            case "ontop" :
              var nkInd = findIndex(nk, state);
              var ckInd = findIndex(ck, state);
              if(nkInd === ckInd){
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
        for(var s of state.stacks[i]){
          if(s === needle){
            return i;
          }
        }
      }
      return -1;
    }
    function resolveUnaryKeys(needle : Parser.Object, state: WorldState){
      var allKeys = Object.keys(state.objects);
      var possibleKeys : string [] = [];
      for(var i = 0 ; i < allKeys.length; i++){
        if(state.objects[allKeys[i]].form === needle.object.form &&
          state.objects[allKeys[i]].size === needle.object.size &&
          state.objects[allKeys[i]].color === needle.object.color){
            possibleKeys.push(allKeys[i]);
          }
      }
      return possibleKeys;

    }

}
