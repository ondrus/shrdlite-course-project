
# Shrdlite project

###Files

####Graph.ts
Exposing interfaces for graph, edges to be implemented to be used with the aStarSearch method implementing a version of A* search.

####Heuristics.ts
Most of our more advanced features of our heursitic function bundled in this helper module. One function for each possible relation: beside, ontop, rightof, leftof, above, holding. We then have a switch-case-statement to choice which heuristic function to use in our delegating heuristic function in the planner.

####Interpreter.ts
Our interpreter trying to the best of it's ability to interpret a parse tree into a meaningful logical expression if it is valid according to the physical laws and seems sane in the world. It draws some conclusions to try disambiguate interpretations. For example if we say "put the ball on the floor" in the medium world the interpreter assume you do not mean the ball already on the floor and instead take the other one.

If despite such assumptions more then one interpretation remains it throws an exception with an explanation in the error message trying to simplify it as far as possible to something such as "Do you mean the small or the large ball?" It does not handle the person answering directly though, the user need to re-input the whole string but add specific properties to the ambiguities found.

It also contains a util method `stringifyObject` which helps taking a key and the WorldState and try to stingify it with the smallest possible unique-fying string. For example if there is two tables and they're different size but same colour it stringify them as "small table" and "large table" leaving out the non-helpful colour.

####Planner.ts
The planner takes an interpretation result and try to formulate it into a sequence of actions to be carried out to reach the that interpretation's goal. It does this by providing a goal-function and a heuristic-function which is used in a call to the Graph modules aStarSearch performing A* search to find a plan. This plan is then decorated with explanatory strings to better help the user see what the AI is doing. Currently the planning has a timeout of 120 seconds.

####WorldGraph
An implementation of the Graph-modules Graph and Edge interface to build a specific graph related to our problem. It creates a graph with nodes containing the action that brought them their and the state of the world given by `WorldState`. It dynamically generated new outgoing edges and nodes as they're requested to possibly generating an infinite graph.

###Extensions
 - To ask the user clarification questions when the utterance is ambiguous, e.g. “do you mean the large red pyramid or the small green?”

We've sort of done this. It does not respond specifically to answers to the clarification questions. However we do output meaningful error messages explaining the different ambiguities. For example if asked to "pick up the ball" in the medium world it raises the error: "Interpretation error: Do you mean the large ball or the small ball?"

An example of a more advanced case: "put the ball in the box" in the medium world gives the Interpretation error: "Interpretation error: Do you mean to put the large ball inside the red box or the yellow box OR the small ball inside the red box or the yellow box"

- To make the planner describe what it is doing, in a way that is understandable to humans. One important part of this will be to know how to describe the different objects in a concise way (e.g., if there is only one ball, then you don’t have to say that it is white).

The planner describes which object it is moving where and try to simplify the description of the objects.
For example in the medium world: "put the yellow pyramid on the red plank" gives the followign output:
Moving the small pyramid to the floor
Moving the small table to the floor
Moving the small brick ontop of the small table
Moving the large pyramid ontop of the large plank

- More fine-grained cost calculation, taking the height of the stacks into account.

We believe our heuristic function is quite fine-grained mostly taking stack heights and distance between objects/stacks into account without being overly complex. Given some time it can solve more complex problems in a reasonable time. For example "put the green plank on the red table" in the medium world which is quite complex problem is solve, at least on our computers, in just above 30 seconds.
