var app = new Vue({
  el: '#app',
  data: {
    message: 'Hello Vue!',
    services: {},
    blockId: null,
    workspace: null,
    blocklyArea: null,
    blocklyDiv: null,
    options: null
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
          //var newXmlStr = s.serializeToString(resp.data);
          var bxml = Blockly.Xml.textToDom(resp.data);
          Blockly.Xml.domToWorkspace(bxml, that.workspace);
        } else {
          console.error("Bad response from API server: " + resp.body);
        }
      });
    },
    injectBlockly: function(readyCallback) {
      this.blocklyArea = document.getElementById('blocklyArea');
      this.blocklyDiv = document.getElementById('blocklyDiv');
      this.options = {
        toolbox: getToolbox("default"),
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
    revertBlock: function() {
      alert("revert! " + this.blockId);
    },
    showProperties: function() {
      alert("props! " + this.blockId);
    }
  }
})
