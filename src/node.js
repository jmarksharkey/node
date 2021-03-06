(function (process) {

process.global.process = process;
process.global.global = process.global;
global.GLOBAL = global;

/** deprecation errors ************************************************/

function removed (reason) {
  return function () {
    throw new Error(reason)
  }
}

GLOBAL.__module = removed("'__module' has been renamed to 'module'");
GLOBAL.include = removed("include(module) has been removed. Use require(module)");
GLOBAL.puts = removed("puts() has moved. Use require('sys') to bring it back.");
GLOBAL.print = removed("print() has moved. Use require('sys') to bring it back.");
GLOBAL.p = removed("p() has moved. Use require('sys') to bring it back.");
process.debug = removed("process.debug() has moved. Use require('sys') to bring it back.");
process.error = removed("process.error() has moved. Use require('sys') to bring it back.");
process.watchFile = removed("process.watchFile() has moved to fs.watchFile()");
process.unwatchFile = removed("process.unwatchFile() has moved to fs.unwatchFile()");
process.mixin = removed('process.mixin() has been removed.');

GLOBAL.node = {};

node.createProcess = removed("node.createProcess() has been changed to process.createChildProcess() update your code");
process.createChildProcess = removed("childProcess API has changed. See doc/api.txt.");
node.exec = removed("process.exec() has moved. Use require('sys') to bring it back.");
node.inherits = removed("node.inherits() has moved. Use require('sys') to access it.");
process.inherits = removed("process.inherits() has moved to sys.inherits.");

node.http = {};
node.http.createServer = removed("node.http.createServer() has moved. Use require('http') to access it.");
node.http.createClient = removed("node.http.createClient() has moved. Use require('http') to access it.");

node.tcp = {};
node.tcp.createServer = removed("node.tcp.createServer() has moved. Use require('tcp') to access it.");
node.tcp.createConnection = removed("node.tcp.createConnection() has moved. Use require('tcp') to access it.");

node.dns = {};
node.dns.createConnection = removed("node.dns.createConnection() has moved. Use require('dns') to access it.");


process.assert = function (x, msg) {
  if (!(x)) throw new Error(msg || "assertion error");
};

process.evalcx = process.binding('evals').Script.runInNewContext;

// nextTick()

var nextTickQueue = [];

process._tickCallback = function () {
  var l = nextTickQueue.length;
  while (l--) {
    var cb = nextTickQueue.shift();
    cb();
  }
};

process.nextTick = function (callback) {
  nextTickQueue.push(callback);
  process._needTickCallback();
};

// Module System
var module = {}
process.compile("(function (exports) {"
               + process.binding("natives").module
               + "\n})", "module")(module);

// TODO: make sure that event module gets loaded here once it's
// factored out of module.js
// module.require("events");

// Signal Handlers

function isSignal (event) {
  return event.slice(0, 3) === 'SIG' && process.hasOwnProperty(event);
};

process.addListener("newListener", function (event) {
  if (isSignal(event) && process.listeners(event).length === 0) {
    var b = process.binding('signal_watcher');
    var w = new b.SignalWatcher(process[event]);
    w.addListener("signal", function () {
      process.emit(event);
    });
  }
});

// Timers
function addTimerListener (callback) {
  var timer = this;
  // Special case the no param case to avoid the extra object creation.
  if (arguments.length > 2) {
    var args = Array.prototype.slice.call(arguments, 2);
    timer.callback = function () { callback.apply(timer, args); };
  } else {
    timer.callback = callback;
  }
}

global.setTimeout = function (callback, after) {
  var timer = new process.Timer();
  addTimerListener.apply(timer, arguments);
  timer.start(after, 0);
  return timer;
};

global.setInterval = function (callback, repeat) {
  var timer = new process.Timer();
  addTimerListener.apply(timer, arguments);
  timer.start(repeat, repeat);
  return timer;
};

global.clearTimeout = function (timer) {
  if (timer instanceof process.Timer) {
    timer.stop();
  }
};

global.clearInterval = global.clearTimeout;

var stdout;
process.__defineGetter__('stdout', function () {
  if (stdout) return stdout;
  var net = module.requireNative('net');
  stdout = new net.Stream(process.binding('stdio').stdoutFD);
  return stdout;
});

var stdin;
process.openStdin = function () {
  if (stdin) return stdin;
  var net = module.requireNative('net');
  var fd = process.binding('stdio').openStdin();
  stdin = new net.Stream(fd);
  stdin.resume();
  stdin.readable = true;
  return stdin;
};


process.exit = function (code) {
  process.emit("exit");
  process.reallyExit(code);
};


module.runMain();


// All our arguments are loaded. We've evaluated all of the scripts. We
// might even have created TCP servers. Now we enter the main eventloop. If
// there are no watchers on the loop (except for the ones that were
// ev_unref'd) then this function exits. As long as there are active
// watchers, it blocks.
process.loop();

process.emit("exit");

});
