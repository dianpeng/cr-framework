var tk = require("./lexer.js");
var Tokenizer = tk.Tokenizer;
var Token     = tk.Token;
var Lexeme    = tk.Lexeme;

function _testOp() {
  let assert    = require("assert");
  let tokenizer = new Tokenizer("+ - * / ^ ; , () {} 12311 xxx\n" +
                                "#xxxx\n" +
                                "= []");
  let result    = [ Token.tkAdd, Token.tkSub, Token.tkMul, Token.tkDiv,
                    Token.tkPow, Token.tkSemicolon, Token.tkComma,
                    Token.tkLPar,Token.tkRPar, Token.tkLBra, Token.tkRBra,
                    Token.tkNumber, Token.tkVariable , Token.tkAssign ,
                    Token.tkLSqr , Token.tkRSqr, Token.tkEof ];

  for ( const t of result ) {
    assert(tokenizer.next().token == t);
  }
}

function _testKW() {
  let assert = require("assert");
  let tokenizer = new Tokenizer("var output");
  let result = [ Token.tkVar , Token.tkOutput , Token.tkEof ];
  for( const t of result ) {
    assert(tokenizer.next().token == t,Token.getTokenName(tokenizer.lexeme.token));
  }
}

_testKW();
