var gamejs = require('gamejs');
var constants = require('./constants');
var game = require('./game').game;
var utils = require('./utils');
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
                }
            }
        } 
    }, this);
    return moved;
};

PlayerController.prototype.mouse_action = function(events){
    events.forEach(function(event){
        if(event.type == gamejs.event.MOUSE_DOWN){
            var world_pos = this.owner.world.scene.view.world_pos(event.pos);
            if(world_pos){
                this.destination = world_pos;
                console.log(this.destination);
            }
        }
    }, this);
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

