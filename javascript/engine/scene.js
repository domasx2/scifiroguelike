var gamejs = require('gamejs');
var utils  = require('./utils');
var world  = require('./world');
var view   = require('./view');
var events = require('./events');

var Scene = exports.Scene = function(options){
    utils.process_options(this, options, {
    });
};

var WorldScene = exports.WorldScene = function(options){
    WorldScene.superConstructor.apply(this, [options]);
    utils.process_options(this, options, {
        'world': world
    });

    this.view = new view.View({
        world: this.world
    });
    
    
};

gamejs.utils.objects.extend(WorldScene, Scene);

WorldScene.prototype.handle_events = function(events){
    
};


WorldScene.prototype.draw = function(surface){
    this.view.surface = surface;
    this.view.draw_layer(this.world.map.floor_layer);
    this.view.draw_layer(this.world.map.wall_layer);
    this.world.objects.forEach(function(object){
        object.draw(this.view);
    }, this);
};


WorldScene.prototype.update = function(deltams, events){
    this.world.update(deltams, events);
    this.view.update(deltams);
};



