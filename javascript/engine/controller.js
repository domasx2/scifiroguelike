var gamejs = require('gamejs');
var constants = require('./constants');
var MOVE_KEY_MATRIX = constants.MOVE_KEY_MATRIX;



var Controller = exports.Controller = function(){
    this.creature = null;
};

Controller.prototype.act = function(world, events){
    return true;
};


var PlayerController = exports.PlayerController = function(){
      PlayerController.superConstructor.apply(this, []);
};

gamejs.utils.objects.extend(PlayerController, Controller);

PlayerController.prototype.action_move = function(world, events){
/*
 * grab keyboard input and move in direction pressed;
 * returns true if successful
 */
    var event;
    for(var i=0;i<events.length;i++){
        event = events[i];
        if(event.type === gamejs.event.KEY_DOWN){
            var angle = MOVE_KEY_MATRIX[event.key]; 
            if(!(angle==undefined)){
                this.creature.set_angle(angle)
                return world.event_move(this.creature, angle);
            }
        }  
    };
    return false;
};

PlayerController.prototype.act = function(world, events){
    return this.action_move(world, events);  
};
