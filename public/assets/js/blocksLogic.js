$(function() {
  //loadTemplate();
  $.ajax({
    url: "/assets/dyn/blockTree.json",
    type: "GET",
    success: function (data) {
      $('#jstree').jstree({
        'core': {
          'data': data
        },
        'plugins': [ "contextmenu", "state", "wholerow" ],
        "contextmenu":{
            "items": function(node) {
              if(!node) return null;
              if(node.original.type == "dir")
                var tree = $("#jstree").jstree(true);
                return {
                    "Create": {
                        "separator_before": false,
                        "separator_after": false,
                        "label": "Create",
                        "action": function (obj) {
                            $node = tree.create_node($node);
                            tree.edit($node);
                        }
                    },
                    "Rename": {
                        "separator_before": false,
                        "separator_after": false,
                        "label": "Rename",
                        "action": function (obj) {
                            tree.edit($node);
                        }
                    },
                    "Remove": {
                        "separator_before": false,
                        "separator_after": false,
                        "label": "Remove",
                        "action": function (obj) {
                            tree.delete_node($node);
                        }
                    }
                };
            }
        }
      });

      $('#jstree_demo_div').on("changed.jstree", function (e, data) {
        console.log(data.selected);
      });
    }
  });
});
