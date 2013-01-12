var gamejs = require('gamejs');
var utils = require('./utils');

var World = exports.World = function(options){
    utils.process_options(this, options, {
        map: utils.required
    });
  
    this.objects = [];
};

World.prototype.spawn = function(object){
    this.objects.push(object);
};