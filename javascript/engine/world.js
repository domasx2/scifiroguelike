var gamejs = require('gamejs');
var utils = require('./utils');
var events = require('./events');
var constants = require('./constants');

var World = exports.World = function(options){
    utils.process_options(this, options, {
        map: utils.required
    });
  
    this.objects = [];
    this.event_frames = [];
    
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

World.prototype.get_objects_in_tile = function(position){
    var retv = [];
    this.objects.forEach(function(object){
        if(object.position[0] == position[0] && 
           object.position[1] == position[1] ) retv.push()  
    });
    return retv;
};

World.prototype.process_turn = function(events){
    var process_queue = false;
    
    if(this.current_actor){
        process_queue = this.current_actor.controller.act(this, events);
    } else {
        process_queue = true;
    }
    
    if(process_queue){
        if(this.turn_pending_queue.length){ //next actor this turn
            this.current_actor = this.turn_pending_queue.shift(); 
        } else {
            if(this.turn_queue.length){ //next turn
                this.turn_pending_queue = this.turn_queue.slice(0);
                this.current_actor = this.turn_pending_queue.shift(); 
                this.turn += 1;
            }
        }
    }
};

World.prototype.update = function(deltams, events){
    if(!this.events_in_progress()) this.process_turn(events);
    this.update_events(deltams);
    this.update_objects(deltams)
};

World.prototype.spawn = function(object){
    this.objects.push(object);
    if(object.controller) this.turn_queue.push(object);
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
};

World.prototype.events_in_progress = function(){
    return this.event_frames.length > 0;  
};

World.prototype.event_move = function(object, direction){
    //if possible, creates a move event for object and returns true.
    //if impossible (path blocked), returns false
    if(!this.is_tile_solid(object.position_mod(constants.MOVE_MOD[direction]))){
        this.add_event(new events.ObjectMoveEvent({
            direction: direction,
            object: object
        }));
        return true;
    }
    return false;
};

World.prototype.is_tile_solid = function(position){
   var solid = this.map.is_wall(position);
   if(!solid){
       this.get_objects_in_tile(position).forEach(function(object){
            if(object.solid) solid = true; 
       });
   } 
   return solid;
};
