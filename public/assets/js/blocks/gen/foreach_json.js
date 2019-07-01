Blockly.JavaScript['foreach_json'] = function(block) {
  var variable_prop = Blockly.JavaScript.variableDB_.getName(block.getFieldValue('PROP'), Blockly.Variables.NAME_TYPE);
  var variable_value = Blockly.JavaScript.variableDB_.getName(block.getFieldValue('VALUE'), Blockly.Variables.NAME_TYPE);
  var variable_obj = Blockly.JavaScript.variableDB_.getName(block.getFieldValue('OBJ'), Blockly.Variables.NAME_TYPE);
  var statements_innercode = Blockly.JavaScript.statementToCode(block, 'INNERCODE');
  // TODO: Assemble JavaScript into code variable.
  var code = 'Object.keys(' + variable_obj + ').forEach(function (objdata) {\n';
  code += variable_prop + ' = objdata;\n';
  code += variable_value + ' = ' + variable_obj + '[objdata];\n';
  code += statements_innercode + '\n';
  code += '});\n';
  return code;
};
