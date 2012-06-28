// Run: node packer.js assets.json

var fs = require("fs"),
    path = require('path'),
    exec = require('child_process').exec,
    _ = require('underscore');


var Packer = function(configPath){
  var self = this;

  var config = null,
      workingDir = '',
      outputDir = '',
      packages = [];

  // Read config
  config = JSON.parse( fs.readFileSync(configPath || './assets.json') );
  workingDir = path.dirname(configPath);
  // console.log(config);

  config.options = config.options || [];

  // Make output dir
  if(config.outputDir) {
    outputDir = path.join(workingDir, config.outputDir);
    if(!path.existsSync(outputDir)) fs.mkdirSync(outputDir);
  } else {
    outputDir = workingDir;
  }


  // packages
  if(config.js) packages.push(config);

  if(config.packages) {
    config.packages.forEach(function(package){
      var def = _.clone(config);
      _.extend(def, package);
      packages.push(def);
    });
  }

  // console.log(packages);
  
  // Prepare command for uglify

  this.compress = function(){
    packages.forEach(function(package){
      self.compressPackage(package);
    });
  };

  this.compressPackage = function(package) {
    var outputFile = outputDir + '/' + package.name + "-" + package.version + ".js";
    var files = _.map(package.js, function(js){
                  return path.join(workingDir, package.sourceDir, js);
                } ).join(' ');

    var command = 'cat '+ files +' | "' + __dirname  + '/node_modules/uglify-js/bin/uglifyjs" --output "' +
              outputFile + '" --no-copyright ' + package.options.join(' ');
    // console.log(command);

    // Execute
    exec(command, function (err, stdout, stderr) {
      if(err) console.log(err);
      if(stdout) console.log(stdout);
      if(stderr) console.log(stderr);

      fs.stat(outputFile, function(err, stat){
          var red, blue, reset;
          red   = '\u001b[31m';
          blue  = '\u001b[34m';
          reset = '\u001b[0m';
          console.log(blue,'OK', reset, outputFile, "" + parseInt(stat.size / 1024) + 'KB')  
      });
    });
  };
};

module.exports = Packer;