var gamejs = require('gamejs');
var utils = require('../engine/utils');
var Controller = require('../engine/controller').Controller;

var roam = exports.roam = function(options){
      utils.process_options(this, options, {
          
      });
      roam.superConstructor.apply(this, [options]);
};

gamejs.utils.objects.extend(roam, Controller);

roam.prototype.act = function(world, events){
    world.event_move(this.creature, Math.floor((Math.random()*4))*90);
    return true;
};

