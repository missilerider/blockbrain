Blockly.Extensions.registerMutator('control_obj_builder',
  {
    decompose: function(workspace) {
      var topBlock = workspace.newBlock('obj_builder_decom');
      topBlock.initSvg();
      return topBlock;
    },
    compose: function(topBlock) {
      var blocks = [];
      //console.log(topBlock);
      var b = topBlock.childBlocks_[0];
      while(b) {
        blocks.push(b.id);
        b = b.childBlocks_[0];
      }
      //console.log(this);
      //var numProps = this.getFieldValue('NUMPROPS');
      //numProps = this.getField;
      //console.log(numProps);

    },
    domToMutation: function(xmlElement) {
    },
    mutationToDom: function() {
    }
  }, function() {
    var addProp = function(parent, n) {
      this.appendValueInput("VALUE")
        .setCheck(null)
        .appendField(new Blockly.FieldTextInput("default"), "PROP" + n)
        .appendField(":");
    }

    if(this.childBlocks_.length > 0) {
      addProp(this.childBlocks_[0], 1);
      topBlock.initSvg();
    }
//    console.log(this);
//    this.setMutator(new BuilderMutator());
  },
  // This last argument configures the editor UI on web
  ['obj_builder_property']);

Blockly.JavaScript['obj_builder'] = function(block) {
  var text_name = block.getFieldValue('NAME');
  var value_value = Blockly.JavaScript.valueToCode(block, 'PROP', Blockly.JavaScript.ORDER_ATOMIC);
  // TODO: Assemble JavaScript into code variable.
  var code = '...';
  // TODO: Change ORDER_NONE to the correct strength.
  return [code, Blockly.JavaScript.ORDER_NONE];
};
