var gamejs = require('gamejs');
var utils = require('../utils');
var pieces = require('./pieces');
var game= require('../game').game;
/*
 * 
 * populates world with objects
 * 
 * 
 */

var Populator = exports.Populator = function Populator(options){
    //best class name evar
    
    utils.process_options(this, options, {
        'single_exit_door_density':1,
        'multi_exit_door_density':0.4,
        'door_type':'door',
        'rooms':{}
    });
    this.exits_processed = {};
};


Populator.prototype.fill_chest = function(generator, chest){
    var qty = generator.rnd.choose_probmap(this.loot.quantities);
    for(var i=0;i<qty;i++){
        chest.content.add(chest.world.spawn(generator.rnd.choose_probmap(this.loot.items)));
    }
};


Populator.prototype.select_safe_empty_tile = function(generator, piece, world, tiles){
    //select a safe empty tile from tiles that will not block the piece by filling it
    //tiles should belong to piece
    var i, k,c, pos,
        removed = [],
        gpos, exit1, exit2;
    while(tiles.length){
        i = generator.rnd.int(0, tiles.length-1);
        pos = tiles[i];
        gpos = piece.global_pos(pos);
       
        tiles.remove(i);
        //check that there are no objects in the tile
        if(world.objects.by_pos(gpos).length) continue;
        c=false;
        //if more than 1 exit, check that all are accessible
        if(piece.exits.length>1){
            for(i=0;i<piece.exits.length;i++){
                for(k=i+1;k<piece.exits.length;k++){
                    exit1 = piece.exits[i];
                    exit2 = piece.exits[k];

                    //make sure tile to add and all exits are 'solid'
                    removed = [gpos];
                    piece.exits.forEach(function(exit){
                        removed.push(piece.global_pos(exit[0]));
                    });

                    if(i==k) continue;
                    if(!world.get_route(piece.global_pos(utils.shift_back(exit1[0], exit1[1])),
                                        piece.global_pos(utils.shift_back(exit2[0], exit2[1])),
                                        false,
                                        removed)){
                        c=true;
                        break;                        
                    }
                }
                if(c) break;
            }
            if(c) continue;
        } 
        
        //make sure that no exit is blocked
        c = false;
        for(var i=0;i<piece.exits.length;i++){
            var exit= piece.exits[i];
            if(utils.cmp(utils.shift_back(exit[0], exit[1]), pos)
            || utils.cmp(exit[0], pos)) {
                c = true;
                break;
            }
             
        }
        if(c) continue;
        return pos;
        
    }
    return null;
};


Populator.prototype.populate = function(generator, world){
    generator.children.forEach(function(piece){
        if(utils.instance_of(piece,pieces.Room)) this._populate_room(generator, piece, world);
        else if(utils.instance_of(piece, pieces.Corridor)) this._populate_corridor(generator, piece, world);
        
        piece.exits.forEach(function(exit){
            var gpos = piece.global_pos(exit[0]);
            var hash = gpos[0]+'_'+gpos[1];
            if(!this.exits_processed[hash]){
                this.exits_processed[hash] = exit;
                this.process_exit(generator, world, gpos, exit[1], piece, exit[2]);
            } 
        }, this);
    }, this);
};

Populator.prototype._populate_room = function(generator, room, world){
    if(room.populate) room.populate(generator, this, world);
    else this.populate_room(generator, room, world);  
};

Populator.prototype.spawn_object = function(generator, world, objdescr, room){
    if(objdescr.prob && (generator.rnd.alea.random() > objdescr.prob)) return null;
    if(objdescr.filter){
        var filter = objdescr.filter;
        if(filter.min_exits && room && room.exits.length < filter.min_exits)  return null;
        if(filter.max_exits && room && room.exits.length > filter.max_exits) return null;
    }

    var position = [-1, -1];
    if(room){
        var position = this.select_safe_empty_tile(generator, room, world, room.get_non_wall_tiles());
        if(!position) return null;
        else {
            position = room.global_pos(position);
        }
    }
    
    var options = {
        'position':position
    }
    if(objdescr.options){
        options = gamejs.utils.objects.merge(options, objdescr.options);
    }
    
    var obj = world.spawn(objdescr.type, options);
    if(objdescr.content){
        objdescr.content.forEach(function(descr){
            var item = this.spawn_object(generator, world, descr);
            if(item) obj.content.add(item); 
        }, this);
    }
    
    return obj;
};

Populator.prototype.populate_room = function(generator, room, world){
    if(room.tag){
        var opts = this.rooms[room.tag];
        if(opts){
            if(opts.objects){
                opts.objects.forEach(function(objdescr){
                    this.spawn_object(generator, world, objdescr, room);
                }, this);
            }
        }
    }
};

Populator.prototype._populate_corridor = function(genrator, corridor, world){
    if(corridor.populate) corridor.populate(generator, this, world);
    else this.populate_corridor(generator, corridor, world);  
};

Populator.prototype.populate_corridor = function(genrator, corridor, world){
    
};

Populator.prototype.process_exit = function(generator, world, position, angle, piece1, piece2){
    if(piece1.exits.length==1 || piece2.exits.length==1){
        if(generator.rnd.maybe(this.single_exit_door_density)){
            world.spawn(this.door_type, {
                position: position,
                angle: angle 
            });
        }
    } else {
        if(generator.rnd.maybe(this.multi_exit_door_density)){
            world.spawn(this.door_type, {
                position: position,
                angle: angle 
            });
        }
    }
};

game.populators['base'] = Populator;
