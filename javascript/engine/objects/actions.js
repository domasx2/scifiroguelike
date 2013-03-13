var Action = exports.Action = function (options){
    //this is were object interaction action is implemented
    this._NOT_A_PROPERTY = true;
    
    this.data = null;
    
    this.condition = function(actor){
        return true;
    }
    
    this.name = function(actor){
        return 'Some action'
    }
    
    this.do = function(actor){
        console.log('Performed some action!')
    }
    
    this._condition = function (owner, actor){
        return this.condition.apply(owner, [actor, this.data]);
    }
    
    this._do = function(owner, actor){
        return this.do.apply(owner, [actor, this.data]);
    }
    
    this._name = function(owner, actor){
        if(typeof this.name !== "function") return this.name;
        else return this.name.apply(owner, [actor, this.data]);
    }
    
    for(key in options){;
        this[key] = options[key];
    }

}

var BoundAction = exports.BoundAction = function(obj, action){
    //binds action to an object, for convenience.
    this._NOT_A_PROPERTY = true;
    this.obj = obj;
    this.action = action;
    
    this.do = function(actor){
        return this.action._do(this.obj, actor);
    };
    
    this.name = function(actor){
        return this.action._name(this.obj, actor);
    };
    
    this.condition = function(actor){
        return this.action._condition(this.obj, actor);
    }
};

var action = exports.action = function(options){
    return new Action(options);
};

exports.bound_action = function(obj, options){
    return new BoundAction(obj, action(options));
};

exports.openclose = action({
        'condition':function(actor){
            var retv = actor.is_adjacent_to(this) && !this.locked;
            if(!retv) return;
            
            //see if any solid is stuck here
            this.world.objects.by_pos(this.position).some(function(obj){
                if((!obj.threadable || obj.solid) && obj.id!=this.id) {
                    retv = false;
                    return true;
                }
            }, this);
            return retv;
        },
        'name':function(actor){
            if(!this.is_open) return 'open '+this._name;
            else return 'close '+this._name;
        },
        'do':function(actor){
             if(!this.is_open)this.open(actor);
             else this.close(actor);
        }
});

exports.attack = action({
   'condition':function(actor){
       return actor.id!=this.id && actor.can_attack(this) && this.alive;
   },
   'name':'attack',
   'do':function(actor){
       return actor.attack(this);
   }
});

exports.move = action({
   'condition':function (actor){
       return actor.can_move() && actor.has_explored(this.position) && actor.world.is_tile_threadable(this.position);
   },
   'name':'go to',
   'do':function(actor){
       actor._controller.go_to(this.position);
   } 
});

