var gamejs = require('gamejs');
var constants = require('./constants');
var game = require('./game').game;
var utils = require('./utils');
var actions = require('./objects/actions');
var MOVE_KEY_MATRIX = constants.MOVE_KEY_MATRIX;


var Controller = exports.Controller = function(owner){
    this.owner = owner;
    this.destination = null;
};

Controller.prototype.act = function(events){
    this.owner.end_turn();
    return true;
};

Controller.prototype.cancel_destination = function(){
    this.destination = null;
};

Controller.prototype.act_on_destination = function(pos){
    return false;
};

Controller.prototype.proceed = function(){
    //proceed towards destination.
    //if next tile is empty, move into it
    //if next tile is not empty but also the destination, act on it
    //else unable to proceed, cancel destination
    var moved = false;
    if(this.destination && (this.owner.can_move())){
        var path = this.owner.vision.get_path(this.owner.position, this.destination);
        if(path){
            var npos = null;
            while(path.from){
                npos = path.point;
                path = path.from;
            }
            if(npos){
                if(utils.cmp(npos, this.destination)) moved = this.act_on_destination(npos);
                if(!moved) moved = this.owner.move(utils.direction(this.owner.position, npos));
            } 
        }
    }
    if(!moved){
        this.cancel_destination();
    }
    return moved;
};

var PlayerController = exports.PlayerController = function(owner){
    PlayerController.superConstructor.apply(this, [owner]);
    
    if(this.owner.vision){
        //cancel move order if an enemy comes into view
        this.owner.vision.objects.on('add', function(objects, obj){
            if(obj.is_type('creature') && obj.enemies_with(this.owner) && obj.alive){
                this.cancel_destination();
            }
        }, this);
        
        //cancel move order if no starting turn enemies are visible
        this.owner.on('start_turn', function(){
            this.owner.vision.objects.objects.some(function(obj){
                if(obj.is_type('creature') && obj.enemies_with(this.owner) && obj.alive){
                    this.cancel_destination();
                    return true;
                }
            }, this);
        }, this);
    }
};

gamejs.utils.objects.extend(PlayerController, Controller);

PlayerController.prototype.act_on_destination = function(pos){
    if(utils.cmp(pos, this.destination)){
        var actions = this.collect_actions(pos);
        if(actions.length){
            if(actions.length==1){
                actions[0].do(this.owner);
                console.log('did action');
            } else {
                this.owner.world.scene.spawn_action_context_menu(
                    this.owner.world.scene.view.screen_position(utils.pos_px(pos)), 
                    actions);
            }
            console.log('canceled destination');
            this.cancel_destination();
            return true;
        }
    }
    return false;
};

PlayerController.prototype.keyboard_move = function(events){
    var moved = false;

    //end turn on space
    if(events.some(function(event){
        if(event.type==gamejs.event.KEY_DOWN && event.key==gamejs.event.K_SPACE){
            this.owner.end_turn();
            return true;
        }
    }, this)) return true;

    //move if direction key is held down
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
    var objs = this.owner.world.objects.by_pos(world_pos);
    objs.forEach(function(obj){
        retv.push.apply(retv, obj.get_available_actions('action', this.owner)); 
    }, this);
    return retv;
};


PlayerController.prototype.mouse_action = function(events){
    events.forEach(function(event){
        if(event.type == gamejs.event.MOUSE_DOWN){
            var world_pos = this.owner.world.scene.view.world_pos(event.pos);
            if(world_pos){
                var _actions = this.collect_actions(world_pos);
                if(_actions.length==1){
                    _actions[0].do(this.owner);
                }else{
                    if(_actions.length==0){
                        var move_action = new actions.BoundAction({"position":world_pos}, actions.move);
                        if(move_action.condition(this.owner)) _actions.push(move_action);
                    }
                    if(_actions.length==1){
                        _actions[0].do(this.owner);
                    }else if(_actions.length>1) {
                        this.owner.world.scene.spawn_action_context_menu(event.pos, _actions);
                    } else {
                        //console.log('no actions available.');
                    }
                }
            }
        }
    }, this);
};

PlayerController.prototype.go_to = function(pos){
    this.destination = pos;  
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

