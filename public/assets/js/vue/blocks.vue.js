var app = new Vue({
  el: '#app',
  data: {
    treeData: {
      name: 'My Tree',
      children: [
        { name: 'hello' },
        { name: 'wat' },
        {
          name: 'child folder',
          children: [
            {
              name: 'child folder',
              children: [
                { name: 'hello' },
                { name: 'wat' }
              ]
            },
            { name: 'hello' },
            { name: 'wat' },
            {
              name: 'child folder',
              children: [
                { name: 'hello' },
                { name: 'wat' }
              ]
            }
          ]
        }
      ]
    }, 
    files: {}, 
    currentFiles: {}, 
    searchText: "", 
    searchTimer: null
  },
  mounted() {
/*    let that = this;
//    axios.get("/assets/dyn/blockTree.json", {
    axios.get("/assets/dyn/blockJsTree.json", {
      })
    .then(function(resp) {
      if(resp.headers["content-type"].includes("application/json")) {
        console.dir($('#jstree').jstree(true));
        $('#jstree').jstree(true).settings.core.data = resp.data;
        $('#jstree').jstree(true).refresh();
        //that.files = resp.data;

        //that.currentFiles = that.files;
      } else {
        console.error("Bad response from API server: " + resp.body + ": " + resp.headers["content-type"]);
      }
    });*/
  }, 
  methods: {
    browseItem: function(item) {
      switch(item.type) {
        case "dir":
          item.children.parent = this.currentFiles;
          this.currentFiles = item.children;
          break;

        case "file":
          window.location.href = "editor.html?id=" + item.editorPath;
          break;
        }
    }, 
    browseParent: function() {
      this.currentFiles = this.currentFiles.parent;
    }, 
    onSearch: function() {
      let that = this;
      if(this.searchTimer) clearTimeout(this.searchTimer);
      this.searchTimer = setTimeout(function() {
        if(that.searchText == "") {
          that.currentFiles = that.files;
        } else {
          let data = [];
          that.findScript(that.searchText, that.files, data);
          console.log(data);
          that.currentFiles = data;
        }
      }, 200);
    }, 
    findScript(t, f, data) {
      for(let n = 0; n < f.length; n++) {
        if(f[n].text.match(t)) {
          console.log(f[n].text);
          data.push(f[n]);
        }
        if(f[n].type == "dir") {
          this.findScript(t, f[n].children, data);
        }
      }
    }, 
    test: function(t) {
      console.log("test!");
      if(t)
        console.dir(t);
    }
  }
});
