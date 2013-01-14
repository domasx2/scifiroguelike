var gamejs = require('gamejs');
var utils = require('./utils');
var game = require('./game').game;
var constants = require('./constants');

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

var Event = exports.Event = function(options){  
    utils.process_options(this, options, {
        duration: 0,   
    });  
    this.age = 0;
    this.finished = false;
};

Event.prototype.update = function(deltams){
    this.age += deltams;
    if(this.duration && this.age >= this.duration){
        this.finished=true;
        this.finish();
    }
};

Event.prototype.finish = function(){};

//im sure theres a better way to do link
                
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
};

gamejs.utils.objects.extend(ObjectMoveEvent, Event);

ObjectMoveEvent.prototype.finish = function(){
    this.object.teleport_relative([MOVE_MOD[this.direction][0], MOVE_MOD[this.direction][1]]);
    this.object.set_sprite('static', true);
};

ObjectMoveEvent.prototype.update = function(deltams){
    var deltapx = game.settings.TILE_WIDTH * (deltams / this.duration);
    
    this.pos = [this.pos[0]+(deltapx*MOVE_MOD[this.direction][0]),
                this.pos[1]+(deltapx*MOVE_MOD[this.direction][1])];   
    this.object.active_sprite.position = [parseInt(this.pos[0]), parseInt(this.pos[1])];
    Event.prototype.update.apply(this, [deltams]);     
};
