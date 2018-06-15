// Simple AST module to represent all the algebra expression with
// all the CR/BR , chains of recurrences / basic recurrence.

class Position {
  constructor() {
    this.source = null;
    this.pos    =    0;
    this.line   =    0;
  }

  constructor( src , p , l ) {
    this.source = src;
    this.pos    =   p;
    this.line   =   l;
  }
};

class Integer {
  constructor( value , pos ) {
    this.position = pos;
    this.value    = value;
  }
};

class Add {
  constructor( lhs , rhs, pos ) {
    this.position = pos;
    this.lhs = lhs;
    this.rhs = rhs;
  }
};

class Sub {
  constructor( lhs , rhs, pos ) {
    this.position = pos;
    this.lhs      = lhs;
    this.rhs      = rhs;
  }
};
