var assert = require("assert");
var util   = require("util");
var cr     = require("./cr.js");
var cg     = require("./codegen.js");

function dump(xx) {
  console.log(util.inspect(xx,{colors:true,depth:10000}));
}

function example() {
  let output = cr(`
    var i = {0,+,10}
    output [ i*i*7 + i + 17771 ]
    `);

  console.log("-----------Chain of Recurrences---------------");
  for(const x of output) {
    console.log(x.toString());
  }
  console.log("----------------------------------------------");

  console.log("-----------Code Generation -------------------");
  let cgo = cg(output);
  for(const x of cgo) {
    console.log("----------------------------------------------");
    console.log(x);
    console.log("----------------------------------------------");
  }
  console.log("----------------------------------------------");

}

example();
