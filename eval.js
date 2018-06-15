// simplify the expression tree with rules against of CR and BR also algebra
//
// the analyze is based on symbolic interpretation of the input expression
// program. If BR invovled, the output should be a CR and user can use it
// to translate into an efficient algorithm which computes f(x) over a list of
// periodically increasing numbers

var util = require("util");
var ast  = require("./ast.js");

// The first pass of the algorithm is to translate the AST into a internal
// algebra representation which accepts recursive BR , ie chain of recurrences
// and also do variable substitutino and optionally simple constant folding.
//
// Then this internal IR will be used to do evaluation.

class Constant {
  constructor( value, pos ) {
    this.pos   = pos;
    this.value = value;
  };
};
