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

  /**
   * Interpretation method for the "take <something> case.
   * Gives meaningful errors should the interpretation be ambigious.
   * @param cmd - command to be interpreted
   * @param state - world state
   * @returns {{polarity: boolean, relation: string, args: string[]}[][]} - intepretations
   */
  function interpretTakeCase(cmd:Parser.Command, state:WorldState){
    var keys = resolveEntityKeys(cmd.entity, state);
    var valid = keys.filter(k => k !== "floor");

    if(valid.length === 0) {
      throw "No interpretations found";
    }

    if(valid.length > 1) {
      throw "Do you mean the " + valid.map(key => stringifyObject(key, state)).join(" or the ") + "?";
    }

    return valid.map(validKey => [{polarity:true, relation:"holding", args: [validKey]}]);
  }
  /**
   * Interpretation method for the "put <what-you're-holding> <somewhere> case.
   * Gives meaningful errors should the interpretation be ambigious.
   * @param cmd - command to be interpreted
   * @param state - world state
   * @returns {{polarity: boolean, relation: string, args: string[]}[][]} - intepretations
   */
  function interpretPutCase(cmd:Parser.Command, state:WorldState) {
    if(!state.holding) {
      throw "What does \"it\" mean? Not holding anything";
    }

    var keys = [state.holding];
    var keysLocation = resolveEntityKeys(cmd.location.entity, state);
    var validTuples = filterValidPairs(keys, keysLocation, cmd.location.relation, state);

    if(validTuples.length === 0) {
      throw "No interpretations found";
    }

    if(validTuples.length > 1) {
      throw produceErrorString(validTuples, cmd.location.relation, state);
    }

    return validTuples.map(pair => [{polarity:true, relation:cmd.location.relation, args: pair}]);
  }

  /**
   * Interpretation method for the "move <something> <somewhere> case.
   * Gives meaningful errors should the interpretation be ambigious.
   * @param cmd - command to be interpreted
   * @param state - world state
   * @returns {{polarity: boolean, relation: string, args: string[]}[][]} - intepretations
   */
  function interpretMoveCase(cmd:Parser.Command, state:WorldState) {
    var keys = resolveEntityKeys(cmd.entity, state);
    var keysLocation = resolveEntityKeys(cmd.location.entity, state);
    var validTuples = filterValidPairs(keys, keysLocation, cmd.location.relation, state);
    if(validTuples.length === 0) {
      throw "No interpretations found";
    }

    if(validTuples.length > 1) {
      throw produceErrorString(validTuples, cmd.location.relation, state);
    }

    return validTuples.map(pair => [{polarity:true, relation:cmd.location.relation, args: pair}]);

  }

  /**
   * Utility method to try conert a key of an object in the world to as simple string as possible.
   * Leaving out unecessary details not needed to uniquefy the object in question.
   * @param key - key of object
   * @param state - world state
   * @returns {string} - string representing the object in a human understandable format.
   */
  export function stringifyObject(key : string, state : WorldState) {
    if(key === "floor"){
      return key;
    }

    var o : Parser.Object = state.objects[key];
    var colorNeeded = false;
    var sizeNeeded = false;

    var propertiesForObjToBeUnique = [o.form];
    getAllRelevantKeys(state).filter(oKey => key !== oKey && state.objects[oKey].form === o.form).forEach(oKey => {
      var o2 : Parser.Object = state.objects[oKey];
      if(o.size === o2.size){
        colorNeeded = true;
      } else if (o.color === o2.color){
        sizeNeeded = true;
      }
    });

    if(sizeNeeded){
      propertiesForObjToBeUnique.unshift(o.size)
    }

    if(colorNeeded){
      propertiesForObjToBeUnique.unshift(o.color)
    }

    if(propertiesForObjToBeUnique.length === 1) {
      propertiesForObjToBeUnique.unshift(o.size);
    }

    return propertiesForObjToBeUnique.join(" ");
  }

  /**
   * A utility method to help translate list of tuples into meaningful errors/questions to help the user give an
   * input that is not ambigious.
   * @param tuples - list of key pairs with source and target key.
   * @param relation - relation between the pairs, inside, etc
   * @param state - the world state
   * @returns {string} - a complete error containing all different ambigious found
   */
  function produceErrorString(tuples : string[][], relation:string, state : WorldState) : string {
    var errors : string[] = [];
    interface LookupObj {
      [name: string]: string[];
    }

    var lookup : LookupObj = {};
    var reverseLookup : LookupObj = {};
    for(var i = 0; i < tuples.length; i++){
      var key1 = tuples[i][0];
      var key2 = tuples[i][1];

      var connected : string[] = lookup[key1] || [];

      connected.push(key2);
      lookup[key1] = connected;

      var connected2 = reverseLookup[key2] || [];
      connected2.push(key1);
      reverseLookup[key2] = connected2;
    }

    for(var k of Object.keys(lookup)) {
      var connected = lookup[k];
      var itemsStrs : string[] = [];
      if(connected.length > 1){
        var msg = " the " + stringifyObject(k, state) + " " + relation +  " the ";
        for (var k2 of connected) {
          itemsStrs.push(stringifyObject(k2, state));
        }
        msg += itemsStrs.join(" or  the ");
        errors.push(msg);
      } else {
        var msg = " the ";
        var reverseConnected = reverseLookup[connected[0]];
        for (var k2 of reverseConnected) {
          itemsStrs.push(stringifyObject(k2, state));
        }
        msg += itemsStrs.join(" or  the ");
        errors.push(msg + " " + relation + " " + stringifyObject(connected[0], state));
        break;
      }

    }

    return "Do you mean to put " + errors.join(" OR");
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
      var formula = interpretTakeCase(cmd, state);
      if(formula.length > 1) {
        throw "Do you mean " + JSON.stringify(formula[0]) + " or " + JSON.stringify(formula[1]);
      }
      return formula;
    } else if (cmd.command === "move") {
      return interpretMoveCase(cmd, state);
    } else if (cmd.command === "put") {
      return interpretPutCase(cmd, state);
    } else {
      throw "Invalid command";
    }
  }

  /** Resolves all the relevant keys for this entity.
   * @param entity The entity to resolve keys from.
   * @param state The current state of the world.
   * @returns A list of keys
   */
  function resolveEntityKeys(entity: Parser.Entity, state: WorldState): string [] {
    var obj = entity.object;
    if (entity.quantifier === "all") {
      throw "Sorry, I cannot understand quantifiers such as all, any etc";
    }
    if(obj.location) {
      var entityKeys = resolveEntityKeys(obj.location.entity, state);
      var relation = obj.location.relation;
      var objKeys = resolveObjectKeys(obj, state);
      return checkBinaryConstraint(entityKeys, objKeys, relation, state);
    } else {
      return resolveUnaryKeys(obj, state);
    }
  }

  /** Resolves all the relevant keys for this entity.
   * @param object - The object to resolve keys from.
   * @param state The current state of the world.
   * @returns A list of keys
   */
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
    var alreadyTrue : string[][] = [];

    for(var fk of keys) {
      for (var sk of keys2) {
        if(sk === fk) {
          continue;
        }

        if(checkBinaryConstraint([sk], [fk], relation, state).length === 1){
          alreadyTrue.push([sk, fk]);
          continue;
        }

        switch(relation) {
          case "ontop":
          case "inside":
            if(canPlaceOnTopOrInside(fk, sk, state)){
              pairs.push([fk, sk]);
            }
            break;
          case "above":
            if(state.objects[fk].form !== "floor" && state.objects[sk].form !== "floor" && state.objects[sk].form !== "ball") {
              pairs.push([fk, sk]);
            }
            break;
          case "under":
            if(state.objects[fk].form !== "floor" && state.objects[sk].form !== "floor" && state.objects[fk].form !== "ball" && canPlaceOnTopOrInside(sk, fk, state)) {
              pairs.push([fk, sk]);
            }
            break;
          case "beside":
          case "leftof":
          case "rightof":
            if(state.objects[fk].form !== "floor" && state.objects[sk].form !== "floor") {
              pairs.push([fk, sk]);
            }
            break;
        }
      }
    }
    if(pairs.length === 0 && alreadyTrue.length > 0){
      throw "This is already true";
    }
    return pairs;
  }

  /**
   * Checks if an object can be placed ontop/inside another object in the world.
   * @param key1 - key to object to be placed
   * @param key2 - key to object to be placed on/inside
   * @param state - world state
   * @returns {boolean} - whatever the object can be placed there or not.
   */
  export function canPlaceOnTopOrInside(key1 : string, key2 : string, state : WorldState) {
    if(key2 === "floor" || (state.objects[key1].form !== "ball" && state.objects[key2].form !== "box" && canPlaceOnTop(key1, key2, state))) {
      return true;
    } else if(state.objects[key2].form === "box" && state.objects[key1].form !== "floor" && boxCanHoldObject(key2, key1, state)){
      return true;
    } else {
      return false;
    }
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

  /**
   * Checks if key can be placed ontop of another object
   * @param fk - key to the source object to be placed
   * @param sk - key to the target object for the source object to be placed upon
   * @param state - world state to check this in
   * @returns {boolean} - if this is okay.
   */
  function canPlaceOnTop(fk : string, sk : string, state : WorldState) : boolean {
    var fSize = convertSizeToInt(state.objects[fk].size);
    var sSize = convertSizeToInt(state.objects[sk].size);
    var fForm = state.objects[fk].form;
    var sForm = state.objects[sk].form;

    if(fSize > sSize || sForm === "ball"){
      return false;
    }else if(fForm === "box"){
      if(sForm === "pyramid"){
        return !(sSize === fSize);
      }else if(sForm === "brick" && fSize === convertSizeToInt("small")){
        return false;
      }
    }
    return true;

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
  export function checkBinaryConstraint(curr : string [], next : string [], constraint: string, state : WorldState): string []{
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
            if(rightOf(nk, nkInd, ck, ckInd)){
              keys.push(nk);
            }
            break;
          case "leftof" :
            if(leftOf(nk, nkInd, ck, ckInd)){
              keys.push(nk);
            }
            break;
          case "inside" :
            if(inside(nk, nkInd, ck, ckInd, state)){
              keys.push(nk);
            }
            break;
          case "ontop" :
            if(ontop(nk, nkInd, ck, ckInd, state)){
              keys.push(nk);
            }
            break;
          case "under" :
            if(under(nk, nkInd, ck, ckInd, state)){
              keys.push(nk);
            }
            break;
          case "beside" :
            if(beside(nk, nkInd, ck, ckInd, state)){
              keys.push(nk);
            }
            break;
          case "above" :
            if(above(nk, nkInd, ck, ckInd, state)){
              keys.push(nk);
            }
            break;
        }
      }
    }
    return keys;
  }

  /**
   *
   * Below follows a list of predicates to check if a particular pair of keys hold for the relation the
   * function named describes. Returns true if this is the case.
   *
   */

  function rightOf(key1 : string, key1Ind : number, key2 : string, key2Ind : number) {
    return (key1Ind > -1 && key2Ind > -1) && (key1Ind > key2Ind);
  }

  function leftOf(key1 : string, key1Ind : number, key2 : string, key2Ind : number) {
    return  (key1Ind > -1 && key2Ind > -1) && (key1Ind < key2Ind);
  }

  function inside(key1 : string, key1Ind : number, key2 : string, key2Ind : number, state : WorldState) {
    if(key1Ind > -1 && key2Ind > -1 &&  key1Ind === key2Ind){
      if(find(key1, state.stacks[key1Ind]) - 1 === find(key2, state.stacks[key1Ind]) && state.objects[key2].form === "box"){
        return true
      }
    }
    return false;
  }

  function ontop(key1 : string, key1Ind : number, key2 : string, key2Ind : number, state : WorldState) {
    if(key2 === "floor" && key1Ind > -1) {
      if(find(key1, state.stacks[key1Ind]) === 0){
        return true;
      }
    }

    if(key1Ind > -1 && key2Ind > -1 &&  key1Ind === key2Ind){
      if(find(key1, state.stacks[key1Ind]) - 1 === find(key2, state.stacks[key1Ind])){
        return true;
      }
    }

    return false;
  }

  function under(key1 : string, key1Ind : number, key2 : string, key2Ind : number, state : WorldState) {
    if((key1Ind > -1 && key2Ind > -1) && key1Ind === key2Ind){
      if(find(key1, state.stacks[key1Ind]) < find(key2, state.stacks[key2Ind])){
        return true;
      }
    }
    return false;
  }

  function beside(key1 : string, key1Ind : number, key2 : string, key2Ind : number, state : WorldState) {
    return (key1Ind > -1 && key2Ind > -1) && (key1Ind === (key2Ind - 1) || key1Ind === (key2Ind + 1));
  }

  function above(key1 : string, key1Ind : number, key2 : string, key2Ind : number, state : WorldState){
    if((key1Ind > -1 && key2Ind > -1) && key1Ind === key2Ind){
      if(find(key1, state.stacks[key1Ind]) > find(key2, state.stacks[key2Ind])){
        return true;
      }
    }
    return false;
  }

  /**
   * Returns the position of an element in a list.
   * Returns -1 if the object does not exist in the list.
   */
  export function find(needle : string, hayStack : string []) : number {
    if(!hayStack){
      return -1;
    }
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
  export function findStackIndex(needle : string, state: WorldState) : number {
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
   * Returns a list of all the keys in the worlds state.
   */
  function getAllRelevantKeys(state: WorldState) : string[] {
    var keys : string[] = [];
    for(var s of state.stacks) {
      for (var k of s) {
        keys.push(k);
      }
    }
    if(state.holding){
      keys.push(state.holding);
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
