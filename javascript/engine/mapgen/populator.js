var gamejs = require('gamejs');
var utils = require('../utils');
var pieces = require('./pieces');

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
        'enemies':10,
        'enemy_types':[],
        'loot':{} //type, propability
        
    });
    this.exits_processed = {};
};

Populator.prototype.door_type = 'door';
Populator.prototype.chest_type = 'chest';


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



Populator.prototype.populate_room = function(generator, room, world){
    
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
