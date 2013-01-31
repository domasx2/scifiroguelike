var gamejs = require('gamejs');
var utils  = require('./utils');
var World  = require('./world').World;
var view   = require('./view');
var events = require('./events');

var Scene = exports.Scene = function(options){
    utils.process_options(this, options, {
    });
};

var WorldScene = exports.WorldScene = function(options){
    WorldScene.superConstructor.apply(this, [options]);
    utils.process_options(this, options, {
        'world': utils.required,
        'protagonist':null
    });

    this.view = new view.View({
        world: this.world
    });
    
    if(this.protagonist) this.view.follow = this.protagonist;
};

WorldScene.load = function(data, cls){
      var world = World.load(data.world);
      
      var scene =  new cls({
            'world': world,
            'protagonist': data.protagonist ? world.objects.by_id(data.protagonist) : null 
      });
      
      
      if(scene.protagonist && data.explored){
          scene.protagonist.vision.load_explored(utils.Array2D.load_bool(data.explored));
      }
      
      return scene;
};

gamejs.utils.objects.extend(WorldScene, Scene);

WorldScene.prototype.handle_events = function(events){
    
};


WorldScene.prototype.serialize = function(){
      return {
          'protagonist': this.protagonist.id,
          'world':this.world.serialize(),
          'explored': this.protagonist.vision.explored.serialize_bool()
      }
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



