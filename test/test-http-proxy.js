include("mjsunit.js");

var PROXY_PORT = 8869;
var BACKEND_PORT = 8870;

var backend = new node.http.Server(function (req, res) {
  // node.debug("backend");
  res.sendHeader(200, [["content-type", "text/plain"]]);
  res.sendBody("hello world\n");
  res.finish();
});
// node.debug("listen backend")
backend.listen(BACKEND_PORT);

var proxy_client = new node.http.Client(BACKEND_PORT);
var proxy = new node.http.Server(function (req, res) {
  // node.debug("proxy req");
  var proxy_req = proxy_client.get(req.uri.path);
  proxy_req.finish(function(proxy_res) {
    res.sendHeader(proxy_res.statusCode, proxy_res.headers);
    proxy_res.onBody = function(chunk) { 
      res.sendBody(chunk);
    };
    proxy_res.onBodyComplete = function() {
      res.finish();
      // node.debug("proxy res");
    };
  });
});
// node.debug("listen proxy")
proxy.listen(PROXY_PORT);

var body = "";

function onLoad () {
  var client = new node.http.Client(PROXY_PORT);
  var req = client.get("/test");
  // node.debug("client req")
  req.finish(function (res) {
    // node.debug("got res");
    assertEquals(200, res.statusCode);
    res.setBodyEncoding("utf8");
    res.onBody = function (chunk) { body += chunk; };
    res.onBodyComplete = function () {
      proxy.close();
      backend.close();
      // node.debug("closed both");
    };
  });
}

function onExit () {
  assertEquals(body, "hello world\n");
}