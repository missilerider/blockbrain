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
    currentFiles: {}
  },
  mounted() {
    let that = this;
    axios.get("/assets/dyn/blockTree.json", {
    })
    .then(function(resp) {
      if(resp.headers["content-type"].includes("application/json")) {
        that.files = resp.data;
        that.currentFiles = that.files;
      } else {
        console.error("Bad response from API server: " + resp.body + ": " + resp.headers["content-type"]);
      }
    });
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
    makeFolder: function (item) {
    	Vue.set(item, 'children', [])
      this.addItem(item)
    },
    addItem: function (item) {
    	item.children.push({
        name: 'new stuff'
      })
    }
  }
})
