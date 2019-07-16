var workspace;
var id = "";

$(function() {
  var url = new URL(window.location.href);
  id = url.searchParams.get("id");

  loadTemplate();
  loadToolbox(function() {
//    Blockly.Variables.getOrCreateVariablePackage(workspace, null, 'msg', 'json');
    Blockly.
    createCustomBlockly();

    apiGetScript(id, function(xml) {
      var s = new XMLSerializer();
      var newXmlStr = s.serializeToString(xml);
      var bxml = Blockly.Xml.textToDom(newXmlStr);
      Blockly.Xml.domToWorkspace(bxml, workspace);
    });
  });

  $('#editorSave').click(editorSave);
  $('#editorRevert').click(editorRevert);
});

function editorSave() {
  var xml = Blockly.Xml.workspaceToDom(workspace);
  var xmltxt = Blockly.Xml.domToText(xml);

	//Blockly.JavaScript.addReservedWords('Generated_Code_Output___');
	//var Generated_Code_Output___ = Blockly.JavaScript.workspaceToCode(workspace);
  apiSaveScript(id, xmltxt, "");
};

function editorRevert() {
  alert("revert! " + id);
};
