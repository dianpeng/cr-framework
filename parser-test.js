var parse = require("./parser.js");
var assert= require("assert");
var util  = require("util");



var result= parse(`
  var x = 10
  var y = 20
  var z = 30 + y
  var br = {1,+,-y}

  output [x * x + y + z]
  `);

if(result.isParseFailed()) {
  console.log(result.msg);
}

function dump(xx) {
  console.log(util.inspect(xx,{colors:true,depth:10000}));
}

assert(!result.isParseFailed());
dump(result.node)
