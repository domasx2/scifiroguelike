var gamejs = require('gamejs');
var constants = require('./constants');
var MOVE_KEY_MATRIX = constants.MOVE_KEY_MATRIX;

exports.player_move = function(world, events){
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
                this.set_angle(angle)
                return world.event_move(this, angle);
            }
        }  
    };
    return false;
};

exports.roam = function(world, events){
    world.event_move(this, Math.floor((Math.random()*4))*90, true);
    return true;
};

exports.do_nothing = function(world, events){
    return true;  
};

exports.do_nothing.skip = true;

