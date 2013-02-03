var gamejs = require('gamejs');
var inventory = require('./inventory/inventory');
var utils  = require('./utils');
var World  = require('./world').World;
var view   = require('./view');
var events = require('./events');
var GUI = require('./lib/gamejs-gui');
var ui = require('./ui');

var Scene = exports.Scene = function(options){
    utils.process_options(this, options, {
        'display':utils.required,
    });
    this.gui = new GUI.GUI(this.display);
    
};

var WorldScene = exports.WorldScene = function(options){
    WorldScene.superConstructor.apply(this, [options]);
    utils.process_options(this, options, {
        'world': utils.required,
        'protagonist':null
    });

    this.view = new view.View({
        world: this.world,
        surface: this.display
    });
    
    if(this.protagonist) {
        this.view.follow = this.protagonist;
        if(this.view.follow.inventory){
            this.inventory_frame = new  ui.InventoryFrame({
                'collection':this.view.follow.inventory,
                'gui':this.gui,
                'position':[10, 10],
                'protagonist':this.protagonist
            });
        }
        
        this.ground_items_frame = new ui.GroundItemsFrame({
           'collection':new inventory.GroundItems(this.protagonist),
           'gui':this.gui ,
           'position': [60, 10],
           'protagonist':this.protagonist
        });
    }
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

WorldScene.prototype.handle_events = function(events){
    
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
    this.gui.draw(true);
};


WorldScene.prototype.update = function(deltams, events){
    this.handle_events(events);
    events.forEach(function(event){
        this.gui.despatchEvent(event);
    }, this);
    this.gui.update(deltams);
    this.world.update(deltams, events);
    this.view.update(deltams);
};



