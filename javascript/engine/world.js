var gamejs = require('gamejs');
var utils = require('./utils');
var events = require('./events');
var constants = require('./constants');
var game = require('./game').game;
var objects = require('./objects');
var Map = require('./maps').Map;


var World = exports.World = function(options){
    utils.process_options(this, options, {
        map: utils.required,
        turn: 1
    });
  
    this.objects = new utils.Collection();
    this.event_frames = [];
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

World.prototype.shift_turn_queue = function(){
    if(this.turn_pending_queue.len()){ //next actor this turn
        this.current_actor = this.turn_pending_queue.pop(); 
    } else {
        if(this.turn_queue.len()){ //next turn
            this.turn_pending_queue = this.turn_queue.clone();
            this.current_actor = this.turn_pending_queue.pop(); 
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
        if(this.current_actor) process_queue = this.current_actor.act(this, events);
        if(process_queue) this.shift_turn_queue();
        if(this.events_in_progress()) break;
    }
};

World.prototype.update = function(deltams, events){
    if(!this.events_in_progress()) this.process_turn(events);
    this.update_events(deltams);
    this.update_objects(deltams)
};

World.prototype.spawn = function(type, options){
    var obj = game.objectmanager.e(type, options.id);
    var key;
    for(key in options){
        if(options.hasOwnProperty(key)){
            obj[key] = options[key];
        }
    }
    obj.init(this);
    this.objects.add(obj);
    if(!obj.act.skip) this.turn_queue.add(obj);
    return obj;
};

World.prototype.add_event = function(event, new_frame){
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
        if(this.event_frames[0].is_finished()){
            this.event_frames.shift(0);
        }
    }
    this.persistent_events.update(deltams);
};

World.prototype.events_in_progress = function(){
    return this.event_frames.length > 0;  
};

World.prototype.event_move = function(object, direction, no_wait){
    /*if possible, creates a move event for object and returns true.
    * if impossible (path blocked), returns false
    * 
    * no_wait - optional. if true, does not wait for this event to finish before initating next turn.
    * useful for AI creatures, so player is not forced to wait excessively
    */
    if(this.is_tile_threadable(utils.mod(object.position, constants.MOVE_MOD[direction]))){
        var event = new events.ObjectMoveEvent({
            direction: direction,
            object: object,
            owner: object
        });
        
        if(no_wait) this.persistent_events.add(event);
        else this.add_event(event);
        return true;
    }
    return false;
};

World.prototype.is_tile_transparent = function(position){
    if(!this.map.is_wall(position)){
        this.objects.by_pos(position).forEach(function(object){
           if(!object.transparent) return false;
        });
    } else return false;
    return true;
}

World.prototype.is_tile_threadable = function(position){
   var threadable = !this.map.is_wall(position);
   if(threadable){
       this.objects.by_pos(position).forEach(function(object){
           threadable = object.threadable && threadable;
       });
   } 
   return threadable;
};
