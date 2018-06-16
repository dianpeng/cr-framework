// Javascript lexer for CR-Framework

class Token {
  static get tkAdd() { return 1; }
  static get tkSub() { return 2; }
  static get tkMul() { return 3; }

  static get tkLPar() { return 11; }
  static get tkRPar() { return 12; }
  static get tkLBra() { return 13; }
  static get tkRBra() { return 14; }
  static get tkSemicolon() { return 15; }
  static get tkComma    () { return 16; }
  static get tkAssign   () { return 17; }
  static get tkLSqr     () { return 18; }
  static get tkRSqr     () { return 19; }

  static get tkVar()    { return 21; }
  static get tkOutput() { return 22; }
  static get tkUtil  () { return 23; }

  static get tkNumber  () { return 26; }
  static get tkVariable() { return 27; }

  static get tkEof  () { return 31; }
  static get tkError() { return 32; }

  static getTokenName( tk ) {
    switch(tk) {
      case Token.tkAdd : return "+";
      case Token.tkSub : return "-";
      case Token.tkMul : return "*";
      case Token.tkLPar: return "(";
      case Token.tkRPar: return ")";
      case Token.tkLBra: return "{";
      case Token.tkRBra: return "}";
      case Token.tkLSqr: return "[";
      case Token.tkRSqr: return "]";
      case Token.tkSemicolon: return ";";
      case Token.tkComma    : return ",";
      case Token.tkAssign   : return "=";
      case Token.tkVar      : return "var";
      case Token.tkOutput   : return "output";
      case Token.tkUtil     : return "util";
      case Token.tkNumber   : return "<number>";
      case Token.tkVariable : return "<variable>";
      case Token.tkEof      : return "<eof>";
      case Token.tkError    : return "<error>";
      default: return null;
    }
  }
};

class Lexeme {
  constructor() {
    this.token = Token.tkError;
    this.text  = "";
    this.number= 0;
    this.length= 0;
  }

  getTokenName() { return Token.getTokenName(this.token); }
};

class Tokenizer {
  constructor( src ) {
    this.pos    = 0;
    this.src    = src;
    this.lexeme = new Lexeme();

    this.posCount= 1;
    this.posLine = 1;
  }

  get lexemePos() {
    return this.pos - this.lexeme.length;
  }

  _yield( tk , len , offset ) {
    this.lexeme.token = tk;
    this.lexeme.length= len;
    this.pos += offset;
    this.posCount += offset;
    return this.lexeme;
  }

  _lexComment() {
    let idx = this.src.indexOf("\n",this.pos);
    if( idx == -1 ) {
      this.posCount += (idx - this.pos);
      this.pos = this.src.length;
    } else {
      this.pos = idx + 1;
      this.posCount = 1;
      this.posLine++;
    }
  }

  _isDigit(c) {
    return c >= "0" && c <= "9";
  }

  _isAlpha(c) {
    return (c >= "a" && c <= "z") || (c >= "A" && c <= "Z");
  }

  _isRestIdChar(pos) {
    if(pos < this.src.length) {
      let c = this.src.charAt(pos);
      if(this._isDigit(c) || this._isAlpha(c) || c == "_")
        return true;
    }
    return false;
  }

  _lexNumber(lh) {
    let start = this.pos;
    this.pos++;

    // find the last digit
    do {
      let c = this.src.charAt(this.pos);
      if(!this._isDigit(c)) break;
      ++this.pos;
    } while(true);

    let diff = (this.pos - start);

    this.lexeme.number = parseInt(this.src.substr(start,diff));
    this.lexeme.token  = Token.tkNumber;
    this.lexeme.length = diff;
    this.posCount     += diff;
    return this.lexeme;
  }

  _lexVar(c) {
    if(c == "v" && (this.pos + 2 < this.src.length) &&
                    this.src.charAt(this.pos+1) == "a" &&
                    this.src.charAt(this.pos+2) == "r" &&
                    !this._isRestIdChar(this.pos+3)) {
      return this._yield(Token.tkVar,3,3);
    } else if(c == "o" && (this.pos + 5 < this.src.length) &&
                           this.src.charAt(this.pos+1) == "u" &&
                           this.src.charAt(this.pos+2) == "t" &&
                           this.src.charAt(this.pos+3) == "p" &&
                           this.src.charAt(this.pos+4) == "u" &&
                           this.src.charAt(this.pos+5) == "t" &&
                           !this._isRestIdChar(this.pos+6)) {
      return this._yield(Token.tkOutput,6,6);
    } else if(c == "u" && (this.pos + 4 < this.src.length) &&
                           this.src.charAt(this.pos+1) == "n" &&
                           this.src.charAt(this.pos+2) == "t" &&
                           this.src.charAt(this.pos+3) == "i" &&
                           this.src.charAt(this.pos+4) == "l" &&
                           !this._isRestIdChar(this.pos+5)) {
      return this._yield(Token.tkUntil,5,5);
    } else if(this._isAlpha(c) || c == "_") {
      let start = this.pos; ++this.pos;
      while(this._isRestIdChar(this.pos))
        ++this.pos;
      this.lexeme.text   = this.src.substr(start,(this.pos-start));
      this.lexeme.token  = Token.tkVariable;
      this.lexeme.length = this.pos - start;
      this.posCount     += this.pos - start;

      return this.lexeme;
    } else {
      this.lexeme.text = "unrecognized token";
      return this._yield(Token.tkError,0,0);
    }
  }

  // peek the next token from stream
  next() {
    while(this.pos < this.src.length) {
      let c = this.src.charAt(this.pos);
      switch(c) {
        case " ": case "\r": case "\b": case "\t":
          ++this.pos;
          ++this.posCount;
          break;
        case "\n":
          ++this.pos;
          ++this.posLine;
          this.posCount = 1;
          break;
        case "#":
          this._lexComment(); break;
        case "=": return this._yield(Token.tkAssign,1,1);
        case "+": return this._yield(Token.tkAdd,1,1);
        case "-": return this._yield(Token.tkSub,1,1);
        case "*": return this._yield(Token.tkMul,1,1);
        case "(": return this._yield(Token.tkLPar,1,1);
        case ")": return this._yield(Token.tkRPar,1,1);
        case "{": return this._yield(Token.tkLBra,1,1);
        case "}": return this._yield(Token.tkRBra,1,1);
        case "[": return this._yield(Token.tkLSqr,1,1);
        case "]": return this._yield(Token.tkRSqr,1,1);
        case ";": return this._yield(Token.tkSemicolon,1,1);
        case ",": return this._yield(Token.tkComma,1,1);
        case "0": case "1": case "2": case "3": case "4":
        case "5": case "6": case "7": case "8": case "9":
          return this._lexNumber(c);
        default:
          return this._lexVar(c);
      }
    }

    return this._yield(Token.tkEof,0,0);
  }
};

module.exports = {
  "Token" : Token ,
  "Lexeme": Lexeme,
  "Tokenizer": Tokenizer
};
