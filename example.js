var assert = require("assert");
var util   = require("util");
var cr     = require("./cr.js");

function dump(xx) {
  console.log(util.inspect(xx,{colors:true,depth:10000}));
}

function example() {
  let output = cr(`
    var i = {0,+,1}
    output [ 7 * i*i + i + 1 ,
             8 * i * i * i * i + i * i * i + i * 17 + 9 ]
    `);

  console.log("-----------Chain of Recurrences---------------");
  for(const x of output) {
    console.log(x.toString());
  }
  console.log("----------------------------------------------");
}

example();
