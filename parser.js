// Parsing the input test into *Ast*
var lexer = require("./lexer.js");
var ast   = require("./ast.js"  );

class Parser {
  constructor( source ) {
    this.tokenizer = new lexer.Tokenizer(source);
    this.error     = null;
  }

  parse() {}

  // move the intenral tokenizer to next token and returns
  // a position object to represent the parsed range for error
  // diagnostic information
  _move() {
    let start = this.tokenizer.pos;
    this.tokenizer.next();
    return new ast.Position(this.tokenizer.src,start,this.tokenizer.pos);
  }

  _moveAndNewPosition(start) {
    this.tokenizer.next();
    return new ast.Position(this.tokenizer.src,start,this.tokenizer.pos);
  }

  _newPosition(start,end) {
    return new ast.Position(this.tokenizer.src,start,end);
  }

  // private method for performing actual parsing operations
  _moveAndExpect(tk) {
    let tk = this.tokenizer.next();
    if(tk.token == tk) return true;
    else {
      this._error("expect a token %s",lexer.Token.getTokenName(tk));
      return false;
    }
  }

  _expect(tk) {
    if(this.tokenizer.lexeme.token != tk) {
      this._error("expect a token %s",lexer.Token.getTokenName(tk));
      return false;
    }
    return true;
  }

  _parseBasicRecurrences() {
    let posStart = this.tokenizer.pos;

    let tk = this.tokenizer.next();
    let start = null;
    let end   = null;
    let add   = false;

    // start of the basic recurrenses
    if(tk.token == lexer.Token.tkNumber) {
      start = tk.number;
    } else if(tk.token == lexer.Token.tkVariable) {
      start = _parsePrimary();
    } else {
      return this._error("start component in basic reccurenses requires a integer or a varaible");
    }

    if(!this._moveAndExpect(lexer.Token.tkComma)) return null;
    tk = this.tokenizer.next();

    // operator
    if(tk.token == lexer.Token.tkAdd) {
      add = true;
    } else if(tk.token == lexer.Token.tkMul) {
      add = false;
    } else {
      return this._error("basic recurrenses operator can only accept + or *,please normalize it");
    }

    if(!this._moveAndExpect(lexer.Token.tkComma)) return null;
    tk = this.tokenizer.next();

    // stride of the basic recurrenses
    if(tk.token == lexer.Token.tkNumber) {
      end = tk.number;
    } else if(tk.token == lexer.Token.tkVariable) {
      end = _parsePrimary();
    } else {
      return this._error("stride component in basic recurrenses requires a integer or a variable");
    }

    if(!this._moveAndExpect(lexer.Token.tkRBra)) return null;

    if(add) {
      return new ast.AddRecurrences(start,end,this._moveAndNewPosition(posStart));
    } else {
      return new ast.MulRecurrences(start,end,this._moveAndNewPosition(posStart));
    }
  }

  _parsePrimary() {
    switch(this.tokenizer.lexeme.token) {
      case lexer.Token.tkNumber:
        let value = this.tokenizer.lexeme.number;
        return new ast.Integer(value,this._move());
      case lexer.Token.tkVariable:
        let value = this.tokenizer.lexeme.text;
        return new ast.Variable(value,this._move());
      case lexer.Token.tkLBra:
        return this._parseBasicRecurrences();
      default:
        return this._error("expect primary expression, eg integer/variable/basic recurrences");
    }
  }

  _parseNegate() {
    if(this.tokenizer.lexeme.token == lexer.Token.tkSub) {
      let posStart = this.tokenizer.pos;
      let opr      = this._parsePrimary();
      if(opr == null) return null;
      return new ast.Negate(opr,this._newPosition(start,this.tokenizer.pos));
    }
    return this._parsePrimary();
  }

  _getOpPrecedence(tk) {
    if(tk == lexer.Token.tkAdd || tk == lexer.Token.tkSub) return 3;
    if(tk == lexer.Token.tkMul || tk == lexer.Token.tkDiv) return 2;
    if(tk == lexer.Token.tkPow) return 1;
    return 0;
  }

  _getMaxOpPrecedence() { return 3; }

  _mapTokenToOp(tk) {
    switch(tk) {
      case lexer.Token.tkAdd: return ast.Operator.opAdd;
      case lexer.Token.tkSub: return ast.Operator.opSub;
      case lexer.Token.tkMul: return ast.Operator.opMul;
      case lexer.Token.tkDiv: return ast.Operator.opDiv;
      case lexer.Token.tkPow: return ast.Operator.opPow;
      default: // unreachable
        return null;
    }
  }

  _isBinaryOp(tk) {
    if(tk == lexer.Token.tkAdd || tk == lexer.Token.tkSub ||
       tk == lexer.Token.tkMul || tk == lexer.Token.tkDiv ||
       tk == lexer.Token.tkPow)
      return true;
    return false;
  }

  _parseTerm  ( precedence ) {
    if(precedence == 0) {
      return this._parseNegate();
    } else {
      let posStart = this.tokenizer.pos;
      // get the lhs operand with smaller precendence, climbing down
      let opr = this._parseTerm(precedence-1);
      if(opr == null) return null;

      do {
        let op = this.tokenizer.lexeme.token;
        if(!this._isBinaryOp(op)) break;

        let p  = this._getOpPrecedence(op);
        if(p == precedence) {
          // current operator precedence is expected, build the expression tree
          this.tokenizer.next();
          let rhs = this._parseTerm(precedence-1);
          if(rhs == null) return null;
          opr = new ast.Binary(opr,rhs,this._mapTokenToOp(op),this._newPosition(posStart,this.tokenizer.pos));
        } else {
          // let the caller handle this case since the caller must know it
          break;
        }
      } while(true);

      return opr;
    }
  }

  _parseBinary() {
    return this._parseTerm(this._getMaxOpPrecedence());
  }
};
