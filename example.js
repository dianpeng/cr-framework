var assert = require("assert");
var util   = require("util");
var cr     = require("./cr.js");
var cg     = require("./codegen.js");

function dump(xx) {
  console.log(util.inspect(xx,{colors:true,depth:10000}));
}

function example() {
  let output = cr(`
    var i = {0,+,1}
    var h = 2 * 7 + 1 + 3 * 5 -14
    output [ 7 * i*i + i + 1 ,
             17781 * i * i * i * i + i * i * i + i * 17 + 9 ,
             h ]
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
