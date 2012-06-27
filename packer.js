// Run: node packer.js assets.json

var fs = require("fs"),
    path = require('path'),
    exec = require('child_process').exec;


var Packer = function(configPath){
  var config = null,
      workingDir = '',
      outputDir = '';

  // Read config
  if(configPath) {
    config = fs.readFileSync(configPath);
    config = JSON.parse(config);
    workingDir = path.dirname(configPath) + '/';
  } else {
    config = require('./assets');
  }
  console.log(config);

  // Make output dir
  if(config.outputDir) {
    outputDir = workingDir + config.outputDir;
    if(!path.existsSync(outputDir)) fs.mkdirSync(outputDir);
  } else {
    outputDir = workingDir;
  }

  config.options = config.options || [];

  var jsFiles = [];
  config.js.forEach(function(js){
    jsFiles.push(workingDir + js);
  });
  jsFiles = jsFiles.join(' ');
  

  // Prepare command for uglify

  var outputFile = function() {
    return outputDir + '/' + config.name + "-" + config.version + ".js";
  }

  this.compress = function(){
    var command = '"' + __dirname  + '/node_modules/uglify-js/bin/uglifyjs" --output "' +
              outputFile() + '" --no-copyright ' + jsFiles + ' ' + config.options.join(' ');
    console.log(command);

    // Execute
    exec(command, function (err, stdout, stderr) {
      console.log(err);
      console.log(stdout);
      console.log(stderr);
    });
  };
};

module.exports = Packer;