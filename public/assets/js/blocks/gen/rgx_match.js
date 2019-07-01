Blockly.JavaScript['rgx_match'] = function(block) {
  var text_regex = block.getFieldValue('REGEX');
  var value_text = Blockly.JavaScript.valueToCode(block, 'TEXT', Blockly.JavaScript.ORDER_ATOMIC);
  var variable_results = Blockly.JavaScript.variableDB_.getName(block.getFieldValue('RESULTS'), Blockly.Variables.NAME_TYPE);
  var statements_fn_body = Blockly.JavaScript.statementToCode(block, 'FN_BODY');
  var code = `
  var matches;
  try {
    var RGX2 = String(` + text_regex + `).match(/(\/(.*)\/([ig]*)|.+)/);
    if(RGX2[2] === undefined)
      RGX3 = new RegExp(` + text_regex + `);
    else
      RGX3 = new RegExp(RGX2[2], RGX2[3]);
    if(matches = String(` + value_text + `).match(RGX3)) {
      matches.forEach((m) => {
        ` + variable_results + `.push(m);
      });
` + statements_fn_body + `
    }
  } catch(e) {}
`;
  return code;
};
