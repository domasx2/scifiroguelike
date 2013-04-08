var gamejs = require('gamejs');
var constants = require('./constants');
var game = require('./game').game;
var utils = require('./utils');
var actions = require('./objects/actions');
var MOVE_KEY_MATRIX = constants.MOVE_KEY_MATRIX;

/*
 *  CONTROLLER
 *  base controller class
 */

var Controller = exports.Controller = function(owner){
    this.owner = owner;

    //put all your saveable data here and make sure it's serializable
    this.data = {
        destination: null
    };
};

Controller.prototype.act = function(events){
    this.owner.end_turn();
    return true;
};

Controller.prototype.cancel_destination = function(){
    this.data.destination = null;
};

Controller.prototype.act_on_destination = function(pos){
    return false;
};

Controller.prototype.try_moving_towards = function(pos){
    var path = this.owner.vision.get_path(this.owner.position, pos),
        npos;
    if(path){
        npos = utils.get_path_next_step(path);
        if(npos){
            return this.owner.move(utils.direction(this.owner.position, npos));
        }
    }
    return false;
};

Controller.prototype.proceed = function(){
    //proceed towards destination.
    //if next tile is empty, move into it
    //if next tile is not empty but also the destination, act on it
    //else unable to proceed, cancel destination
    var moved = false;
    if(this.data.destination && (this.owner.can_move())){
        var path = this.owner.vision.get_path(this.owner.position, this.data.destination);
        if(path){
            var npos = utils.get_path_next_step(path);
            if(npos){
                if(utils.cmp(npos, this.data.destination)) moved = this.act_on_destination(npos);
                if(!moved) moved = this.owner.move(utils.direction(this.owner.position, npos));
            } 
        }
    }
    if(!moved){
        this.cancel_destination();
    }
    return moved;
};

/*
 * PLAYER CONTROLLER
 * interprets player input
 */

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
    if(utils.cmp(pos, this.data.destination)){
        var actions = this.collect_actions(pos);
        if(actions.length){
            if(actions.length==1){
                actions[0].do(this.owner);
            } else {
                this.owner.world.scene.spawn_action_context_menu(
                    this.owner.world.scene.view.screen_position(utils.pos_px(pos)), 
                    actions);
            }
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
    this.data.destination = pos;  
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

/*
 * HOSTILE CONTROLLER
 *
 *not the 'awake' mechanic:
  creature is initially 'asleep', and only 'wakes up' if seen by an active hostile
  thus, calculations are not performed until creature seen by player
 */

var HostileMeleeController = exports.HostileMeleeController = function(owner){
    HostileMeleeController.superConstructor.apply(this, [owner]);
    this.data.awake = false;
    this.owner.on('seen_by', function(owner, obj){
        if(obj.enemies_with(this.owner)){
            this.data.awake = true;
            this.data.last_known_enemy_position = obj.position;   
        } 
    }, this);
};

gamejs.utils.objects.extend(HostileMeleeController, Controller);

HostileMeleeController.prototype.last_known_enemy_position = null; 

HostileMeleeController.prototype.attack_nearest = function(){
    var enemy,
        owner = this.owner,
        pos,
        path,
        positions,
        i;

    //update vision and get closest visible enemy
    owner.vision.update();
    enemy = owner.vision.objects.closest(owner.position, function(obj){
        return obj.is_type('creature') && obj.alive && obj.enemies_with(owner);
    });

    if(enemy){
        this.data.last_known_enemy_position = enemy.position;
    } 
    //if am adjacent to enemy, try attacking
    if(enemy && owner.is_adjacent_to(enemy)) {
        if(owner.can_attack(enemy)){
            owner.attack(enemy);
            return true;
        } 
    } else {
        //enemy in sight but not adjacent - try moving adjacent to it
        if(enemy){
            positions = utils.get_adjacent_positions(enemy.position);
            for(i=0;i<positions.length;i++){
                pos = positions[i];
                if(owner.world.is_tile_threadable(pos) && this.try_moving_towards(pos)) return true;
            }
        //no enemy in sight, but have last known position
        }else if(this.data.last_known_enemy_position){
            if(!utils.cmp(this.data.last_known_enemy_position, owner.position) 
                && this.try_moving_towards(this.data.last_known_enemy_position)) return true;
            //failing, set it to null
            else {
                this.data.last_known_enemy_position = null;
                // TODO: maybe implement something smarter when lost sight of enemy? 
                //attempt to chace to next exit in this general direction?
            }
        }  
    }

    //if no other suitable action found, end turn;
    owner.end_turn();
    return true;

};

HostileMeleeController.prototype.act = function(events){
    if(this.data.awake){
        return this.attack_nearest();
    } else {
        this.owner.end_turn();
        return true;
    }
    
};



