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

  config.js_options = config.js_options || [];
  config.css_options = config.css_options || [];

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
  
  // Prepare command for uglify

  this.run = function(command, outputFile) {
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

  this.compress = function(){
    packages.forEach(function(package){
      self.compressJSPackage(package);
      self.compressCSSPackage(package);
    });
  };

  this.compressJSPackage = function(package) {
    if(!package.js) return false;

    var outputFile = outputDir + '/' + package.name + "-" + package.version + ".js";
    var files = _.map(package.js, function(js){
                  return path.join(workingDir, package.sourceDir, js);
                } ).join(' ');

    var command = 'cat '+ files +' | "' +
                  __dirname  + '/node_modules/uglify-js/bin/uglifyjs" --output "' +
                  outputFile + '" --no-copyright ' + package.js_options.join(' ');

    this.run(command, outputFile);
  };

  this.compressCSSPackage = function(package) {
    if(!package.css) return false;

    var outputFile = outputDir + '/' + package.name + "-" + package.version + ".css";
    var files = _.map(package.css, function(css){
                  return path.join(workingDir, package.sourceDir, css);
                } ).join(' ');

    var command = 'cat '+ files +' | "' + 
                  __dirname  + '/node_modules/clean-css/bin/cleancss" -o "' +
                  outputFile + '" ' + package.css_options.join(' ');

    this.run(command, outputFile);
  };
};

module.exports = Packer;