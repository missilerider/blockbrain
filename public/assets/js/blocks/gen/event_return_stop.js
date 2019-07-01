Blockly.JavaScript['event_return_stop'] = function(block) {
  var value_var = Blockly.JavaScript.valueToCode(block, 'VAR', Blockly.JavaScript.ORDER_ATOMIC);
  var code = 'return ' + value_var + ';\n';
  return code;
};
