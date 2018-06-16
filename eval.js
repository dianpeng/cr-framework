// simplify the expression tree with rules against of CR and BR also algebra
//
// the analyze is based on symbolic interpretation of the input expression
// program. If BR invovled, the output should be a CR and user can use it
// to translate into an efficient algorithm which computes f(x) over a list of
// periodically increasing numbers

var util = require("util");
var ast  = require("./ast.js");

function mergePosition(lhs,rhs) {
  let start = Math.min(lhs.start,rhs.start);
  let end   = Math.max(lhs.end  ,rhs.end  );
  return new ast.Position(lhs.source,start,end);
}

function unexpected(node) {
  let msg = util.format("unexpected expression node here %s",node.constructor.name);
  let stk = new Error().stack;
  throw util.format("%s\n%s",msg,stk);
}

// There're 2 internal IR node that is used to do CR algebra algorithm. These 2 IR node
// will implements the corresponding CR algebra rules and AST node will be converted
// into the following 2 IR nodes for evaluation. After the evaluation, we should only
// see 1) constant or 2) CR. The CR node is essentially recursively nested
class CR {
  constructor( first , rest , pos ) {
    this.position = pos;
    this.first    = first;
    this.rest     = rest;
  }

  // operator evaluation
  add(rhs) {
    if( rhs instanceof Constant ) {
      return new CR( this.first.add(rhs) , this.rest ,
                                           mergePosition(this.position ,rhs.position));
    } else if( rhs instanceof CR ) {
      return new CR( this.first.add(rhs.first) , this.rest.add(rhs.rest) ,
                                                 mergePosition(this.position ,rhs.position));
    } else {
      unexpected(rhs);
    }
  }

  sub(rhs) {
    if( rhs instanceof Constant ) {
      return this.add(rhs.negate());
    } else if( rhs instanceof CR ) {
      // CR - CR
      return new CR( this.first.sub(rhs.first) , this.rest.sub(rhs.rest) ,
                                                 mergePosition(this.position ,rhs.position));
    } else {
      unexpected(rhs);
    }
  }

  mul(rhs) {
    if( rhs instanceof Constant ) {
      return new CR( this.first.mul(rhs) , this.rest.mul(rhs) ,
                                           mergePosition(this.position,rhs.position));
    } else if( rhs instanceof CR ) {
      let firstComp = this.first.mul(rhs.first);
      let rc1       = this.mul(rhs.rest);
      let rc2       = rhs.rest.mul(this.rest);
      let rc3       = this.rest.mul(rhs);
      return new CR( firstComp , rc1.add(rc2).add(rc3) , mergePosition(this.position,rhs.position));
    } else {
      unexpected(rhs);
    }
  }

  negate() {
    return this.mul( new Constant(-1,this.position) );
  }

  toString() {
    let buf = [];
    this._toString(buf);
    return "(" + buf.join(",+,") + ")";
  }

  isCR      () { return true; }
  isConstant() { return false; }

  _toString(buf) {
    this.first._toString(buf);
    this.rest._toString (buf);
  }

  // helper function to flatten the CR into a list of integers
  _flatten(output) {
    this.first._flatten(output);
    this.rest._flatten (output);
  }

  flatten() {
    let output = [];
    this._flatten(output);
    return output;
  }
};

class Constant {
  constructor( value, pos ) {
    this.position   = pos;
    this.value = value;
  };

  // operator evaluation
  add(rhs) {
    if( rhs instanceof Constant ) {
      return new Constant( this.value + rhs.value , mergePosition(this.position,rhs.position) );
    } else if( rhs instanceof CR ) {
      return new CR( this.add(rhs.first) , rhs.rest ,
                                           mergePosition(this.position,rhs.position) );
    } else {
      unexpected(rhs);
    }
  }

  sub(rhs) {
    if( rhs instanceof Constant ) {
      return this.add( rhs.negate() );
    } else if( rhs instanceof CR ) {
      return new CR( this.sub(rhs.first), rhs.rest ,
                                          mergePosition(this.position,rhs.position) );
    } else {
      unexpected(rhs);
    }
  }

  mul(rhs) {
    if( rhs instanceof Constant ) {
      return new Constant( this.value * rhs.value , mergePosition(this.position,rhs.position) );
    } else if( rhs instanceof CR ) {
      return new CR( this.mul(rhs.first) , this.mul(rhs.rest) ,
                                           mergePosition(this.position, rhs.position));
    } else {
      unexpected(rhs);
    }
  }

  negate() {
    return new Constant( -this.value, this.position );
  }

  toString() {
    return util.format("%d",this.value);
  }

  isCR      () { return false; }
  isConstant() { return true; }

  _toString(buf) {
    buf.push(this.toString());
  }

  _flatten(output) { output.push(this.value); }
};

// Builder takes AST as input and produce only CR/recursively nested CR.
class Eval {
  constructor() {
    this.vmap = {};
    this.output = null;
  }

  _buildBinary(bin) {
    let lhs = this._buildExpr(bin.lhs);
    let rhs = this._buildExpr(bin.rhs);

    switch(bin.op) {
      case ast.Operator.opAdd: return lhs.add(rhs);
      case ast.Operator.opSub: return lhs.sub(rhs);
      case ast.Operator.opMul: return lhs.mul(rhs);
      default: return null;
    }
  }

  _buildNegate(neg) {
    let opr = this._buildExpr(bin.neg);
    return opr.negate();
  }

  _buildInteger(n) {
    return new Constant(n.value,n.position);
  }

  _buildVariable(n) {
    if(n.name in this.vmap) {
      return this.vmap[n.name];
    }
    throw util.format("variable %s doesn't exist",n.name);
  }

  _buildAddRecurrence(n) {
    let first = this._buildExpr(n.start);
    let second= this._buildExpr(n.stride);
    return new CR( first, second, n.position );
  }

  _buildExpr( expr ) {
    if(expr instanceof ast.Binary)    return this._buildBinary(expr);
    if(expr instanceof ast.Negate)    return this._buildNegate(expr);
    if(expr instanceof ast.Integer)   return this._buildInteger(expr);
    if(expr instanceof ast.Variable)  return this._buildVariable(expr);
    if(expr instanceof ast.AddRecurrence) return this._buildAddRecurrence(expr);
    throw util.format("parser error ?? unexpected expression ast node %s",expr.constructor.name);
  }

  _buildVar(node) {
    this.vmap[node.lhs.name] = this._buildExpr(node.rhs);
  }

  _buildOutput(node) {
    this.output = [];
    for( const x of node.tuple ) {
      this.output.push( this._buildExpr(x) );
    }
  }

  build(prg) {
    for( const x of prg.statement ) {
      if(x instanceof ast.Var ) {
        this._buildVar(x);
      } else if(x instanceof ast.Output) {
        this._buildOutput(x);
      } else {
        throw util.format("parser error ?? unexpected statement ast node %s",x.constructor.name);
      }
    }
  }
};

module.exports = function(node) {
  let b = new Eval();
  b.build(node);
  return b.output;
};

