var utils = require('../utils');
var gamejs = require('gamejs');


var next_piece_id = 0;

var Piece = exports.Piece = function(options){
    utils.process_options(this, options, {
        size: utils.required,
        position: [0, 0],
        parent: null,
        max_exits: 10
    });
    this.id = next_piece_id ++;
    this.walls = new utils.Array2D(this.size, true);  
    this.perimeter = [];
    this.exits = [];
    this.children = [];
};

Piece.prototype.global_pos = function(pos){
    //translate local position to parent position
    return [this.position[0]+pos[0], this.position[1]+pos[1]];
};

Piece.prototype.local_pos = function(pos){
    //translate parent position to local position
    return [pos[0]-this.position[0], pos[1]-this.position[1]];
};

Piece.prototype.get_center_pos = function(){
    return [parseInt(this.size[0]/2), parseInt(this.size[1]/2)];  
};

Piece.prototype.perimeter_by_facing = function(facing){
    var retv = [];
    for(var i=0;i<this.perimeter.length;i++){
        if(this.perimeter[i][1]==facing){
            retv.push(this.perimeter[i]);
        }
    }  
    return retv;
};

Piece.prototype.rect = function(){
      return new gamejs.Rect(this.position, this.size);
};

Piece.prototype.add_perimeter = function(from, to, facing){
    utils.iter2drange(from, to, function(pos){
        this.perimeter.push([pos, facing]);
    }, this);
};

Piece.prototype.intersects = function(piece){
    return this.rect().collideRect(piece.rect());
};

Piece.prototype.remove_perimeter = function(intersecting_rect){
    var p;
    var n = [];
    for(var i=0;i<this.perimeter.length;i++){
        p = this.perimeter[i];
        if(!intersecting_rect.collidePoint(p[0])) n.push(p);
    }
    this.perimeter = n;
};


Piece.prototype.add_piece = function(piece, position){
    for(var i=0;i<this.children.length;i++) if(this.children[i].id==piece.id) return;
    piece.parent = this;
    if(position) piece.position = position;
    this.children.push(piece);
    this.paste_in(piece);
};

Piece.prototype.paste_in = function(piece){
    for(var y=0;y<piece.size[1]; y++){
        for(var x=0; x<piece.size[0];x++){
            var p = piece.walls.get([x, y]);
            if(p==false) this.walls.set([piece.position[0]+x, piece.position[1]+y], false);
        }
    }
};

Piece.prototype.add_exit = function(exit, room){
      this.walls.set(exit[0], false);
      if(this.parent)this.parent.paste_in(this);
      this.exits.push([exit[0], exit[1], room]);
};

Piece.prototype.center_pos = function(piece){
    //returns pos of 'piece' at which it would be centered inside this piece. OK??
    return [parseInt(this.size[0]/2 - piece.size[0]/2), parseInt(this.size[1]/2 - piece.size[1]/2)]; 
};


var Room = exports.Room = function(options){
    this.room_size = options.size
    options.size = [options.size[0]+2, options.size[1]+2];
    
    utils.process_options(this, options, {
         symmetric: false //for lack of better word.. i  
    });
    
    Room.superConstructor.apply(this, [options]);
    this.walls.square([1, 1], this.room_size, false, true);

    if(!this.symmetric){ //any point at any wall can be exit
        this.add_perimeter([1, 0], [this.size[0]-2, 0], 0);
        this.add_perimeter([0, 1], [0, this.size[1]-2], 270);
        this.add_perimeter([1, this.size[1]-1], [this.size[0]-2, this.size[1]-1], 180);
        this.add_perimeter([this.size[0]-1, 1], [this.size[0]-1, this.size[1]-2], 90);
    }else{ //only middle of each wall can be exit
        var w = parseInt(Math.floor(this.size[0]/2));
        var h = parseInt(Math.floor(this.size[1]/2));
        this.perimeter = [
            [[w, 0], 0],
            [[this.size[0]-1, h], 90],
            [[w, this.size[1]-1], 180],
            [[0, h], 270]
        ];
        
    }
    
};

gamejs.utils.objects.extend(Room, Piece);

var Corridor = exports.Corridor = function(options){
    utils.process_options(this, options, {
       length: 2,
       facing: 0,
    });
    options.max_exits = 4;
    options.size = (this.facing == 0 || this.facing == 180) ? [1, this.length] : [this.length, 1];
    
    Corridor.superConstructor.apply(this, [options]);
    
    this.perimeter = [];
    
    var w = this.size[0]-1;
    var h = this.size[1]-1;
    
    //special perimeter: allow only 4 exit points, to keep this corridor corridor-like..
    if(this.facing==0) this.perimeter = [        [[1, h], 180], [[0, 1],  270], [[2, 1],    90], [[1, 0],    0] ];
    else if(this.facing==90) this.perimeter = [   [[0, 1], 270], [[w-1, 0],  0], [[w-1, 2], 180], [[w, 1],   90] ];
    else if(this.facing==180) this.perimeter = [ [[1, 0],   0], [[2, h-1], 90], [[0, h-1], 270], [[1, h],  180] ];
    else if(this.facing==270) this.perimeter = [ [[w, 1],  90], [[1, 2],  180], [[1, 0],     0], [[0, 1],  270] ];
     
};

gamejs.utils.objects.extend(Corridor, Room);

