'use strict';

function loadTemplate() {
  $.get("assets/html/templateHeader.html", function(htmlData) {
    $('#templateHeader').html(htmlData);
  }, "html");

  $.get("assets/html/templateFooter.html", function(htmlData) {
    $('#templateFooter').html(htmlData);
  }, "html");
}

function injectBlockly(readyCallback) {
  var blocklyArea = document.getElementById('blocklyArea');
  var blocklyDiv = document.getElementById('blocklyDiv');
  var options = {
//    toolbox : document.getElementById('toolbox'),
    toolbox: getToolbox(), 
    collapse : true,
    comments : true,
    disable : true,
    maxBlocks : Infinity,
    trashcan : true,
    horizontalLayout : false,
    toolboxPosition : 'start',
    css : true,
    media : '/blockly/media/',
    rtl : false,
    scrollbars : true,
    sounds : true,
    oneBasedIndex : true
  };
  workspace = Blockly.inject(blocklyDiv, options);

  // Dinamically loads custom blocks
//  $.getScript("/assets/js/loadBlocks.js", function() {
//      workspace.newBlock('event_received');
    if(readyCallback) readyCallback();
//  });

  var onresize = function(e) {
    // Compute the absolute coordinates and dimensions of blocklyArea.
    var element = blocklyArea;
    var x = 0;
    var y = 0;
    do {
      x += element.offsetLeft;
      y += element.offsetTop;
      element = element.offsetParent;
    } while (element);
    // Position blocklyDiv over blocklyArea.
    blocklyDiv.style.left = x + 'px';
    blocklyDiv.style.top = y + 'px';
    blocklyDiv.style.width = blocklyArea.offsetWidth + 'px';
    blocklyDiv.style.height = blocklyArea.offsetHeight + 'px';
    Blockly.svgResize(workspace);
  };
  window.addEventListener('resize', onresize, false);
  onresize();
  Blockly.svgResize(workspace);
}

function loadToolbox(callback) {
  $.get("assets/xml/toolboxBase.xml", function(xmlData) {
    $('#toolboxContainer').html(xmlData);
    injectBlockly(callback);
  }, "html");
}
