var gamejs = require('gamejs');

exports.ADJACENT = [
    [0, 0],
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1]
];

exports.MOVE_MOD = {  0: [ 0, -1],
                     90: [ 1,  0],
                    180: [ 0,  1],
                    270: [-1,  0]};
                    
exports.MOVE_MOD_LEFT = {
      0: [ -1, 0],
     90: [ 0,  -1],
    180: [ 1,  0],
    270: [0,  1]
}

exports.MOVE_MOD_RIGHT = {
      0: [ 1, 0],
     90: [ 0,  1],
    180: [ -1,  0],
    270: [0,  -1]
};
                    
exports.INVERSE  = {
    0: 180,
    90: 270,
    270: 90,
    180: 0
};
                    

var MOVE_KEY_MATRIX = exports.MOVE_KEY_MATRIX = {};
MOVE_KEY_MATRIX[gamejs.event.K_RIGHT] = 90;
MOVE_KEY_MATRIX[gamejs.event.K_LEFT] = 270;
MOVE_KEY_MATRIX[gamejs.event.K_UP] = 0;
MOVE_KEY_MATRIX[gamejs.event.K_DOWN] = 180;