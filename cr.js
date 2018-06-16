var parser = require("./parser.js");
var eval   = require("./eval.js");
var util   = require("util");

module.exports = function(script) {
  let result = parser(script);
  if(result.isParseFailed()) {
    throw util.format("Cannot parse script due to error : %s",result.msg);
  }

  let output = eval(result.node);
  return output;
};
