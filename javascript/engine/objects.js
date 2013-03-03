var gamejs = require('gamejs');
var utils = require('./utils');
var sprite = require('./sprite');
var game = require('./game').game;
var Vision = require('./vision').Vision;
var Inventory = require('./inventory/inventory').Inventory; 
var controllers = require('./controllers');
var eventify = require('./lib/events').eventify;
var constants = require('./constants');
var events = require('./events');
var actions = require('./actions');


var Object = {
    
    //PROPERTIES,
    '_previous_position': null, //this is needed to know when to draw objects that are 
                                //moving into fog of war/unexplored, and is set by 
                                //move event
    'position':[-1, -1],
    'angle':0,
    'sprite_name':'', //base name for sprite
    'sprite':'static', //currently active sprite
    'threadable':true,      //can it be stood/waled on?
    'transparent':true, //can it be seen through?
    'solid': false,     //can projectiles pass through?
    'vision_range':0, 
    'static':true, //is it visible while in fog of war?
    '_controller': null,
    'z':10,
    
    '_name':'Object',
    '_description':'This could be anything!',
    
    //METHODS
    'init':function(world){
        this.world = world;
        eventify(this);
        this._sprites = {};
        this.set_sprite(this.sprite, true);
        this.vision = null;
        
        if(this.vision_range){
            this.vision = new Vision(this.world, this);
            /*
             * so we need to suppress objects coming into view events on initial vision calc
             * and then remove suppression when objects finish spawning in (first turn)
             * this can propably be done better, but cant figure out now 
             */
            this.vision.objects._suppress_events = true;
            this.vision.update();
            function desuppress(){
                this.vision.objects._suppress_events = false;
                this.off('start_turn', desuppress, this);
            } 
            this.on('start_turn', desuppress, this);
        }
        
        var val;
        for(key in this){
            val = this[key];
            if(key!='init' && key.search('init')==0){
                this[key](world);
            }
            
            //convert actions to bound action
            if(val && utils.instance_of(val, actions.Action)) this[key] = new actions.BoundAction(this, val);
        }
        
        if(this._controller){
            this._controller = new this._controller(this);
        }
    },
    
    //used by dragons for obscure magic rituals
    'transparency_block':function(looking_from){
         return false;  
    },
    
    'get_z':function(scene){
        return this.z;
    },
    
    'destroy':function(){
        this.fire('destroy');  
    },
    
    'get_adjacent_items':function(){
        return this.world.get_adjacent_objects(this.position, 'item');  
    },
    
    'set_angle':function(angle){
        this.angle = angle;
        if(this.active_sprite) this.active_sprite.angle = angle;
    },
    
    'get_position_px': function(){
        return utils.pos_px(this.position);  
    },
    
    'draw': function(view){
        if(this.active_sprite) this.active_sprite.draw(view);
    },
    
    'update': function(deltams){
        if(this.active_sprite) this.active_sprite.update(deltams);
        
        for(key in this){
            if(key!='update' && key.search('update')==0){
                this[key](world);
            }
        }
    },
    
    'has_explored':function(pos_or_obj){
        var retv =false;
        if(this.vision){
            if(pos_or_obj.position){
                retv = this.vision.explored.get(pos_or_obj.position);
                if(!retv && pos_or_obj._previous_position) retv = this.vision.explored.get(pos_or_obj._previous_position);
            }
            else retv = this.vision.explored.get(pos_or_obj);
        }
        return retv;
    },

    'can_see': function(pos_or_obj){
        var retv =false;
        if(this.vision){
            if(pos_or_obj.position){
                retv = this.vision.visible.get(pos_or_obj.position);
                if(!retv && pos_or_obj._previous_position) retv = this.vision.visible.get(pos_or_obj._previous_position);
            }
            else retv = this.vision.visible.get(pos_or_obj);
        }
        return retv;
    },
    
    'is_adjacent_to':function(obj){
        var dx = Math.abs(obj.position[0]-this.position[0]);
        var dy = Math.abs(obj.position[1] - this.position[1]);  
        return (dx == 0 && dy == 1) || (dx==1 && dy==0);
    },
    
    'hide': function(hide){
        this.teleport([-1, -1]);  
    },

    'teleport':  function(position){
        var oldpos = this.position;
        this.position = position;
        this.snap_sprite();
        if(this.vision) this.vision.update();
        this.fire('teleport', [oldpos, position]);
        this.world.fire('teleport', [this, oldpos, position])
    },
    
    'absolute_position':function(relative_position){
        return [this.position[0]+relative_position[0], this.position[1]+relative_position[1]];
    },
    
    'teleport_relative':  function(delta_position){
        this.teleport([this.position[0]+delta_position[0], this.position[1]+delta_position[1]]);
    },
    
    'set_sprite': function(type, snap){
        if(type=='') type='static';
        var prev = this.active_sprite;
        if(!this._sprites[type]){
            this._sprites[type] = sprite.new_sprite(this.sprite_name+'_'+type);
        }
        this.active_sprite = this._sprites[type];
        if(!this.active_sprite) return;
        this.active_sprite.position = prev? prev.position.slice(0): this.get_position_px();
        this.active_sprite.angle = prev? prev.angle : this.angle;
        this.active_sprite.reset();
        if(snap) this.snap_sprite();
        return this.active_sprite;
    },
    
    'snap_sprite': function(){
        if(this.active_sprite){
            this.active_sprite.position = this.get_position_px();
            this.active_sprite.angle = this.angle;
        }  
    },
    
    '_on_property_change':function(property, new_value, old_value){
        if(this.fire){
            this.fire('set_'+property, [new_value, old_value]);
            this.world.fire('object_set_'+property, [this, new_value, old_value]); 
        }
    }
    
    
};

game.objectmanager.c('object', Object);


game.objectmanager.c('alive', {
   'max_health':100,
   'health':100,
   'alive':true
});

var Creature = {
    'team':'neutral',
    'threadable':false,
    'static':false,
    'vision_range':10,
    'inventory_size':10,
    'z':20,
    
    'speed_move': 2,
    'speed_act':1,
    
    'moves_left':2,
    'actions_left':1,
    'turn_in_progress': false,
    
    'can_act': function(){
        return this.moves_left + this.actions_left;  
    },
    
    'can_move':function(){
        return this.moves_left || this.actions_left;  
    },
    
    'end_turn':function(){
        //call this to end turn
        this.moves_left = 0;
        this.actions_left = 0;
    },
    
    'enemies_with': function(obj){
        //is this creature hostile towards obj and vice/versa?
        //TODO: substantiate.. teams, etc
        if(obj.id==this.id) return false;
        if(obj.is_type('creature')) return true;
        return false;
    },
    
    'start_turn':function(){
        //called by world on creatures turn start
        this.moves_left = this.speed_move;
        this.actions_left = this.speed_act;
        this.fire('start_turn');
    },
    
    'consume_move':function(){
        if(this.moves_left) this.moves_left--;
        else this.consume_action();
        this.fire('consume_move');
    },
    
    'consume_action':function(){
        if(this.actions_left) this.actions_left --;
        else console.log('Consuming action but no actions left!', this);
        this.fire('consume_action');
    },
    
    'move':function(direction){
        if(!(this.moves_left+this.actions_left)) {
            console.log('Trying to move but got no moves left!', this);
        }else{
            var old_pos = this.position.slice(0);
            var new_pos = utils.mod(this.position, constants.MOVE_MOD[direction]);
            if(this.world.is_tile_threadable(new_pos)){
                var event = new events.ObjectMoveEvent({
                    direction: direction,
                    object: this,
                    owner: this
                });
                
                this.consume_move();
                //finish move instantly if invisible
                if(!(this.world.scene.can_see(new_pos) || this.world.scene.can_see(old_pos))){
                    event.finish();
                } 
                this.world.add_event(event);
                this.fire('move', [new_pos]);
                return event;
            }
        }
        return false;
    },
    
    '_equipment_slots':['weapon', 'armor', 'helmet'],
    
    '_controller':controllers.roam,
    
    'init_inventory':function(world, data){
        this.inventory = new Inventory(this);
    },
    
    'serialize_inventory':function(data){
        data.inventory = this.inventory.serialize();
    },
    
    'post_load_inventory':function(data){
        data.inventory.forEach(function(objid){
            this.inventory.add(this.world.objects.by_id(objid));
        }, this);
    },
    
    '_requires':'object alive'  
}

game.objectmanager.c('creature', Creature);


/*CHEST
 * base chest object. contains items
 * 
 */
game.objectmanager.c('chest', {
    
    'sprite_name':'chest',
    'sprite':'full',
    'threadable':false,
    'is_open':false,
    'locked':false,
    
    '_name':'Chest',
    '_description':'It surely contains something awesome.',
    
    '_requires':'object',
    
    
    'init_content':function(){
        this.content = new utils.Collection();
        this.content.on('add', this.set_default_sprite, this);
        this.set_default_sprite();
    },
    
    'serialize_content':function(data){
        data.content = this.content.serialize();
    },
    
    'post_load_content':function(data){
        data.content.forEach(function(objid){
            this.content.add(this.world.objects.by_id(objid));
        }, this);
    },
    
    'set_default_sprite':function(){
        if(!this.is_open){
            if(this.content.len()) this.set_sprite('full');
            else this.set_sprite('empty');
        }else {
            this.set_sprite('open');
        }
    },
    
    'open':function(actor){
        this.set_sprite('open_anim').on('finish', this.set_default_sprite, this, true);
        this.opened_by = actor;
        this.is_open = true;
        this.fire('open', [actor]);
        actor.on('teleport', this.close, this, true);
    },
    
    'close':function(actor){
        this.set_sprite('close_anim').on('finish', this.set_default_sprite, this, true);
        this.is_open = false;
        this.fire('close', [this.opened_by]);
        if(this.opened_by) this.opened_by.off('teleport', this.close, this);
        this.opened_by = null;
    },
    
    'action_openclose':actions.openclose
});


game.objectmanager.c('door', {
    '_requires':'object',
   'is_open':false,
   'threadable':false,
   'transparent':false,
   'solid':true,
   'sprite_name':'door',
    'sprite':'closed',
   '_name':'door',
   '_description':'This is a solid looking door.',
   
   'get_z':function(protagonist){
       if(protagonist && protagonist.can_see(this)) return 100;
       return this.z;
    },
   
   'set_default_sprite':function(){
       this.set_sprite(this.is_open? 'open': 'closed');
   },
   
   'init_sprite':function(){
       this.set_default_sprite();
   },
   
   'init_prev_position':function(){
       this._previous_position = utils.mod(this.position, constants.MOVE_MOD_BACK[this.angle]);
   },
   
   'transparency_block':function(looking_from){
        //block vision if looking to the tile from door perspective
        if(this.angle == 0){
            if(looking_from[1]>this.position[1]) return true;
        }else if (this.angle==180){
            if(looking_from[1]<this.position[1]) return true;
        } else if(this.angle==90){
            if(looking_from[0]<this.position[0]) return true;
        } else if(this.angle==270){
            if(looking_from[0]>this.position[0]) return true;
        }
        return false;
    },
   
   'open':function(actor){
        this.set_sprite('open_anim').on('finish', this.set_default_sprite, this, true);
        this.is_open = true;
        this.transparent = true;
        this.threadable = true;
        this.solid = true;
        this.fire('open');
    },
    
    'close':function(actor){
        this.set_sprite('close_anim').on('finish', this.set_default_sprite, this, true);
        this.is_open = false;
        this.transparent = false;
        this.threadable = false;
        this.solid = false;
        this.fire('close');
    },
    
    'action_openclose':actions.openclose
});
