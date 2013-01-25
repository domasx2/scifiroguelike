var gamejs = require('gamejs');
var utils = require('./utils');
var events = require('./events');
var constants = require('./constants');
var game = require('./game').game;

var World = exports.World = function(options){
    utils.process_options(this, options, {
        map: utils.required
    });
  
    this.objects = [];
    this.event_frames = [];
    this.persistent_events = new events.PersistentEventFrame();
    
    this.turn_queue = []; //all objects that can act, in sequence of their action
    this.turn_pending_queue = []; //all objects that have not yet acted this turn
    this.current_actor = null;
    
    this.turn = 1; //current turn number
};

World.prototype.update_objects = function(deltams){
    this.objects.forEach(function(object){
         object.update(deltams);
    });
};

World.prototype.get_object_by_id = function(id){
    for(var i=0;i<this.objects.length;i++){
        if(this.objects[i].id===id) return this.objects[i];
    }
    return null;
};

World.prototype.get_objects_in_tile = function(position){
    var retv = [];
    this.objects.forEach(function(object){
        if(object.position[0] == position[0] && 
           object.position[1] == position[1] ) retv.push(object)  
    });
    return retv;
};


World.prototype.shift_turn_queue = function(){
    if(this.turn_pending_queue.length){ //next actor this turn
        this.current_actor = this.turn_pending_queue.shift(); 
    } else {
        if(this.turn_queue.length){ //next turn
            this.turn_pending_queue = this.turn_queue.slice(0);
            this.current_actor = this.turn_pending_queue.shift(); 
            this.turn += 1;
            return true;
        }
    }
    return false;
};

World.prototype.process_turn = function(events){
    var process_queue = true;
    
    while(process_queue){
        if(this.current_actor) process_queue = this.current_actor.act(this, events);
        else process_queue = true;
        
        if(process_queue){
            process_queue = !this.shift_turn_queue();
        }
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
    this.objects.push(obj);
    if(!obj.act.skip) this.turn_queue.push(obj);
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

World.prototype.is_tile_threadable = function(position){
   var threadable = !this.map.is_wall(position);
   if(threadable){
       this.get_objects_in_tile(position).forEach(function(object){
           threadable = object.threadable && threadable;
       });
   } 
   return threadable;
};
