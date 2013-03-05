var engine = require('../engine');
var gamejs = require('gamejs');

var Level = exports.Level = function(options){
    Level.superConstructor.apply(this, [options]);
};

gamejs.utils.objects.extend(Level, engine.mapgen.Populator);


Level.prototype.populate_room = function(generator, room, world){
    if(room.exits.length==1){
        var poses = room.get_inner_perimeter();
        if(poses.length){
            var pos = room.global_pos(generator.rnd.choose(poses));
            var chest = world.spawn(this.chest_type, {'position':pos});
            engine.utils.align_obj_to_wall(chest);
            this.fill_chest(generator, chest);
        }
    }
};
