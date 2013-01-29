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
        'world': world,
        'protagonist':null
    });

    this.view = new view.View({
        world: this.world
    });
    
    if(this.protagonist) this.view.follow = this.protagonist;
};

gamejs.utils.objects.extend(WorldScene, Scene);

WorldScene.prototype.handle_events = function(events){
    
};


WorldScene.prototype.draw = function(surface){
    this.view.surface = surface;
    this.view.draw_map_layer_surface(this.world.map.floor_surface);
    this.view.draw_map_layer_surface(this.world.map.wall_surface);
    this.world.objects.iter(function(object){
        if(!this.protagonist || (this.protagonist.can_see(object.position))) object.draw(this.view);
    }, this);
    if(this.protagonist&&this.protagonist.vision) this.protagonist.vision.draw(this.view);
};


WorldScene.prototype.update = function(deltams, events){
    this.handle_events(events);
    this.world.update(deltams, events);
    this.view.update(deltams);
};



