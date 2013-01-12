var gamejs = require('gamejs');
var utils = require('./utils');
var sprite = require('./sprite');
var game = require('./game').game;

var Object = exports.Object = function(options){
    utils.process_options(this, options, {
       sprite: 'protagonist',
       solid: false,     //can other object pass through
       position: [0, 0], //in tiles
       angle: 0          //facing, angle, 0 faces top, 90 right, 180 bot,..
    });
    
    this.sprites = {
        static: sprite.new_sprite(this.sprite),
        move: sprite.new_sprite(this.sprite+'_move')
    }    
    
    this.active_sprite = this.sprites.static;
    this.snap_sprite();
};

Object.prototype.set_angle = function(angle){
      this.angle = angle;
};

Object.prototype.position_px = function(){
    return [this.position[0] * game.settings.TILE_WIDTH, this.position[1] * game.settings.TILE_WIDTH];  
};

Object.prototype.draw = function(view){
    if(this.active_sprite) this.active_sprite.draw(view);
};

Object.prototype.update = function(deltams){
    if(this.active_sprite) this.active_sprite.update(deltams);
};

Object.prototype.teleport = function(position){
    this.position = position;
    this.snap_sprite();
};

Object.prototype.teleport_relative = function(delta_position){
    this.teleport([this.position[0]+delta_position[0], this.position[1]+delta_position[1]]);
};

Object.prototype.set_sprite = function(type, snap){
    if(type=='') type='static';
    var prev = this.active_sprite;
    this.active_sprite = this.sprites[type];
    this.active_sprite.position = prev.position.slice(0);
    this.active_sprite.angle = prev.angle;
    this.active_sprite.reset();
    if(snap) this.snap_sprite();
};

Object.prototype.snap_sprite = function(){
    if(this.active_sprite){
        this.active_sprite.position = this.position_px();
        this.active_sprite.angle = this.angle;
    }  
};

var Creature = exports.Creature = function(options){
    
    options.solid = true;
    
    Creature.superConstructor.apply(this, [options]);
    
    utils.process_options(this, options, {
       max_health: 100,
       health: null
    });
    
    if(this.health == null) this.health = this.max_health;
    
    
  
};

gamejs.utils.objects.extend(Creature, Object);


