#!/usr/bin/env node
var Packer = require('../packer');

var packer = new Packer(process.argv[2]);
packer.compress();