var gamejs = require('gamejs');
var utils = require('./utils');
var game = require('./game').game;
var constants = require('./constants');
var random = require('./random');
var MOVE_MOD = constants.MOVE_MOD;

var EventFrame = exports.EventFrame = function(){
    /*
     * encapsulates events happening simultaneously 
     */
    
    this.events = [];
};

EventFrame.prototype.add = function(event){
    this.events.push(event);  
};

EventFrame.prototype.update = function(deltams){
    this.events.forEach(function(event){
        if(!event.finished) event.update(deltams); 
    });
};

EventFrame.prototype.is_finished = function(){
    for(var i=0;i<this.events.length;i++){
        if(!this.events[i].finished) return false;  
    };
    return true;
};

/************************
 * PersistentEventFrame
 * destroys finished events, but is never finished itself
 */

var PersistentEventFrame = exports.PersistentEventFrame = function(){
    PersistentEventFrame.superConstructor.apply(this, []);
};

gamejs.utils.objects.extend(PersistentEventFrame, EventFrame);

PersistentEventFrame.prototype.is_finished = function(){return true;};

PersistentEventFrame.prototype.update = function(deltams){
      EventFrame.prototype.update.apply(this, [deltams]);
      var events = [];
      this.events.forEach(function(event){
          if(!event.finished) events.push(event); 
      });
      this.events = events;
};

var Event = exports.Event = function(options){  
    utils.process_options(this, options, {
        owner: utils.required,
        duration: 0,   
    });  
    this.age = 0;
    this.finished = false;
};

Event.prototype.update = function(deltams){
    this.age += deltams;
    if(this.duration && this.age >= this.duration){
        this.finish();
    }
};

Event.prototype.finish = function(){
    this.finished = true;
};


var ObjectMoveEvent = exports.ObjectMoveEvent = function(options){
    options.duration = game.settings.MOVE_DURATION;
    utils.process_options(this, options, {
        object: utils.required,
        direction: utils.required     
    });
    
    ObjectMoveEvent.superConstructor.apply(this, [options]);
    
    this.object.set_angle(this.direction);
    this.object.set_sprite('move', true);
    
    this.pos = this.object.active_sprite.position.slice(0);
    this.object._previous_position = this.object.position;
    this.object.teleport_relative([MOVE_MOD[this.direction][0], MOVE_MOD[this.direction][1]]);
};

gamejs.utils.objects.extend(ObjectMoveEvent, Event);

ObjectMoveEvent.prototype.finish = function(){
    this.object._previous_position = null;
    Event.prototype.finish.apply(this, []);
    this.object.set_sprite('static', true);
};

ObjectMoveEvent.prototype.update = function(deltams){
    var deltapx = game.settings.TILE_WIDTH * (deltams / this.duration);
    
    this.pos = [this.pos[0]+(deltapx*MOVE_MOD[this.direction][0]),
                this.pos[1]+(deltapx*MOVE_MOD[this.direction][1])];   
    this.object.active_sprite.position = [this.pos[0], this.pos[1]];
    Event.prototype.update.apply(this, [deltams]);     
};

/********************
RANGED ATTACK EVENT
*/




var RangedAttackEvent = exports.RangedAttackEvent = function(options){
    utils.process_options(this, options, {
        'weapon':utils.required,
        'target':utils.required
    });
    RangedAttackEvent.superConstructor.apply(this, [options]);

    //try to pick a direction to face that is not in fact a wall
    //TODO: more complex LOS check
    
    var directions = utils.all_directions(this.owner.position, this.target.position);
    var direction;
    for(var i =0; i<directions.length;i++){
        direction = directions[i];
        if(!this.owner.world.map.is_wall(utils.shift(this.owner.position, direction))) break;
    }
    this.owner.set_angle(direction);

    this.owner.set_sprite('attack_ranged');
    this.init_shot_mark = this.owner.active_sprite.definition.duration / 2;
    this.duration = this.owner.active_sprite.definition.duration+((this.weapon.shots-1)*this.weapon.fire_rate);
    this.shots_fired = 0;
};

gamejs.utils.objects.extend(RangedAttackEvent, Event);

RangedAttackEvent.prototype.finish = function(){
    this.owner.set_sprite('static');
    Event.prototype.finish.apply(this, []);  
};

RangedAttackEvent.prototype.update = function(deltams){
    var shot = 0
    if(this.age-this.init_shot_mark > 0){
        shot += 1+parseInt(Math.max(this.age - this.init_shot_mark, 0) / this.weapon.fire_rate);
        shot = Math.min(shot, this.weapon.shots);
    }
    while(this.shots_fired <shot){
        this.shots_fired +=1;
        this.weapon.shoot(this.owner, this.target);
    }
    Event.prototype.update.apply(this, [deltams]);
};

/***************************************
*MELEE ATTACK EVENT
*/

var MeleeAttackEvent = exports.MeleeAttackEvent = function(options){
    utils.process_options(this, options, {
       'weapon': utils.required,
       'target': utils.required
    });
    MeleeAttackEvent.superConstructor.apply(this, [options]);
    
    this.owner.set_angle(utils.direction(this.owner.position, this.target.position));
    this.owner.set_sprite('attack_melee');
    this.duration = this.owner.active_sprite.definition.duration;
    this.have_swung = false;
};

gamejs.utils.objects.extend(MeleeAttackEvent, Event);

MeleeAttackEvent.prototype.finish = function(){
    this.owner.set_sprite('static');
    Event.prototype.finish.apply(this, []);
    
};

MeleeAttackEvent.prototype.update = function(deltams){
  if(!this.have_swung && this.age > this.duration/2){
      this.have_swung = true;
      this.weapon.swing(this.owner, this.target);
  } 
  Event.prototype.update.apply(this, [deltams]);
};

/**************************************
*PROJECTILE EVENT
*/

var ProjectileEvent = exports.ProjectileEvent = function(options){
    utils.process_options(this, options, {
        'weapon':utils.required,
        'target_pos':utils.required,
        'target':null,
        'particle':utils.required,
        'wall_hit_particle_type':'splatter',
        'wall_hit_particle_options':{
            'color':'#FF6A00',
            'min_size':1,
            'max_size':1,
            'blip_count':5
        }
    });
    ProjectileEvent.superConstructor.apply(this, [options]);
    this.objects_hit = [];
    options.duration = parseInt((this.particle.length / this.particle.velocity_px) * 1000);
    this.particle.on('enter_tile', this.enter_tile, this);
};

gamejs.utils.objects.extend(ProjectileEvent, Event);

ProjectileEvent.prototype.enter_tile = function(projectile, position){
    var tile = utils.round_vec(position);
    //construct from hell
    this.weapon.world.objects.by_pos(tile).some(function(obj){
        if(this.weapon.tryhit(this.owner, obj, position)){
            this.objects_hit.push(obj);
        }
        if(this.objects_hit.length >=this.weapon.pierce || obj.solid){
            this.particle.stop();
            this.finish();
            return true;
        }
    }, this);
    if(!this.finished && this.weapon.world.map.is_wall(tile)){
        this.weapon.world.spawn_particle(this.wall_hit_particle_type, {
            'position':position
        }, this.wall_hit_particle_options);
        this.particle.stop();
        this.finish();
    }
    
};

ProjectileEvent.prototype.finish = function(){
      this.particle.finish();
      Event.prototype.finish.apply(this, []);
};

ProjectileEvent.prototype.update = function(deltams){
    if(this.particle.is_finished()) this.finish();
};
