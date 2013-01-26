var gamejs = require('gamejs');
var utils = require('./utils');
var sprite = require('./sprite');
var game = require('./game').game;
var controllers = require('./controllers');

var Collection = exports.Collection = function(){
    this.objects = [];  
    this.objects_by_id = {};
};

Collection.prototype.add = function(obj){
    this.objects.push(obj);
    this.objects_by_id[obj.id] = obj;
};

Collection.prototype.by_id = function(id){
    return this.objects_by_id[id];
};

Collection.prototype.iter = function(cb, context){
    this.objects.forEach(cb, context);  
};

Collection.prototype.clone = function(){
    var retv = new Collection();
    retv.objects = this.objects.slice(0);
    retv.objects_by_id = utils.clonedict(this.objects_by_id);
    return retv;
};

Collection.prototype.pop = function(){
    var obj = this.objects[0];
    this.remove(obj);
    return obj; 
};

Collection.prototype.len = function(){
    return this.objects.length;  
};

Collection.prototype.by_pos = function(pos){
    var retv=[];
    this.iter(function(obj){
        if((obj.position[0] == pos[0]) && (obj.position[1]==pos[1])) retv.push(obj);
    });
    return retv;
};

Collection.prototype.remove = function(obj){
    for(var i=0;i<this.objects.length;i++){
        if(this.objects[i].id == obj.id){
            this.objects.splice(i, 1);
            break;
        }
    }
    delete this.objects_by_id[obj.id];
};

Collection.prototype.serialize = function(){
    var retv = [];
    this.iter(function(obj){
        retv.push(obj.id);
    }); 
    return retv;
};

var Object = {
    
    //PROPERTIES
    'position':[0, 0],
    'angle':0,
    'sprite_name':'', //base name for sprite
    'sprite':'static', //currently active sprite
    'threadable':true,      //can it be stood/waled on?
    'transparent':true, //can it be seen through?
    'solid': false,     //can projectiles pass through?
    
    //METHODS
    'init':function(world){
        this.world = world;
        this._sprites = {};
        this.set_sprite(this.sprite, true);   
    },
    
    'act': controllers.do_nothing,
    
    'set_angle':function(angle){
        this.angle = angle;
        if(this.active_sprite) this.active_sprite.angle = angle;
    },
    
    'get_position_px': function(){
        return [this.position[0] * game.settings.TILE_WIDTH, this.position[1] * game.settings.TILE_WIDTH];  
    },
    
    'draw': function(view){
        if(this.active_sprite) this.active_sprite.draw(view);
    },
    
    'update': function(deltams){
        if(this.active_sprite) this.active_sprite.update(deltams);
    },

    'teleport':  function(position){
        this.position = position;
        this.snap_sprite();
    },
    
    'teleport_relative':  function(delta_position){
        this.teleport([this.position[0]+delta_position[0], this.position[1]+delta_position[1]]);
    },
    
    'set_sprite': function(type, snap){
        if(type=='') type='static';
        var prev = this.active_sprite;
        if(!this._sprites[type]){
            this._sprites[type] = sprite.new_sprite(this.sprite_name+'_'+type);
        }
        this.active_sprite = this._sprites[type];
        if(!this.active_sprite) return;
        this.active_sprite.position = prev? prev.position.slice(0): this.get_position_px();
        this.active_sprite.angle = prev? prev.angle : this.angle;
        this.active_sprite.reset();
        if(snap) this.snap_sprite();
    },
    
    'snap_sprite': function(){
        if(this.active_sprite){
            this.active_sprite.position = this.get_position_px();
            this.active_sprite.angle = this.angle;
        }  
    }
};

game.objectmanager.c('object', Object);

var Creature = {
    'max_health':100,
    'health':100,
    'team':'neutral',
    'threadable':false,
    
    'act':controllers.roam,
    '_requires':'object'
}

game.objectmanager.c('creature', Creature);
