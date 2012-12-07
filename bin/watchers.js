#!/usr/bin/env node
var path    = require('path');
var fs      = require('fs');
var io      = require('faye');
var argv    = require('optimist').argv;
var lib     = path.join(path.dirname(fs.realpathSync(__filename)), '../lib');
require(lib + '/main.js');