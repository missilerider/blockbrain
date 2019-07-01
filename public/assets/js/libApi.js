function apiDoGet(method, data, callback, dataType = "json") {
  console.log("API GET call " + method);
  $.get("/api/v1/" + method, data, callback, dataType);
  //function(res) {
    //if(callback) callback(res);
  //}
  //, "json");
}

function apiDoPost(method, data, callback) {
  console.log("API POST call " + method);
  $.post("/api/v1/" + method, data, callback
  //function(res) {
    //if(callback) callback(res);
  //}
  , "json");
}

function apiGetScript(id, callback) {
  apiDoGet("block/" + id, null, callback, "xml");/*function(res) {
    console.log("callback API");
    console.dir(res);
  });*/
}

function apiSaveScript(id, xml, js) {
  apiDoPost("block/" + id, {
		xml: xml,
		js: js
	}, function(res) {
    console.log("save!");
    console.dir(res);
  });
}
