## Pack assets
Pack your javascripts or css files into one file. 

### Install

    npm install pack-assets -g

### Usage
Create configuration file assets.yml. 

	{
  	  "name": "multi",
  	  "version": "0.1.0",
  	  "outputDir": "builds",
  	  "packages": [
        {
          "name": "core",
          "js": ["core/underscore.js", "core/backbone.js"],
          "css": ["core/reset.css", "core/screen.css"]
        },
    	{
          "name": "plugin",
          "sourceDir": "plugin",
          "js": ["jquery.isotope.js", "jquery.mousewheel.js"],
          "css": ["soulmate.css", "ajaxful_rating.css", "facebox.css"]
        }
      ],
      "js": ["core/underscore.js", "core/backbone.js", "plugin/jquery.isotope.js", "plugin/jquery.mousewheel.js"]
    }
    
To build assets type:

    pack
or

    pack your-config.yml
    
In this example will be cretead three js and three css packages in builds folder.

    builds/core-0.1.0.js
    builds/core-0.1.0.css
    builds/plugin-0.1.0.js
    builds/plugin-0.1.0.css
    builds/multi-0.1.0.js
    builds/multi-0.1.0.css
    
Root options is common options for all packages. Package can override root options.
All files should be related to config file.

