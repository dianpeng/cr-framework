// Parsing the input test into *Ast*
var lexer = require("./lexer.js");
var ast   = require("./ast.js"  );
var util  = require("util");

class Parser {
  constructor( source ) {
    this.tokenizer = new lexer.Tokenizer(source);
    this.error     = "";
  }

  // move the intenral tokenizer to next token and returns
  // a position object to represent the parsed range for error
  // diagnostic information
  _move() {
    let start = this.tokenizer.lexemePos;
    this.tokenizer.next();
    return new ast.Position(this.tokenizer.src,start,this.tokenizer.lexemePos);
  }

  _moveAndNewPosition(start) {
    this.tokenizer.next();
    return new ast.Position(this.tokenizer.src,start,this.tokenizer.lexemePos);
  }

  _newPosition(start,end) {
    return new ast.Position(this.tokenizer.src,start,end);
  }

  _moveAndExpect(tk) {
    let t = this.tokenizer.next();
    if(t.token == tk) return true;
    else {
      this._error(util.format("expect a token %s",lexer.Token.getTokenName(tk)));
      return false;
    }
  }

  _expect(tk) {
    if(this.tokenizer.lexeme.token != tk) {
      this._error(util.format("expect a token %s",lexer.Token.getTokenName(tk)));
      return false;
    }
    return true;
  }

  // expression level parsing --------------------------------------------
  _parseVariable() {
    let value = this.tokenizer.lexeme.text;
    return new ast.Variable(value,this._move());
  }

  _error(msg) {
    this.error = msg;
    return null;
  }

  _parseBasicRecurrence() {
    let posStart = this.tokenizer.lexemePos;

    let tk = this.tokenizer.next();
    let start = null;
    let end   = null;

    // start of the basic recurrenses
    if(tk.token == lexer.Token.tkNumber) {
      start = new ast.Integer(tk.number,this._move());
    } else {
      start = this._parseExpr();
      if(start == null) return null;
    }

    if(!this._expect(lexer.Token.tkComma)) return null;
    tk = this.tokenizer.next();

    // operator
    if(tk.token != lexer.Token.tkAdd) {
      return this._error("only basic *add* recurrence is supported");
    }

    if(!this._moveAndExpect(lexer.Token.tkComma)) return null;
    tk = this.tokenizer.next();

    // stride of the basic recurrenses
    if(tk.token == lexer.Token.tkNumber) {
      end = new ast.Integer(tk.number,this._move());
    } else {
      end = this._parseExpr();
      if(end == null) return null;
    }

    if(!this._expect(lexer.Token.tkRBra)) return null;

    return new ast.AddRecurrence(start,end,this._moveAndNewPosition(posStart));
  }

  _parsePrimary() {
    switch(this.tokenizer.lexeme.token) {
      case lexer.Token.tkNumber:
        let value = this.tokenizer.lexeme.number;
        return new ast.Integer(value,this._move());
      case lexer.Token.tkVariable:
        return this._parseVariable();
      case lexer.Token.tkLBra:
        return this._parseBasicRecurrence();
      case lexer.Token.tkLPar:
        this.tokenizer.next();
        let x = this._parseExpr();
        if(x == null) return x;
        if(this.tokenizer.lexeme.token != lexer.Token.tkRPar) {
          return this._error("expect \")\" to close a sub expression");
        }
        this.tokenizer.next();
        return x;
      default:
        return this._error("expect primary expression, eg integer/variable/basic recurrences");
    }
  }

  _parseNegate() {
    if(this.tokenizer.lexeme.token == lexer.Token.tkSub) {
      let posStart = this.tokenizer.lexemePos;
      this.tokenizer.next();
      let opr      = this._parsePrimary();
      if(opr == null) return null;
      return new ast.Negate(opr,this._newPosition(posStart,this.tokenizer.lexemePos));
    }
    return this._parsePrimary();
  }

  _getOpPrecedence(tk) {
    if(tk == lexer.Token.tkAdd || tk == lexer.Token.tkSub) return 2;
    if(tk == lexer.Token.tkMul) return 1;
    return 0;
  }

  _getMaxOpPrecedence() { return 2; }

  _mapTokenToOp(tk) {
    switch(tk) {
      case lexer.Token.tkAdd: return ast.Operator.opAdd;
      case lexer.Token.tkSub: return ast.Operator.opSub;
      case lexer.Token.tkMul: return ast.Operator.opMul;
      default: // unreachable
        return null;
    }
  }

  _isBinaryOp(tk) {
    if(tk == lexer.Token.tkAdd || tk == lexer.Token.tkSub || tk == lexer.Token.tkMul)
      return true;
    return false;
  }

  _parseTerm  ( precedence ) {
    if(precedence == 0) {
      return this._parseNegate();
    } else {
      let posStart = this.tokenizer.lexemePos;
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
          opr = new ast.Binary(opr,rhs,this._mapTokenToOp(op),this._newPosition(posStart,this.tokenizer.lexemePos));
        } else {
          // let the caller handle this case since the caller must know it
          break;
        }
      } while(true);

      return opr;
    }
  }

  _parseExpr() {
    return this._parseTerm(this._getMaxOpPrecedence());
  }

  // statement wise parsing ------------------------------------------
  _parseVar() {
    let posStart = this.tokenizer.lexemePos;

    // assume we have a tkVar here
    let tk = this.tokenizer.next();
    if(tk.token != lexer.Token.tkVariable) {
      return this._error("var statement must follow a variable name after keyword \"var\"");
    }
    let v  = this._parseVariable();

    if(this.tokenizer.lexeme.token != lexer.Token.tkAssign)
      return this._error("expect \"=\" in var statement");
    this.tokenizer.next();

    let exp= this._parseExpr();
    if(exp == null) return null;

    return new ast.Var(v,exp,this._newPosition(posStart,this.tokenizer.lexemePos));
  }

  // output [ expr1 , expr2 , expr3 , expr4 ]
  _parseOutput() {
    let posStart = this.tokenizer.lexemePos;

    if(!this._moveAndExpect(lexer.Token.tkLSqr)) return null;
    let tk = this.tokenizer.next();
    if(tk.token == lexer.Token.tkRSqr) {
      return new ast.Output(this._moveAndNewPosition(posStart),[]);
    } else {
      let tuple = [];
      do {
        let exp = this._parseExpr();
        if(exp == null) return null;
        tuple.push(exp);

        let delimitor = this.tokenizer.lexeme.token;
        if(delimitor == lexer.Token.tkComma) {
          this.tokenizer.next();
        } else if(delimitor == lexer.Token.tkRSqr) {
          this.tokenizer.next();
          break;
        } else {
          return this._error("unrecognized delimitor, expect \",\" or \"]\" in output list literal");
        }
      } while(true);

      return new ast.Output(this._newPosition(posStart,this.tokenizer.lexemePos),tuple);
    }
  }

  // main function
  parse() {
    this.tokenizer.next(); // first token
    let stmt = [];

    do {
      if(this.tokenizer.lexeme.token == lexer.Token.tkVar) {
        let v = this._parseVar();
        if(v == null) return v;
        stmt.push(v);
      } else if(this.tokenizer.lexeme.token == lexer.Token.tkOutput) {
        let v = this._parseOutput();
        if(v == null) return v;
        stmt.push(v);

        // check dangling statement after the output
        if(this.tokenizer.lexeme.token != lexer.Token.tkEof) {
          return this._error("dangling statement after the output statements, output statements " +
                             "should be the last statement in source");
        }
        break;
      } else if(this.tokenizer.lexeme.token == lexer.Token.tkEof) {
        break;
      } else {
        return this._error("unrecognized token/statement here, expect \"var\" or \"output\"");
      }
    } while(true);
    return new ast.Program( this._newPosition(0,this.tokenizer.pos), stmt);
  }
};

class ParserResult {
  constructor( node , msg ) {
    this.node = node;
    this.msg  = msg ;
  }

  isParseFailed() { return this.node == null; }
};

module.exports = function(source) {
  let p = new Parser(source);
  return new ParserResult(p.parse(),p.error);
};
