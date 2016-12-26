var fs = require("fs"),
    knox = require('knox'),
    path = require('path'),
    exec = require('child_process').exec,
    mkdirp = require('mkdirp'),
    _ = require('underscore');


var Packer = function(configPath){
  var self = this;

  var config = null,
      workingDir = '',
      outputDir = '',
      packages = [],
      s3Client = null;

  // Read config
  config = JSON.parse( fs.readFileSync(configPath || './assets.json') );
  workingDir = path.dirname(configPath);
  // console.log(config);

  config.js_options = config.js_options || [];
  config.css_options = config.css_options || [];

  // Make output dir
  if(config.s3) {
    config.outputDir = 'builds';

    s3Client = knox.createClient({
        key: config.s3.key,
        secret: config.s3.secret,
        bucket: config.s3.bucket
    });
  }

  // packages
  if(config.js) packages.push(config);

  if(config.packages) {
    config.packages.forEach(function(package){
      var def = _.clone(config);
      _.extend(def, package);
      packages.push(def);
    });
  };

  this.compress = function(){
    packages.forEach(function(package){
      self.compressJSPackage(package);
      self.compressCSSPackage(package);
    });
  };

  // Compress javascript package
  this.compressJSPackage = function(package, cb) {
    if(!package.js) return false;

    var outputFile = self.interpolatePath(package) + ".js";

    var files = _.map(package.js, function(js){
                  return path.join(workingDir, package.sourceDir, js);
                } ).join(' ');

    var command = 'cat '+ files +' | "' +
                  __dirname  + '/node_modules/uglify-js/bin/uglifyjs" --output "' +
                  outputFile + '" --no-copyright ' + package.js_options.join(' ');

    this.run(command, outputFile, function(err){
      if(!err) self.store(outputFile, package);
    });
  };

  // Compress css package
  this.compressCSSPackage = function(package, cb) {
    if(!package.css) return false;

    var outputFile = self.interpolatePath(package) + ".css";
    var files = _.map(package.css, function(css){
                  return path.join(workingDir, package.sourceDir, css);
                } ).join(' ');

    var command = 'cat '+ files +' | "' + 
                  __dirname  + '/node_modules/clean-css/bin/cleancss" -o "' +
                  outputFile + '" ' + package.css_options.join(' ');

    this.run(command, outputFile, function(err){
      if(!err) self.store(outputFile, package);
    });
  };

  // Restore by interpolated path
  this.interpolatePath = function(package) {
    // create dir if needed
    var dir = path.dirname(package.path);
    
    // create temp dir that will be deleted after
    if(config.s3) dir = path.join('.packed_assets', dir);

    if(dir) {
      dir = path.join(workingDir, dir);
      if(!fs.existsSync(dir)) mkdirp.sync(dir);
    }

    var realPath = package.path;
    var interpolations = ['name', 'version'];
    _.each(interpolations, function(i){
      realPath = realPath.replace(':' + i, package[i]);
    });
    package['realPath'] = realPath;


    if(config.s3) {
      return path.join(workingDir, '.packed_assets', package.realPath);
    } else {
      return path.join(workingDir, package.realPath);;  
    }
    
  };

  // Store compressed file
  this.store = function(outputFile, package) {
    if(s3Client){
      var extname = path.extname(outputFile);
      var key = package.realPath + extname;
      s3Client.putFile(outputFile, key, function(err, res){
        if(err) {
          self.log('ERROR', package.realPath, err);
        } else {
          self.log('S3', res.client._httpMessage.url);
        }
      });  
    }
  };

   // Prepare command for uglify
  this.run = function(command, outputFile, cb) {
    exec(command, function (err, stdout, stderr) {
      if(err) console.log(err);
      if(stdout) console.log(stdout);
      if(stderr) console.log(stderr);

      fs.stat(outputFile, function(err, stat){
          if(err){
            self.log('ERROR', outputFile);
          }else {
            self.log('COMPRESSED', outputFile, "" + parseInt(stat.size / 1024) + 'KB');  
          }
          
          cb(err);
      });
    });
  };

  this.log = function(state, arg1, arg2, arg3) {
    var red, blue, reset;
    red   = '\u001b[31m';
    blue  = '\u001b[34m';
    reset = '\u001b[0m';
    if(state == 'ERROR'){
      console.log(red,'ERROR', reset, arg1, arg2 || '', arg3 || '');
    } else {
      console.log(blue, state, reset, arg1, arg2 || '', arg3 || ''); 
    }
  }

};

module.exports = Packer;