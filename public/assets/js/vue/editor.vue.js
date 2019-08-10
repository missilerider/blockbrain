var app = new Vue({
  el: '#app',
  data: {
    message: 'Hello Vue!',
    revertedBlocks: null,
    services: {},
    blockId: null,
    workspace: null,
    blocklyArea: null,
    blocklyDiv: null,
    options: null,
    toolboxName: "default",
    toolboxNames: toolboxes,
    selectedBlockId: null,
    canUndo: false,
    canRedo: false,
    undone: 0
  },
  mounted() {
    // Prepare elements
    //$('.btn-tooltip').tooltip();

    var url = new URL(window.location.href);
    this.blockId = url.searchParams.get("id");

    var that = this;

//    this.loadToolbox(function() {
    this.injectBlockly(function() {
      //Blockly.Variables.predefinedVars.push("msg");
  //    Blockly.Variables.getOrCreateVariablePackage(workspace, null, 'msg', 'json');

      createCustomBlockly(); // From serverDyn

      that.loadBlock(this.blockId);

      // Dirty solution for toolbox z-index
      $('.blocklyToolboxDiv').css("zIndex", 1);
    });
  },
  methods: {
    showNotification: function(msg, type, icon, timeout) {
      $.notify({
        icon: icon, // material
        message: msg

      }, {
        type: type, // ['', 'info', 'danger', 'success', 'warning', 'rose', 'primary'];
        timer: timeout, // ms
        placement: {
          from: 'top',
          align: 'right'
        }
      });
    },
    loadBlock: function(id) {
      var that = this;
      axios.get('/api/v1/blocks/' + that.blockId, {
      })
      .then(function(resp) {
        if(resp.headers["content-type"].includes("application/xml")) {
          var s = new XMLSerializer();
          var bxml = Blockly.Xml.textToDom(resp.data);
          Blockly.Xml.domToWorkspace(bxml, that.workspace);
          that.revertedBlocks = bxml;
        } else {
          console.error("Bad response from API server: " + resp.body);
        }
      });
    },
    injectBlockly: function(readyCallback) {
      this.blocklyArea = document.getElementById('blocklyArea');
      this.blocklyDiv = document.getElementById('blocklyDiv');
      this.options = {
        toolbox: getToolbox(this.toolboxName),
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
      this.workspace = Blockly.inject(this.blocklyDiv, this.options);

      this.workspace.addChangeListener(this.blocklyEvent);

      if(readyCallback) readyCallback();

      window.addEventListener('resize', this.onresize, false);
      this.onresize();
      Blockly.svgResize(this.workspace);
    },
    loadToolbox: function(callback) {
      var that = this;
      $.get("assets/xml/toolboxBase.xml", function(xmlData) {
        $('#toolboxContainer').html(xmlData);
        that.injectBlockly(callback);
      }, "html");
    },
    onresize: function(e) {
      // Compute the absolute coordinates and dimensions of blocklyArea.
      var element = this.blocklyArea;
      var x = 0;
      var y = 0;
      do {
        x += element.offsetLeft;
        y += element.offsetTop;
        element = element.offsetParent;
      } while (element);
      // Position blocklyDiv over blocklyArea.
//      this.blocklyDiv.style.left = x + 'px';
//      this.blocklyDiv.style.top = y + 'px';
      let padL = parseInt($(this.blocklyArea).css('padding-left').replace(/[^-\d\.]/g, ''));
      let padR = parseInt($(this.blocklyArea).css('padding-right').replace(/[^-\d\.]/g, ''));
      let width = this.blocklyArea.offsetWidth - padL - padR;
      this.blocklyDiv.style.width = width + 'px';
      this.blocklyDiv.style.height = this.blocklyArea.offsetHeight + 'px';
      Blockly.svgResize(this.workspace);
    },
    saveBlock: function() {
      var xml = Blockly.Xml.workspaceToDom(this.workspace);
      var xmltxt = Blockly.Xml.domToText(xml);
      let that = this;
      axios.post("/api/v1/blocks/" + this.blockId, {
        xml: xmltxt
      }).then(function(res) {
        that.showNotification('Block <b>' + that.blockId + '</b> saved', 'info', 'save', 200);
      });
    },
    blocklyEvent: function(event) {
      if(event.type == "ui") {
        if(event.element == "selected") {
          this.selectBlock(event.newValue); // Can be null
        }
      }
      this.canUndo = this.workspace.undoStack_.length > 0;
      //console.log(event);
    },
    selectBlock: function(blockId) {
      this.selectedBlockId = blockId;
      if(blockId != null) {
        this.selectedBlock = this.workspace.getBlockById(blockId);
        if(this.selectedBlock == null) {
          this.selectedBlockId = null;
        } else {
          console.log(this.selectedBlock.type);
        }
      } else {
        this.selectedBlock = null;
      }
    },
    setToolbox: function(toolboxName) {
      this.toolboxName = toolboxName;
      this.workspace.updateToolbox(getToolbox(this.toolboxName));
    },
    revertBlock: function() {
      if(confirm("Revert will replace your current workspace with the original once you started the editor. Continue?")) {
        this.workspace.clear();
        Blockly.Xml.domToWorkspace(this.revertedBlocks, this.workspace);
      }
    },
    showProperties: function() {
      console.log(this.workspace.undoStack_.length);
      alert("props! " + this.blockId);
    },
    undo: function() {
      this.workspace.undo(false);
      this.canRedo = true;
      this.undone++;
      this.canUndo = this.workspace.undoStack_.length > 0;
    },
    redo: function() {
      this.workspace.undo(true);
      this.canUndo = true;
      this.undone--;
      this.canRedo = this.undone > 0;
    }
  }
})
