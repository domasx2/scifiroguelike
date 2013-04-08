var gamejs = require('gamejs');
var game = require('./game').game;
var inventory = require('./inventory/inventory');
var utils  = require('./utils');
var World  = require('./world').World;
var view   = require('./view');
var events = require('./events');
var ui_container = require('./ui/container');
var ui_character = require('./ui/character');
var ui_utils = require('./ui/utils');

var Scene = exports.Scene = function(options){
    utils.process_options(this, options, {
        'display':utils.required,
    });
    
};

Scene.prototype.update = function(msduration, events){

};

Scene.prototype.draw = function(){

};

Scene.prototype.destroy = function(){
    
};

Scene.prototype.handle_events = function(events){
    
};

var WorldScene = exports.WorldScene = function(options){
    /*
     * This should handle anything to do with UI
     * 
     * 
     */
    WorldScene.superConstructor.apply(this, [options]);
    utils.process_options(this, options, {
        'world': utils.required,
        'protagonist':null
    });
    
    this.world.scene = this;

    this.view = new view.View({
        world: this.world,
        surface: this.display,
        scene: this
    });
    
    this.ui = {};
    
    if(this.protagonist) this.set_protagonist(this.protagonist);
    this.init_ui();
    
    this.world.objects.iter(function(obj){
        this._init_object(obj);
    }, this);
    
    this.world.on('spawn', this._init_object, this);
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

WorldScene.prototype._init_object = function(object){
    /*for convenience on spawn handlers for every object type can be implemented
     * simply by adding a "spawn_[type]" method
     */
    object.type.forEach(function(type){
        if(this['init_'+type]) this['init_'+type](object);
    }, this);
};

WorldScene.prototype.init_chest = function(chest){
    //on chest init: attach handlers to open chest UI on open
    chest.on('open', function(chest, actor){
        if(actor==this.protagonist) {
            var ui = this.spawn_ui('chest', {
               owner: actor,
               collection: chest.content,
               chest_object: chest,
               position: this.view.screen_position(utils.pos_px(utils.mod(chest.position, [0, 1])))
            });
            chest.on('close', ui.destroy, ui, true);
            ui.on('close', chest.close, chest);
        }
   }, this);
};

WorldScene.prototype.spawn_action_context_menu = function(screen_pos, actions){
    var ctxmenu = this.spawn_ui('context_menu', {
        'position':screen_pos,
        'items':ui_utils.bound_actions_to_menu_items(actions, this.protagonist)
    });
    
    ctxmenu.on('click_item', function(ctxmenu, action){
        if(action.condition(this.protagonist)) action.do(this.protagonist);
        else console.log('action no longer available', action);
    }, this)
    
}


WorldScene.prototype.can_see = function(position){
    if(this.protagonist && this.protagonist.vision) return this.protagonist.vision.visible.get(position);
    return true;
}

WorldScene.prototype.set_protagonist = function(protagonist){
    this.protagonist = protagonist;
    this.view.follow = protagonist;
};

WorldScene.prototype.spawn_ui = function(type, options){
    var obj = game.uimanager.e(type, options.id);
    var key;
    for(key in options){
        if(options.hasOwnProperty(key)){
            obj[key] = options[key];
        }
    }
    for(key in obj){
        if(obj[key] == utils.required){
            console.log('ui init error: '+key+' required!', obj);
        }   
    }
    this.ui[obj.id] = obj;
    obj.init(this);
    obj.on('destroy', function(){
        delete this.ui[obj.id];
    }, this);
    return obj;
};

WorldScene.prototype.init_ui = function(){
    if(this.protagonist) {
        if(this.protagonist.inventory){
            this.spawn_ui('inventory', {
                'collection':this.protagonist.inventory,
                'owner':this.protagonist,
                'position':[10, 10],
                'id':'inventory'
            });
        }
        
        this.spawn_ui('ground_items', {
           'collection':new inventory.GroundItems(this.protagonist),
           'owner':this.protagonist,
           'position':[10, 120]
        });
        
        this.spawn_ui('character_status', {
            'owner':this.protagonist,
            'position':[400, 10]
        });
    }
};

WorldScene.prototype.destroy = function(){
    gamejs.utils.objects.keys(this.ui).forEach(function(key){
       this.ui[key].destroy(); 
    }, this);
};

WorldScene.prototype.serialize = function(){
      return {
          'protagonist': this.protagonist.id,
          'world':this.world.serialize(),
          'explored': this.protagonist.vision.explored.serialize_bool()
      }
};


WorldScene.prototype.update = function(deltams, events){
    this.handle_events(events);
    this.world.update(deltams, events);
    this.view.update(deltams);
};

WorldScene.prototype.spawn_mouse_move_particle = function(position){
  this.world.spawn_particle('sprite', {
      sprite_name:'action_move',
      z: 0,
      position:position,
      'static': true
  });
};


WorldScene.prototype.draw = function(){
  this.view.draw();
};
