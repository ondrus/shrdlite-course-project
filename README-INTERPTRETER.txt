 	  _           _           _  _  _           _           _           _  _  _
   (_)         (_)         (_)(_)(_)         (_)       _ (_)         (_)(_)(_)
   (_)         (_)            (_)            (_)    _ (_)               (_)
   (_)_       _(_)            (_)            (_) _ (_)                  (_)
     (_)     (_)              (_)            (_)(_) _                   (_)
      (_)   (_)               (_)            (_)   (_) _                (_)
       (_)_(_)              _ (_) _          (_)      (_) _           _ (_) _
         (_)               (_)(_)(_)         (_)         (_)         (_)(_)(_)


Josefin Ondrus, Johan Andersson, Hanna Materne, Sofia Edström


*****Implementation of Interpreter*****

We solved the interpretation problem by modelling it as a constraint graph, where every 
relation is considered a binary constraint and every property is considered a unary constraint,
and then iterately checking constraints to reach arc-consistency.

In the last step, we check the validity of the filtered out objects and the action specified.
For example, that a big ball only can be put in a big box.
