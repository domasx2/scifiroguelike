var gamejs = require('gamejs');
var constants = require('./constants');
var game = require('./game').game;
var MOVE_KEY_MATRIX = constants.MOVE_KEY_MATRIX;

exports.player_move = function(world, events){
/*
 * grab keyboard input and move in direction pressed;
 * returns true if successful
 */
    var event;
    var retv = false;
    gamejs.utils.objects.keys(MOVE_KEY_MATRIX).some(function(key){
        if(game.keys_pressed[key]){
            var angle = MOVE_KEY_MATRIX[key]; 
            if(!(angle==undefined)){
                this.set_angle(angle)
                return this.move(angle);
            }
        } 
    }, this);
    return true;
};

exports.roam = function(world, events){
    if(!this.move(Math.floor((Math.random()*4))*90)) this.consume_move();
    return false;
};

exports.do_nothing = function(world, events){
    this.end_turn(); 
    return true;
};

exports.do_nothing.skip = true;

