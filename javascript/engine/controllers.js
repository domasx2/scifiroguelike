var gamejs = require('gamejs');
var constants = require('./constants');
var game = require('./game').game;
var utils = require('./utils');
var actions = require('./actions');
var MOVE_KEY_MATRIX = constants.MOVE_KEY_MATRIX;


var Controller = exports.Controller = function(owner){
    this.owner = owner;
    this.destination = null;
};

Controller.prototype.act = function(events){
    this.owner.end_turn();
    return true;
};

Controller.prototype.proceed = function(){
    var moved = false;
    if(this.destination && (this.owner.can_move())){
        var path = this.owner.vision.get_path(this.owner.position, this.destination);
        if(path){
            var npos = null;
            while(path.from){
                npos = path.point;
                path = path.from;
            }
            if(npos) moved = this.owner.move(utils.direction(this.owner.position, npos));
        }
        
    }
    if(!moved){
        this.destination = null;
    }
    return moved;
};

var PlayerController = exports.PlayerController = function(owner){
    PlayerController.superConstructor.apply(this, [owner]);
    
    if(this.owner.vision){
        //cancel move order if an enemy comes into view
        this.owner.vision.objects.on('add', function(objects, obj){
            if(obj.is_type('creature') && obj.enemies_with(this.owner)){
                this.destination = null;
            }
        }, this);
        
        //cancel move order if no starting turn enemies are visible
        this.owner.on('start_turn', function(){
            this.owner.vision.objects.objects.some(function(obj){
                if(obj.is_type('creature') && obj.enemies_with(this.owner)){
                    this.destination = null;
                    return true;
                }
            }, this);
        }, this);
    }
};

gamejs.utils.objects.extend(PlayerController, Controller);

PlayerController.prototype.keyboard_move = function(events){
    var moved = false;
    gamejs.utils.objects.keys(MOVE_KEY_MATRIX).some(function(key){
        if(game.keys_pressed[key]){
            var angle = MOVE_KEY_MATRIX[key]; 
            if(!(angle==undefined)){
                this.owner.set_angle(angle)
                moved = this.owner.move(angle);
                if(moved){
                    this.path = false;
                    return moved;
                }else {
                    var pos = utils.mod(this.owner.position, constants.MOVE_MOD[angle]);
                    var actions = this.collect_actions(pos);
                    if(actions.length==1){
                        if(actions[0].condition(this.owner)){
                            actions[0].do(this.owner);
                            return true;
                       
                        }
                    }
                }
            }
        } 
    }, this);
    return moved;
};

PlayerController.prototype.collect_actions = function(world_pos){
    var retv= [];
    var move_action = new actions.BoundAction({"position":world_pos}, actions.move);
    if(move_action.condition(this.owner)) retv.push(move_action);
   
    var objs = this.owner.world.objects.by_pos(world_pos);
    objs.forEach(function(obj){
        obj.iter_prefixed('action_', function(action){
            if(action.condition(this.owner)) retv.push(action);
        }, this);   
    }, this);
    return retv;
};


PlayerController.prototype.mouse_action = function(events){
    events.forEach(function(event){
        if(event.type == gamejs.event.MOUSE_DOWN){
            var world_pos = this.owner.world.scene.view.world_pos(event.pos);
            if(world_pos){
                var actions = this.collect_actions(world_pos);
                if(actions.length==1){
                    actions[0].do(this.owner);
                } else if(actions.length>1) {
                    this.owner.world.scene.spawn_action_context_menu(event.pos, actions);
                } else {
                    //console.log('no actions available.');
                }
            }
        }
    }, this);
};

PlayerController.prototype.go_to = function(pos){
    this.destination = pos;  
    this.owner.world.spawn_particle('sprite', {
        sprite_name:'action_move',
        z: 0,
        position_px:utils.pos_px(pos)
    });
};

PlayerController.prototype.act = function(events){
    return this.keyboard_move(events) || this.mouse_action(events) || this.proceed() || true;
};


var make_controller = exports.make_controller = function(act_fn){
    var retv = function(owner){
        Controller.apply(this, [owner]);
    };
    gamejs.utils.objects.extend(retv, Controller);
    retv.prototype.act = act_fn;
    return retv;
};


exports.roam = make_controller(function(events){
    if(!this.owner.move(Math.floor((Math.random()*4))*90)) this.owner.consume_move();
    return false;
});

