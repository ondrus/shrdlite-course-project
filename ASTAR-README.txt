

    _           _           _  _  _           _           _           _  _  _
   (_)         (_)         (_)(_)(_)         (_)       _ (_)         (_)(_)(_)
   (_)         (_)            (_)            (_)    _ (_)               (_)
   (_)_       _(_)            (_)            (_) _ (_)                  (_)
     (_)     (_)              (_)            (_)(_) _                   (_)
      (_)   (_)               (_)            (_)   (_) _                (_)
       (_)_(_)              _ (_) _          (_)      (_) _           _ (_) _
         (_)               (_)(_)(_)         (_)         (_)         (_)(_)(_)


 Josefin Ondrus, Johan Andersson, Hanna Materne, Sofia Edström

 ***** implementation of A*

 Most of the implementation is, as you call it, bog-standard.
 We've worked with the wikipedia pseudo-code as foundation with small changes
 where we've seem fit. Some weaknesses that we are aware of are commented where
 where they occur in the code. The same holds for not so obvious structures and
 decisions.

 All tests pass, however we get a warning on the running time in the majority
 of runs. We measure the number of iterations and when we compared it with the
 number of iteration with/without heuristics we can see that we actually get
 about 40% less iterations with heuristics. (We sent you an email regarding this
 commenting on the simplicity in the test cases making them "too easy" for
 our computers to solve.)

 We make sure to store the heuristics to order the nodes in the open set
 and only update the heuristics when necessary.

 Happy correcting!
 Cheers
 V.I.K.I.
