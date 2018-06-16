###A javascript implementation of *Chains Of Recurrences*
==================================

Chains Of Recurrences , ie CR , is an interesting algebra and it is of greate importance for compiler optimization. As far as I know, LLVM utilize this concept to implement its intenral Scalar Evolution analysis which forms the fundation of the loop optimization.

In simple term, a recurrence relationship is a periodically changed number sequence. And the point of chains of recurrences is to simplify caculation of function f(x) over a sequence number x. To calculate f(x[i]) , CR allow us to utilize result of f(x[i-1]) to simplify calculation needed.

This implementation of CR only implements the *Add Recurrences* which is the one typically used in optimizer. For multiplication recurrences it is easy to extend it intenrally but I just leave it out. The input is a small simple script and the framework will automatically deduct the expression and apply algebra rules to get the final CR result. The final CR result is essentially the program needed to perform CR evaluation.

The algebra script is simple, it allows normal infix arithmetic expression , except it doesn't allow division and only allowed operator are + , - and * . The division makes us needs to deal with floating number which is out of my interest and also doesn't have abitary precision floating number in Javascript to my best knowledge. Variable definition is allowed by using `var x = 100` and later expression which contains variable will get its substituion. To specify the output expression user needs to use keyword `output` to specify a list of expression. Example as following:

```
var i = {0,+,2} # specify a basic recurrense starting from 0 and increase by 2

var h = 29
var g = 37

# speicify all the output we want to have
output [ i*i*i*i*i*147 + i*i*177 + i*h + g ,  # the first expression we want to do simplification
         i*i*i                                # the second expression we want to do simplification
       ]

```

The above script should be self explained , checkout example.js to see how to use the API to do
CR simplification.

Please Google for the CR paper to learn more about this algebra concept.
