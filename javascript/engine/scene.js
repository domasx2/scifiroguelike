var gamejs = require('gamejs');
var inventory = require('./inventory/inventory');
var utils  = require('./utils');
var World  = require('./world').World;
var view   = require('./view');
var events = require('./events');
var ui_container = require('./ui/container');
var ui_character = require('./ui/character');

var Scene = exports.Scene = function(options){
    utils.process_options(this, options, {
        'display':utils.required,
    });
    
};

Scene.prototype.destroy = function(){
    
};

Scene.prototype.handle_events = function(events){
    
};

var WorldScene = exports.WorldScene = function(options){
    WorldScene.superConstructor.apply(this, [options]);
    utils.process_options(this, options, {
        'world': utils.required,
        'protagonist':null
    });
    
    this.world.scene = this;

    this.view = new view.View({
        world: this.world,
        surface: this.display
    });
    
    if(this.protagonist) this.set_protagonist(this.protagonist);
    this.init_ui();
};

WorldScene.load = function(data, cls){
      var world = World.load(data.world);
      
      var scene =  new cls({
            'world': world,
            'protagonist': data.protagonist ? world.objects.by_id(data.protagonist) : null,
            'display':data.display 
      });
      
      
      if(scene.protagonist && data.explored){
          scene.protagonist.vision.load_explored(utils.Array2D.load_bool(data.explored));
      }
      
      return scene;
};

gamejs.utils.objects.extend(WorldScene, Scene);

WorldScene.prototype.can_see = function(position){
    if(this.protagonist && this.protagonist.vision) return this.protagonist.vision.visible.get(position);
    return true;
}

WorldScene.prototype.set_protagonist = function(protagonist){
    this.protagonist = protagonist;
    this.view.follow = protagonist;
};

WorldScene.prototype.init_ui = function(){
    if(this.protagonist) {
        if(this.protagonist.inventory){
            this.inventory_ui = new  ui_container.Inventory({
                'collection':this.protagonist.inventory,
                'owner':this.protagonist,
                'position':[10, 10]
            });
        }
        
        this.ground_ui = new ui_container.GroundItems({
           'collection':new inventory.GroundItems(this.protagonist),
           'owner':this.protagonist,
           'position':[10, 120]
        });
        
        this.chracater_status = new ui_character.CharacterStatus({
            'owner':this.protagonist,
            'position':[400, 10]
        });
    }
};

WorldScene.prototype.destroy = function(){
    if(this.inventory_ui) this.inventory_ui.destroy();
    if(this.ground_ui) this.ground_ui.destroy();  
};

WorldScene.prototype.serialize = function(){
      return {
          'protagonist': this.protagonist.id,
          'world':this.world.serialize(),
          'explored': this.protagonist.vision.explored.serialize_bool()
      }
};

WorldScene.prototype.draw = function(){
    this.view.draw_map_layer_surface(this.world.map.floor_surface);
    this.view.draw_map_layer_surface(this.world.map.wall_surface);
    var draw_order = [];
    this.world.objects.iter(function(object){
        if(!draw_order[object.z]) draw_order[object.z]=[object];
        else draw_order[object.z].push(object);
    }, this);
    
    draw_order.forEach(function(objlist){
        objlist.forEach(function(object){
            if(!this.protagonist || (this.protagonist.can_see(object.position))) object.draw(this.view);
        }, this);
    }, this);
    
    if(this.protagonist&&this.protagonist.vision) this.protagonist.vision.draw(this.view);
};


WorldScene.prototype.update = function(deltams, events){
    this.handle_events(events);
    this.world.update(deltams, events);
    this.view.update(deltams);
};



