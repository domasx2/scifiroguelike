var gamejs = require('gamejs');

var MOVE_KEY_MATRIX = {};
MOVE_KEY_MATRIX[gamejs.event.K_RIGHT] = 90;
MOVE_KEY_MATRIX[gamejs.event.K_LEFT] = 270;
MOVE_KEY_MATRIX[gamejs.event.K_UP] = 0;
MOVE_KEY_MATRIX[gamejs.event.K_DOWN] = 180;


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
            if(!(MOVE_KEY_MATRIX[event.key]==undefined)){
                world.event_move(this.creature, MOVE_KEY_MATRIX[event.key]);
                return true;
            }
        }  
    };
    return false;
};

PlayerController.prototype.act = function(world, events){
    return this.action_move(world, events);  
};
