// Simple AST module to represent all the algebra expression with
// all the CR/BR , chains of recurrences / basic recurrence.

class Position {
  constructor( src , s , e ) {
    this.source = src;
    this.start  =   s;
    this.end    =   e;
  }

  get snippet() {
    return this.source.substr(this.start,this.end-this.start);
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
  constructor(pos,tuple) {
    this.position = pos;
    this.tuple = tuple;
  }
};

class Program {
  constructor(pos,stmt) {
    this.position = pos;
    this.statement= stmt;
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
  Output   : Output,
  Program  : Program
};
