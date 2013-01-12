var gamejs = require('gamejs');
var utils  = require('./utils');
var world  = require('./world');
var view   = require('./view');
var events = require('./events');

var Scene = exports.Scene = function(options){
    utils.process_options(this, options, {
    });
};

var WorldScene = exports.WorldScene = function(options){
    WorldScene.superConstructor.apply(this, [options]);
    utils.process_options(this, options, {
        'world': world
    });

    this.view = new view.View({
        world: this.world
    });
    
    this.event_frames = [];
};

gamejs.utils.objects.extend(WorldScene, Scene);

WorldScene.prototype.add_event = function(event, new_frame){
    if(this.event_frames.length==0 || new_frame){
        var frame = new events.EventFrame();
        frame.add(event);
        this.event_frames.push(frame);
    } else {
        this.event_frames[0].add(event);
    }
};

WorldScene.prototype.update_events = function(deltams){
    if(this.event_frames.length){
        this.event_frames[0].update(deltams);
        if(this.event_frames[0].is_finished()){
            this.event_frames.shift(0);
        }
    }  
};

WorldScene.prototype.events_in_progress = function(){
    return this.event_frames.length > 0;  
};

WorldScene.prototype.draw = function(surface){
    this.view.surface = surface;
    this.view.draw_layer(this.world.map.floor_layer);
    this.view.draw_layer(this.world.map.wall_layer);
    this.world.objects.forEach(function(object){
        object.draw(this.view);
    }, this);
};

WorldScene.prototype.move_object = function(object, direction){
    this.add_event(new events.ObjectMoveEvent({
        direction: direction,
        object: object
    }));
};

WorldScene.prototype.update = function(deltams){
    this.update_events(deltams);
    this.world.objects.forEach(function(object){
         object.update(deltams);
    });
};



