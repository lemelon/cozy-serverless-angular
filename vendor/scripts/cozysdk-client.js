(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.cozydb = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
// Generated by CoffeeScript 1.8.0
var checkError, client, define, errorMaker;

client = require('./utils/client');

checkError = function(error, response, body, code, callback) {
  return callback(errorMaker(error, response, body, code));
};

errorMaker = function(error, response, body, expectedCode) {
  var err, msgStatus;
  if (error) {
    return error;
  } else if (response.status !== expectedCode) {
    msgStatus = "expected: " + expectedCode + ", got: " + response.statusCode;
    err = new Error("" + msgStatus + " -- " + body.error + " -- " + body.reason);
    err.status = response.statusCode;
    return err;
  } else {
    return null;
  }
};

define = function(docType, name, request, callback) {
  var map, path, reduce, reduceArgsAndBody, view;
  map = request.map, reduce = request.reduce;
  if ((reduce != null) && typeof reduce === 'function') {
    reduce = reduce.toString();
    reduceArgsAndBody = reduce.slice(reduce.indexOf('('));
    reduce = "function " + reduceArgsAndBody;
  }
  view = {
    reduce: reduce,
    map: "function (doc) {\n  if (doc.docType.toLowerCase() === \"" + (docType.toLowerCase()) + "\") {\n    filter = " + (map.toString()) + ";\n    filter(doc);\n  }\n}"
  };
  path = "request/" + docType + "/" + (name.toLowerCase()) + "/";
  return client.put(path, view, function(error, body, response) {
    return checkError(error, response, body, 200, callback);
  });
};

module.exports.create = function(docType, attributes, callback) {
  var path;
  path = "data/";
  attributes.docType = docType;
  if (attributes.id != null) {
    path += "" + attributes.id + "/";
    delete attributes.id;
    return callback(new Error('cant create an object with a set id'));
  }
  return client.post(path, attributes, function(error, body, response) {
    if (error) {
      return callback(error);
    } else {
      return callback(null, JSON.parse(body));
    }
  });
};

module.exports.find = function(id, callback) {
  return client.get("data/" + id + "/", null, function(error, body, response) {
    if (error) {
      return callback(error);
    } else if (response.status === 404) {
      return callback(null, null, null);
    } else {
      return callback(null, body);
    }
  });
};

module.exports.exists = function(id, callback) {
  return client.get("data/exist/" + id + "/", null, function(error, body, response) {
    if (error) {
      return callback(error);
    } else if ((body == null) || (body.exist == null)) {
      return callback(new Error("Data system returned invalid data."));
    } else {
      return callback(null, body.exist);
    }
  });
};

module.exports.updateAttributes = function(docType, id, attributes, callback) {
  console.log('updateAttributes');
  attributes.docType = docType;
  return client.put("data/merge/" + id + "/", attributes, function(error, body, response) {
    if (error) {
      return callback(error);
    } else if (response.status === 404) {
      return callback(new Error("Document " + id + " not found"));
    } else if (response.status !== 200) {
      return callback(new Error("Server error occured."));
    } else {
      return callback(null, JSON.parse(body));
    }
  });
};

module.exports.destroy = function(id, callback) {
  return client.del("data/" + id + "/", null, function(error, body, response) {
    if (error) {
      return callback(error);
    } else if (response.status === 404) {
      return callback(new Error("Document " + id + " not found"));
    } else if (response.status !== 204) {
      return callback(new Error("Server error occured."));
    } else {
      return callback(null);
    }
  });
};

module.exports.defineRequest = function(docType, name, request, callback) {
  var map, reduce;
  if (typeof request === "function" || typeof request === 'string') {
    map = request;
  } else {
    map = request.map;
    reduce = request.reduce;
  }
  return define(docType, name, {
    map: map,
    reduce: reduce
  }, callback);
};

module.exports.run = function(docType, name, params, callback) {
  var path, _ref;
  if (typeof params === "function") {
    _ref = [{}, params], params = _ref[0], callback = _ref[1];
  }
  path = "request/" + docType + "/" + (name.toLowerCase()) + "/";
  return client.post(path, params, function(error, body, response) {
    if (error) {
      return callback(error);
    } else if (response.status !== 200) {
      return callback(new Error(util.inspect(body)));
    } else {
      return callback(null, body);
    }
  });
};

module.exports.requestDestroy = function(docType, name, params, callback) {
  var path, _ref;
  if (typeof params === "function") {
    _ref = [{}, params], params = _ref[0], callback = _ref[1];
  }
  if (params.limit == null) {
    params.limit = 100;
  }
  path = "request/" + docType + "/" + (name.toLowerCase()) + "/destroy/";
  return client.put(path, params, function(error, body, response) {
    return checkError(error, response, body, 204, callback);
  });
};

},{"./utils/client":2}],2:[function(require,module,exports){
// Generated by CoffeeScript 1.8.0
var askForToken, playRequest;

askForToken = function() {
  return window.parent.postMessage({
    action: 'getToken'
  }, '*');
};

module.exports = {
  get: function(path, attributes, callback) {
    return playRequest('GET', path, attributes, function(error, body, response) {
      return callback(error, body, response);
    });
  },
  post: function(path, attributes, callback) {
    return playRequest('POST', path, attributes, function(error, body, response) {
      return callback(error, body, response);
    });
  },
  put: function(path, attributes, callback) {
    console.log('put');
    return playRequest('PUT', path, attributes, function(error, body, response) {
      return callback(error, body, response);
    });
  },
  del: function(path, attributes, callback) {
    return playRequest('DELETE', path, attributes, function(error, body, response) {
      return callback(error, body, response);
    });
  }
};

playRequest = function(method, path, attributes, callback) {
  var eventListening, xhr;
  askForToken();
  xhr = new XMLHttpRequest;
  xhr.open(method, "/ds-api/" + path, true);
  eventListening = function(action) {
    return function(e) {
      window.removeEventListener('message', eventListening);
      return action(e.data);
    };
  };
  return window.addEventListener('message', eventListening(function(intent) {
    xhr.onload = function() {
      return callback(null, xhr.response, xhr);
    };
    xhr.onerror = function(e) {
      var err;
      err = 'Request failed : #{e.target.status}';
      return callback(err);
    };
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.setRequestHeader('Authorization', 'Basic ' + btoa(intent.appName + ':' + intent.token));
    if (attributes != null) {
      xhr.send(JSON.stringify(attributes));
    } else {
      xhr.send();
    }
  }), true);
};

},{}]},{},[1])(1)
});
//# sourceMappingURL=cozysdk-client.js.map
