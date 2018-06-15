// Simple AST module to represent all the algebra expression with
// all the CR/BR , chains of recurrences / basic recurrence.

class Position {
  constructor() {
    this.source = null;
    this.start  =    0;
    this.end    =    0;
  }

  constructor( src , s , e ) {
    this.source = src;
    this.start  =   s;
    this.end    =   e;
  }
};

class Operator {
  static get opAdd() { return 1; }
  static get opSub() { return 2; }
  static get opMul() { return 3; }
  static get opDiv() { return 4; }
  static get opPow() { return 5; }
};

class Integer {
  constructor( value , pos ) {
    this.position = pos;
    this.value    = value;
  }
};

class Variable {
  constructor( name , pos ) {
    this.position = pos;
    this.name     = name;
  }
};

class AddRecurrence {
  constructor( start , stride , pos ) {
    this.position = pos;
    this.start    = start;
    this.stride   = stride;
  }
};

class MulRecurrence {
  constructor( start, stride, pos ) {
    this.position = pos;
    this.start    = start;
    this.stride   = stride;
  }
};

class Negate {
  constructor( opr , pos ) {
    this.position = pos;
    this.oprand   = opr;
  }
};

class Binary {
  constructor( lhs , rhs, op, pos ) {
    this.position = pos;
    this.op       =  op;
    this.lhs      = lhs;
    this.rhs      = rhs;
  }
};

class Var {
  constructor( lhs , rhs , pos ) {
    this.position = pos;
    this.lhs      = lhs;
    this.rhs      = rhs;
  }
};

class Output {
  constructor( pos ) {
    this.position = pos;
    this.tuple = [];
    this.limit = null;
  }
};

module.exports = {
  Position : Position ,
  Operator : Operator ,
  Integer  : Integer  ,
  Variable : Variable ,
  AddRecurrence : AddRecurrence,
  MulRecurrence : MulRecurrence,
  Negate   : Negate,
  Binary   : Binary,
  Var      : Var   ,
  Output   : Output
};
