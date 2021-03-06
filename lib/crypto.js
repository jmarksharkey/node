var sys = require("sys");
try {
  var binding = process.binding('crypto');
  var SecureContext = binding.SecureContext;
  var SecureStream = binding.SecureStream;
  var Hash = binding.Hash;
  var Sign = binding.Sign;
  var Verify = binding.Verify;
  var crypto = true;
} catch (e) {
    
  var crypto = false;
}
function Credentials(method) {
  if (!crypto) {
      throw new Error('node.js not compiled with openssl crypto support.');
  }
  this.context = new SecureContext();
  if (method) this.context.init(method);
  else this.context.init();
}

exports.createCredentials = function(cred) {
  var c = new Credentials(cred.method);
  if (cred.key) c.context.setKey(cred.key);
  if (cred.cert) c.context.setCert(cred.cert);
  if (cred.ca) {
    if ( (typeof(cred.ca) == 'object') && cred.ca.length ) {
      for(var i=0; i<cred.ca.length; i++)
        c.context.addCACert(cred.ca[i]);
    } else {
      c.context.addCACert(cred.ca);
    }
  }
  return c;
}
exports.Credentials = Credentials;

exports.Hash = Hash;
exports.createHash = function(hash) {
  return (new Hash).init(hash);
}

exports.Sign = Sign;
exports.createSign = function(algorithm) {
  return (new Sign).init(algorithm);
}

exports.Verify = Verify;
exports.createVerify = function(algorithm) {
  return (new Verify).init(algorithm);
}