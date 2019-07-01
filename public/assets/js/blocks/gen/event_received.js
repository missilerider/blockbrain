Blockly.JavaScript['event_received'] = function(block) {
  var variable_var = Blockly.JavaScript.variableDB_.getName(block.getFieldValue('VAR'), Blockly.Variables.NAME_TYPE);
  var code = variable_var + ' = inputData;\n';
  return code;
};
