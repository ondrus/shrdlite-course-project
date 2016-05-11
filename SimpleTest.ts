///<reference path="lib/collections.ts"/>
///<reference path="lib/node.d.ts"/>
///<reference path="Graph.ts"/>
///<reference path="Test.ts"/>


var simpleGraph = new GridGraph({x:3, y:3}, [{x:1, y:1}]);
console.log(simpleGraph.toString());
var start = new TestNode({x: 0, y: 0});
var goal = new TestNode({x: 2, y: 2});
var goalf = (n: TestNode) => n.compareTo(goal) == 0;
var h = (n: TestNode) => 0; //Math.abs(n.pos.x - goal.pos.x) + Math.abs(n.pos.y - goal.pos.y);

console.log("Start: " + start.toString());
console.log("Goal: " + goal.toString());
var result  = aStarSearch(simpleGraph, start, goalf, h, 1000);
console.log("Result: " + result.path);
console.log("Cost: " + result.cost);
console.log(simpleGraph.drawPath(start, goal, result.path));
