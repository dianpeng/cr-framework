var util = require("util");

function cg(cr) {
  if(cr.isConstant()) {
    return util.format("function(n) { return %d; }",cr.value);
  } else {
    let buf = [];
    buf.push("function(n) {");

    let clist = cr.flatten(); // get all the coefficient

    // populate all the variables
    let idx = 0;
    for( const x of clist ) {
      buf.push(util.format("  var c%d = %d;",idx,x));
      ++idx;
    }
    buf.push("  let output = [];");

    // populate the loop
    buf.push("  for(let i = 0 ; i < n ; ++i) {");
    buf.push("     output.push(c0);");
    // populate the updates
    for( let i = 0 ; i < clist.length - 1; ++i ) {
      buf.push(util.format("    c%d += c%d;",i,i+1));
    }
    buf.push("  }");
    buf.push("  return output;");
    buf.push("}");
    return buf.join("\n");
  }
}

module.exports = function(prg) {
  let r = [];
  for( const x of prg) {
    r.push(cg(x));
  }
  return r;
}
