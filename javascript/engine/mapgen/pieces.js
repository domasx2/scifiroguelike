var utils = require('../utils');
var gamejs = require('gamejs');

var Piece = exports.Piece = function(options){
    utils.process_options(this, options, {
        size: utils.required,
        position: [0, 0],
        parent: null,
        children: new Array(),
        exits: new Array()
    });
    
    this.walls = new utils.Array2D(this.size, false);   
};

Piece.prototype.add_piece = function(piece, position){
    piece.parent = this;
    if(position) piece.position = position;
    this.children.push(piece);
    this.paste_in(piece);
};

Piece.prototype.paste_in = function(piece){
    for(var y=0;y<piece.size[1]; y++){
        for(var x=0; x<piece.size[0];x++){
            this.walls.set([piece.position[0]+x, piece.position[1]+y], piece.walls.get([x, y]));
        }
    }
};


var Corridor = exports.Corridor = function(options){
    
};

var Room = exports.Room = function(options){
    Room.superConstructor.apply(this, [options]);
    this.walls.square([0, 0], this.size, true);
};

gamejs.utils.objects.extend(Room, Piece);
