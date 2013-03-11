var gamejs = require('gamejs');
var utils = require('./utils');
var events = require('./events');
var constants = require('./constants');
var game = require('./game').game;
var Map = require('./maps').Map;
var particle = require('./particle');
var eventify = require('./lib/events').eventify;


var WMap = exports.WMap = function(world, ignore_doors, solid_positions){
    //helper for astar calculation
    this.world = world;
    this.ignore_doors = ignore_doors;
    this.solid_positions;
    
    this.adjacent = function(origin) {
        var retv = [];
        constants.ADJACENT.forEach(function(mod){
            var p = utils.mod(origin, mod);
            if(this.world.map.is_wall(p)) return;
            if(!this.world.objects.by_pos(p).some(function(obj){
                if(!obj.threadable && !(this.ignore_doors && obj.is_type('door'))) return true;
                if(this.solid_positions){
                    for(var i=0;i<this.solid_positions.length;i++){
                        if(utils.cmp(this.solid_positions[i], p)) return true;
                    }   
                }
            }, this)) retv.push(p);
        }, this);
        return retv;
    };
    
    this.estimatedDistance = function(pointA, pointB) {
        return gamejs.utils.vectors.distance(pointA, pointB);
    };

    this.actualDistance = function(pointA, pointB) {
        return gamejs.utils.vectors.distance(pointA, pointB);
    };
};


var World = exports.World = function(options){
    utils.process_options(this, options, {
        map: utils.required,
        turn: 1
    });
    eventify(this);
    this.scene = null;
    this.objects = new utils.Collection();
    this.event_frames = [];
    this.particles = [];
    this.persistent_events = new events.PersistentEventFrame();
    this.turn_queue = new utils.Collection(); //all objects that can act, in sequence of their action
    this.turn_pending_queue = new utils.Collection();; //all objects that have not yet acted this turn
    this.current_actor = null;
};

World.load = function(data){
    var world = new World({
        turn: data.turn,
        map: Map.load(data.map)
    });
    
    //spawn in all objects
    data.objects.forEach(function(obj){
        world.spawn(obj.name, obj.properties);
    });
    
    
    //on load actions (actions that might require other objects to be spawned in first, eg inventory load)
    data.objects.forEach(function(data){
       props = data.properties;
       obj = world.objects.by_id(props.id);
       for(var key in obj){
           if(key.search('post_load')==0){
               obj[key](props);
           }
       } 
    });
    
    world.turn_queue = world.load_collection(data.turn_queue);
    world.turn_pending_queue = world.load_collection(data.turn_pending_queue);
    if(data.current_actor) world.current_actor = world.objects.by_id(data.current_actor);
    return world;
};

World.prototype.get_adjacent_objects = function(pos, type){
    var retv = new utils.Collection();
    constants.ADJACENT.forEach(function(mod){
        this.objects.by_pos(utils.mod(pos, mod)).forEach(function(obj){
           if(!type || obj.is_type(type)) retv.add(obj); 
        });
    }, this);
    return retv;
}

World.prototype.load_collection = function(obj_ids, cls){
    if(!cls) cls = utils.Collection;
    var retv = new cls();
    obj_ids.forEach(function(id){
        retv.add(this.objects.by_id(id)); 
    }, this);
    return retv;
};

World.prototype.serialize = function(){
    var objects = [];
    this.objects.iter(function(obj){
        objects.push(obj.serialize()); 
    });
    
    var retv = {
        'map': this.map.serialize(),
        'turn': this.turn,
        'objects':objects,
        'turn_queue':this.turn_queue.serialize(),
        'turn_pending_queue':this.turn_pending_queue.serialize(),
        'current_actor':this.current_actor? this.current_actor.id : null
        
    };
    return retv; 
};


World.prototype.update_objects = function(deltams){
    this.objects.iter(function(object){
         object.update(deltams);
    });
};

World.prototype.set_current_actor = function(actor){
    if(this.current_actor){
        this.current_actor.fire('end_turn');
    }
    this.current_actor = actor;
    this.current_actor.start_turn();
}

World.prototype.shift_turn_queue = function(){
    if(this.turn_pending_queue.len()){ //next actor this turn
        this.set_current_actor(this.turn_pending_queue.pop()); 
    } else {
        if(this.turn_queue.len()){ //next turn
            this.turn_pending_queue = this.turn_queue.clone();
            this.set_current_actor(this.turn_pending_queue.pop()); 
            this.turn += 1;
            return true;
        }
    }
    return false;
};

World.prototype.process_turn = function(events){
    if(!this.turn_queue.len()) return;
    var process_queue = true;
    while(process_queue){
        if(this.current_actor) {
            var skip = false;
            while(!skip && !this.events_in_progress() && this.current_actor.can_act()){
                skip = this.current_actor._controller.act(events);
                this.update_events(0);
            } 
            process_queue = !this.current_actor.can_act();
        }
        if(process_queue) this.shift_turn_queue();
        this.update_events(0);
        if(this.events_in_progress()) break;
    }
};

World.prototype.update = function(deltams, events){
    if(!this.events_in_progress()) this.process_turn(events);
    this.update_events(deltams);
    this.update_objects(deltams);
    this.update_particles(deltams);
};

World.prototype.spawn = function(type, options){
    options = options || {};
    var obj = game.objectmanager.e(type, options.id);
    var key;
    for(key in options){
        if(options.hasOwnProperty(key)){
            obj[key] = options[key];
        }
    }
    obj.init(this);
    this.objects.add(obj);
    obj.fire('spawn');
    this.fire('spawn', [obj]);
    if(obj._controller) this.turn_queue.add(obj);
    return obj;
};

World.prototype.add_event = function(event, new_frame){
    if(event.finished) return;
    if(this.event_frames.length==0 || new_frame){
        var frame = new events.EventFrame();
        frame.add(event);
        this.event_frames.push(frame);
    } else {
        this.event_frames[0].add(event);
    }
};

World.prototype.update_events = function(deltams){
    if(this.event_frames.length){
        this.event_frames[0].update(deltams);
        while(this.event_frames.length && this.event_frames[0].is_finished()){
            this.event_frames.shift(0);
        }
    }
    this.persistent_events.update(deltams);
};

World.prototype.events_in_progress = function(){
    return this.event_frames.length > 0;  
};


World.prototype.is_tile_transparent = function(position){
    transparent = true;
    if(!this.map.is_wall(position)){
        this.objects.by_pos(position).some(function(object){
           if(!object.transparent){ 
               transparent = false;
               return true;
           }
        });
    } else transparent = false;
    return transparent;
}

World.prototype.get_route = function(from, to, ignore_doors, solid_positions){
    /*
     * ignore_doors - if true, subclasses of door will not be counted as solid
     * solid_positions - an optional list of extra positions to be considered as unpassable
     */
     return gamejs.pathfinding.astar.findRoute(new WMap(this, ignore_doors, solid_positions), from, to, 100);
};

World.prototype.is_tile_threadable = function(position){
   var threadable = !this.map.is_wall(position);
   if(threadable){
       this.objects.by_pos(position).forEach(function(object){
           threadable = object.threadable && threadable;
       });
   } 
   return threadable;
};

World.prototype.spawn_particle = function(name, options){
   var cls = particle.particles[name];
   if(cls){
       this.particles.push(new cls(options));
   }  else{
       console.log('Unknown particle: '+name);
   }
};

World.prototype.update_particles = function(deltams){
    var particles = [];
    this.particles.forEach(function(p){
        p.update(deltams);
        if(!p.is_finished()) particles.push(p); 
    });
    this.particles = particles;
};
