///<reference path="World.ts"/>
///<reference path="Parser.ts"/>

/**
* Interpreter module
*
* The goal of the Interpreter module is to interpret a sentence
* written by the user in the context of the current world state.
* It figures out which objects in the world,
* i.e. which elements in the `objects` field of WorldState, correspond
* to the ones referred to in the sentence.
*
* In general, the module can take a list of possible parses and return
* a list of possible interpretations.
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
    /** Whether this literal asserts the relation should hold. */
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
    }).join(" | ");
  }

  export function stringifyLiteral(lit : Literal) : string {
    return (lit.polarity ? "" : "-") + lit.relation + "(" + lit.args.join(",") + ")";
  }

  //////////////////////////////////////////////////////////////////////
  // private functions
  function interpretTakeCase(cmd:Parser.Command, state:WorldState){
      var keys = resolveEntityKeys(cmd.entity, state);
      var valid = keys.filter(k => k !== "floor");
      if(valid.length === 0) {
        throw "No interpretations found";
      }
      return valid.map(validKey => [{polarity:true, relation:"holding", args: [validKey]}]);
  }

  function interpretMoveCase(cmd:Parser.Command, state:WorldState) {
    var keys = resolveEntityKeys(cmd.entity, state);
    var keysLocation = resolveEntityKeys(cmd.location.entity, state);
    var validTuples = filterValidPairs(keys, keysLocation, cmd.location.relation, state);
    if(validTuples.length === 0) {
      throw "No interpretations found";
    }
    return validTuples.map(pair => [{polarity:true, relation:cmd.location.relation, args: pair}]);
  }


  /**
  * The core interpretation function.
  * Analyses cmd in order to figure out what interpretation to return.
  * @param cmd The actual command.
  * @param state The current state of the world.
  * @returns A list of list of Literal, representing a formula in disjunctive normal form.
  */
  function interpretCommand(cmd : Parser.Command, state : WorldState) : DNFFormula {
    if (cmd.command === "take") {
      return interpretTakeCase(cmd, state);
    } else if (cmd.command === "move") {
      return interpretMoveCase(cmd, state);
    } else {
      throw "Invalid command";
    }
  }


    /** Resolves all the relevant keys for this entety.
     * @param entity The entity to resolve keys from.
     * @param state The current state of the world.
     * @returns A list of keys
     */
    function resolveEntityKeys(entity: Parser.Entity, state: WorldState): string [] {
      var obj = entity.object;
      if(obj.location) {
        var entityKeys = resolveEntityKeys(obj.location.entity, state);
        var relation = obj.location.relation;
        var objKeys = resolveObjectKeys(obj, state);
        return checkBinaryConstraint(entityKeys, objKeys, relation, state);
      } else {
        return resolveUnaryKeys(obj, state);
      }
    }

    function resolveObjectKeys(object : Parser.Object, state: WorldState): string [] {
      if(object.location) {
        var objKeys = resolveObjectKeys(object.object, state);
        var entityKeys = resolveEntityKeys(object.location.entity, state);
        return checkBinaryConstraint(entityKeys, objKeys, object.location.relation, state);
      } else {
        return resolveUnaryKeys(object, state);
      }
    }

    /**
    * Makes sure that no invalid combinations occur. e.g. no balls on tables.
    * @param keys The possible source objects to move/hold.
    * @param keys2 The possible target objcets.
    * @param relation The relation between source objects and target objects.
    * @param state The current state of the world.
    * @returns A list of list of valid pairs.
    */
    function filterValidPairs(keys : string[], keys2 : string[], relation : string, state : WorldState) : string[][] {
      var pairs : string[][] = [];
      for(var fk of keys) {
        for (var sk of keys2) {
          if(sk === fk) {
            continue;
          }
          switch(relation) {
            case "inside":
            if(state.objects[sk].form === "box" && state.objects[fk].form !==
              "floor" && boxCanHoldObject(sk, fk, state)){
              pairs.push([fk, sk]);
            }
            break;
            case "ontop":
            if(canPlaceOnTop(sk, fk, state)){
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

    /** Checks if a box can hold an object.
    * @param boxKey The box that should hold the object.
    * @param objectKey The object to be held by the box.
    * @param state The current state of the world.
    * @returns True if the object fits in the box.
    */
    function boxCanHoldObject(boxKey : string, objectKey : string, state : WorldState) : boolean {
      var boxSize = convertSizeToInt(state.objects[boxKey].size);
      var objectSize = convertSizeToInt(state.objects[objectKey].size);
      var form = state.objects[objectKey].form;
      if(form === "pyramid" || form === "plank" || form === "box"){
        return boxSize > objectSize;
      }else if(form === "ball"){
        return boxSize >= objectSize;
      }else{
        return false;
      }

    }

    function canPlaceOnTop(fk : string, sk : string, state : WorldState) : boolean {
      var fSize = convertSizeToInt(state.objects[fk].size);
      var sSize = convertSizeToInt(state.objects[sk].size);
      var fForm = state.objects[fk].form;
      var sForm = state.objects[sk].form;

      if(fForm === "ball"){
        if(sForm === "floor"){
          return true;
        }else if(sForm === "box"){
          return boxCanHoldObject(sk, fk, state);
        }else{
          return false;
        }
      }

      if(fSize > sSize || sForm === "ball"){
        return false;
      }else if(fForm === "box"){
        if(sForm === "pyramid"){
          return !(sSize === fSize);
        }else if(sForm === "brick" && fSize === convertSizeToInt("small")){
          return false;
        }
      }else{
        return true;
      }

    }

    /**
    * Returns a numerical value of the size.
    * Value increases with size.
    */
    function convertSizeToInt(size : String) : number {
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

    /** Checks the binary constraints between the objects.
    * @param curr The keys of the source domain.
    * @param next The keys of the target domain.
    * @param constraint the binary contraint between the domains.
    * @param state The current state of the world.
    * @returns A list of keys fullfilling the constraint
    */
    function checkBinaryConstraint(curr : string [], next : string [], constraint: string, state : WorldState): string []{
      //leftof rightof inside ontop under beside above
      //for every key in next, check relation with every key in curr
      var keys : string [] = [];
      if(constraint === "ontop") {
        state.objects["floor"] = {"form":"floor", "size":"floor", "color":"floor"};
      }
      for(var ck of curr){
        for(var nk of next){
          if(ck === nk) {
            continue;
          }
          var nkInd = findStackIndex(nk, state);
          var ckInd = findStackIndex(ck, state);
          switch (constraint){
            case "rightof" :
            if(nkInd > ckInd){
              keys.push(nk);
            }
            break;
            case "leftof" :
            if(nkInd < ckInd){
              keys.push(nk);
            }
            break;
            case "inside" :
            if(nkInd > -1 && ckInd > -1 &&  nkInd === ckInd){
              if(find(nk, state.stacks[nkInd]) - 1 === find(ck, state.stacks[nkInd]) && state.objects[ck].form === "box"){
                keys.push(nk);
              }
            }
            break;
            case "ontop" :
            if(ck === "floor") {
              if(find(nk, state.stacks[nkInd]) === 0){
                keys.push(nk);
                break;
              }
            }
            if(nkInd > -1 && ckInd > -1 &&  nkInd === ckInd){
              if(find(nk, state.stacks[nkInd]) - 1 === find(ck, state.stacks[nkInd])){
                keys.push(nk);
              }
            }
            break;
            case "under" :
            if(nkInd === ckInd){
              if(find(nk, state.stacks[nkInd]) > find(ck, state.stacks[nkInd])){
                keys.push(nk);
              }
            }
            break;
            case "beside" :
            if(nkInd === (ckInd - 1) || nkInd === (ckInd +1)){
              keys.push(nk);
            }
            break;
            case "above" :
            if(nkInd === ckInd){
              if(find(nk, state.stacks[nkInd]) > find(ck, state.stacks[nkInd])){
                keys.push(nk);
              }
            }
            break;
          }
        }
      }
      return keys;
    }

    /**
    * Returns the position of an element in a list.
    * Returns -1 if the object does not exist in the list.
    */
    function find(needle : string, hayStack : string []) : number {
      for(var i = 0; i < hayStack.length; i++){
        if(hayStack[i] === needle){
          return i;
        }
      }
      return -1;
    }

    /**
    * Returns the position of a object in a stack given the world state.
    * Returns -1 if the object does not exist in the stack.
    */
    function findStackIndex(needle : string, state: WorldState) : number {
      for(var i = 0; i < state.stacks.length; i++){
        for(var s of state.stacks[i]){
          if(s === needle){
            return i;
          }
        }
      }
      return -1;
    }

    /**
    * Returns a list of all the keys in the worls state.
    */
    function getAllRelevantKeys(state: WorldState) : string[] {
      var keys : string[] = [];
      for(var s of state.stacks) {
        for (var k of s) {
          keys.push(k);
        }
      }
      return keys;
    }

    /** Checks the unary constraints of an object.
    * @param needle the object to check unary constraints on.
    * @param state The current state of the world.
    * @returns A list of keys fullfilling the constraints
    */
    function resolveUnaryKeys(needle : Parser.Object, state: WorldState) : string[] {
      if(needle.form === "floor"){
        return["floor"];
      }
      var allKeys = getAllRelevantKeys(state);
      var possibleKeys : string [] = [];
      for(var k of allKeys){
        if(objectsConsideredEqual(state.objects[k], needle)) {
          possibleKeys.push(k);
        }
      }
      return possibleKeys;
    }

    /**
    * Returns true if o1 and o2 is considered equal.
    */
    function  objectsConsideredEqual(o1 : Parser.Object, o2 : Parser.Object) : boolean {
      var bool = ((!o1.form || !o2.form || o1.form === "anyform" || o2.form === "anyform" || o1.form === o2.form) &&
      (!o1.color || !o2.color || o1.color === o2.color) &&
      (!o1.size || !o2.size || o1.size === o2.size));
      return bool;
    }

  }
