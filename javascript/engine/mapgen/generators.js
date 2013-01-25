var utils = require('../utils');
var gamejs = require('gamejs');
var pieces = require('./pieces');
var game = require('../game').game;
var random = require('../random');
var Map = require('../maps').Map;
var constants = require('../constants');

var Generator = exports.Generator = function(options){
    utils.process_options(this, options, {
        seed: null
    });
    
    this.rnd = new random.Generator(this.seed);
    this.start_pos = [0, 0];
    Generator.superConstructor.apply(this, [options]);
};


gamejs.utils.objects.extend(Generator, pieces.Piece);

Generator.prototype.reset = function(){
    this.children = [];
    this.walls = new utils.Array2D(this.size, true);   
};


Generator.prototype.get_map = function(){
    return new Map({
        size: this.size,
        walls: this.walls
    });  
};

Generator.prototype.generate = function(){
   //implement!!1  
};

Generator.prototype.fits = function(piece, position){
    var ok = false;
    var p, x, y;
    for(x=0;x<piece.size[0];x++){
        for(y=0;y<piece.size[1];y++){
            p=this.walls.get([position[0]+x, position[1]+y]);
            if(p===false || p===null) return false;    
        }
    }; 
    return true; 
};

Generator.prototype.join_exits = function(piece1, piece1_exit, piece2, piece2_exit){
      piece1.add_exit(piece1_exit);
      piece2.add_exit(piece2_exit);
      
      //find out where the rooms touch and remove from perimeter;
      var rect1 = new gamejs.Rect(piece1.position, piece1.size);
      var rect2 = new gamejs.Rect(piece2.position, piece2.size);
      
      var isc = piece1.rect().clip(piece2.rect);
      piece1.remove_perimeter(new gamejs.Rect(piece1.local_pos([isc.x, isc.y]), [isc.width, isc.height]));
      piece2.remove_perimeter(new gamejs.Rect(piece2.local_pos([isc.x, isc.y]), [isc.width, isc.height]));
};

Generator.prototype.join = function(piece1, piece2_exit, piece2, piece1_exit){

      //find a matching piece2 exit, if not supplied
      if(!piece1_exit) piece1_exit = this.rnd.choose(piece1.perimeter_by_facing(constants.INVERSE[piece2_exit[1]]));

      //piece 2 exit global position
      var piece2_exit_pos = piece1.global_pos(piece1_exit[0]);
      
      //piece 2 position
      var piece2_pos = [piece2_exit_pos[0]-piece2_exit[0][0], 
                        piece2_exit_pos[1]-piece2_exit[0][1]];
                        
      if(!this.fits(piece2, piece2_pos)){
          return false;
      };  
      this.join_exits(piece1, piece1_exit, piece2, piece2_exit);          
      this.add_piece(piece2, piece2_pos);
      
      return true;
      
};

Generator.prototype.valid_choices = function(choices){
    var retv = [];
    choices.forEach(function(child){
        if((child.exits.length < child.max_exits) && child.perimeter.length) retv.push(child);
    }, this);
    return retv;
};

var Dungeon = exports.Dungeon = function(options){
    Dungeon.superConstructor.apply(this, [options]);
    
    utils.process_options(this, options, {
        size: utils.required,
        min_room_size:[2, 2],
        max_room_size:[6, 6],
        max_corridor_length:6,
        min_corridor_length:2,
        max_exits_per_room: 4,
        corridor_density: 0.5, // corridors per room
        symmetric_rooms: false,
        interconnects: 1, //additional connections to make circular paths. not guaranteed
        max_interconnect_length:10
    });
    
    this.rooms = [];
    this.corridors = [];
    
};

gamejs.utils.objects.extend(Dungeon, Generator);

Dungeon.prototype.add_room = function(room, exit){
    var t = utils.t();
    
    //get a list of random pieces to choose from 

    var exit, room;
    var ok = false;
    var i = 0;
    while(!ok){
        
        choices = this.valid_choices(this.children);
        if(choices){
            var old_room = this.rnd.choose(choices);
            //choose a random exit for this room
            if(!exit) exit = this.rnd.choose(room.perimeter); 
            ok=this.join(old_room, exit, room);
        }
        if(i++ == 100){
            break;
        }
    }
    return ok;
    
    
};

Dungeon.prototype.new_room = function(){
    return new pieces.Room({
        size: this.rnd.vec(this.min_room_size, this.max_room_size),
        max_exits: this.max_exits_per_room,
        symmetric: this.symmetric_rooms
    })
};

Dungeon.prototype.new_corridor = function(){
    return new pieces.Corridor({
       length: this.rnd.int(this.min_corridor_length, this.max_corridor_length),
       facing: this.rnd.choose([0, 90, 180, 270])
    });  
};



Dungeon.prototype.add_interconnect = function(){
    //hash all perimeters
    var perims = {};
    var hash;
    var exit, p;
    this.children.forEach(function(child){
        if(child.exits.length < child.max_exits){
            child.perimeter.forEach(function(exit){
                 p = child.global_pos(exit[0]);
                 hash = p[0]+'_'+p[1];
                 perims[hash]=[exit, child];
            });
        };
    });

    //search each room for possible interconnect
    var room, k,  mod,  length, g, corridor, room2;
    for(var i=this.children.length-1;i--;i>=0){
        room = this.children[i];
        //if room has exits available
        if(room.exits.length < room.max_exits){
            
            //for every possible exit
            for(var k=0;k<room.perimeter.length;k++){
                exit = room.perimeter[k];
                p = room.global_pos(exit[0]);
                length = -1;
                
                //try advancing the tunnel further
                while(length <= this.max_interconnect_length){
                    
                    //check if space is not occupied
                    if(!this.walls.get(p) ||
                       !this.walls.get(utils.shift_left(p, exit[1])) ||
                       !this.walls.get(utils.shift_right(p, exit[1]))) break;
                    
                    //check if this tile is possible exit for another room
                    hash = p[0]+'_'+p[1];
                    if(perims[hash] && perims[hash][1].id!=room.id){
                        
                        room2=perims[hash][1];
                        //if exits do not directly join together, add a corridor inbetween
                        if(length > -1){
                            corridor = new pieces.Corridor({
                                'length':length,
                                facing:exit[1]
                            });
                            
                            if(this.join(room, corridor.perimeter[0], corridor, exit)){
                               this.join_exits(room2, perims[hash][0], corridor, corridor.perimeter[corridor.perimeter.length-1]);
                               return true;
                            } else{
                                return false;
                            }
                        } else {
                            //else just join the exits
                            this.join_exits(room2, perims[hash][0], room, exit);
                        } 
                        
                    }
                    p=utils.shift(p, exit[1]);
                    length++;
                   
                }
                
            }; 
        };
    }
    return false;  
};


Dungeon.prototype.generate = function(no_rooms){    
    //place first room in the middle
    
    var room = this.new_room();
    this.add_piece(room, this.center_pos(room));
    this.start_pos = room.global_pos([1, 1]);
    var no_corridors = parseInt(this.corridor_density * no_rooms);
    var k;
    while(no_corridors||no_rooms){
        k=this.rnd.int(1, no_corridors+no_rooms);
        if(k<=no_corridors){
            var corridor = this.new_corridor();
            this.add_room(corridor, corridor.perimeter[0]);
            no_corridors--;
        }  else {
            this.add_room(this.new_room());
            no_rooms--;
        }
    } 
    for(k=0;k<this.interconnects;k++) this.add_interconnect();
};
