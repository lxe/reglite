#!/usr/bin/env node

var http = require('http');
var async = require('async');
var request = require('request');
var fs = require('fs');
var shasum = require('shasum');
var path = require('path');
var zlib = require('zlib');
var rawbody = require('raw-body');

var port = process.env.PORT || 3000;
var registry = process.env.NPM_REGISTRY || 'http://registry.npmjs.org';

if (!fs.existsSync('packages')) fs.mkdirSync('packages');

http.createServer(function (req, res) {

  function serveError (error) {
    console.error(error.stack);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(error.stack, false, '  '));
  }

  function serveSuccess () {
    res.writeHead(200, { });
    res.end();
  }

  function proxy() {
    request(registry + req.url).pipe(res);
  }

  return rawbody(req, {
    length: req.headers['content-length'],
    limit: '50mb'
  }, function (err, body) {
    if (err) return serveError(err);

    if (body && body.length > 0) {
      try {
        req.body = JSON.parse(body);
      } catch (e) {
        return serveError(e);
      }
    }

    // Publish!
    if (req.method === 'PUT') {
      if (!req.body._attachments) return serveSuccess();
      return async.each(Object.keys(req.body._attachments), function (fileName, done) {
        var filePath = path.join('packages', fileName);
        fs.exists(filePath, function (exists) {
          if (exists) return done();
          var buffer = new Buffer(req.body._attachments[fileName].data, 'base64');
          fs.writeFile([filePath, shasum(buffer)].join('.'), buffer, done);
        })
      }, function (err) {
        if (err) return serveError(err);
        return serveSuccess();
      });
    }

    // Download!!!
    if (req.url.indexOf('/-/') === 0) {
      var fileName = path.join('packages', req.url.split('/').pop());
      console.log('Serving local file %s', fileName);
      return fs.createReadStream(fileName).pipe(res);
    }

    // Install!
    fs.readdir('packages', function (err, files) {
      if (err) return serveError(err);
      if (files && files.length) {
        var pkgName = req.url.slice(1);

        files = files.filter(function (file) {
          return file.indexOf(pkgName) == 0
        });

        if (!files.length) return proxy();

        console.log('Found local package(s) %s', files.join(', '));
        res.writeHead(200, { 'Content-Type': 'application/json' });
        var d = files.reduce(function (data, fileName) {
          var version = fileName.match(/(\w\.)+/)[0].slice(0, -1)
          data.versions[version] = {
            dist: {
              tarball: 'http://' + req.headers.host + '/-/' + fileName,
              shasum: fileName.split('.').pop()
            }
          };
          data['dist-tags'][version] = version;
          return data;
        }, { 
          name: pkgName, 
          'dist-tags' : { }, 
          'versions' : { } 
        });

        return res.end(JSON.stringify(d)); 
      }
    });
  
  });

}).listen(process.env.PORT || 3000, function () {
  console.log('Listening on %s', '' + port);
});
