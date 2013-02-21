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


var Object = {
    
    //PROPERTIES,
    '_previous_position': null, //this is needed to know when to draw objects that are 
                                //moving into fog of war/unexplored, and is set by 
                                //move event
    'position':[0, 0],
    'angle':0,
    'sprite_name':'', //base name for sprite
    'sprite':'static', //currently active sprite
    'threadable':true,      //can it be stood/waled on?
    'transparent':true, //can it be seen through?
    'solid': false,     //can projectiles pass through?
    'vision_range':0, 
    'controller': null,
    'z':0,
    
   
    
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
        
        for(key in this){
            if(key!='init' && key.search('init')==0){
                this[key](world);
            }
        }
        
        if(this.controller){
            this.controller = new this.controller(this);
        }
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

    'can_see': function(pos){
        if(this.vision) return this.vision.visible.get(pos);
        return false;
    },
    
    'is_adjacent_to':function(obj){
        return (Math.abs(obj.position[0]-this.position[0]) == 1) || (Math.abs(obj.position[1] - this.position[1]) == 1);  
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
    
    'vision_perimeter':function(){
        var retv = [];
        if(this.vision_range){
            for(var mod_x=-1;mod_x<=1;mod_x+2){
                for(var mod_y=-1;mod_y<=1;mod_y+2){
                    for(var i=0;i<this.vision_range;i++){
                        retv.push([i*mod_x, (this.vision_range-i)*mod_y]);
                    }
                }
            }
        }
        return retv;
    },
    
    
};

game.objectmanager.c('object', Object);

var Creature = {
    'max_health':100,
    'health':100,
    'team':'neutral',
    'threadable':false,
    'vision_range':10,
    'inventory_size':10,
    'z':1,
    
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
    
    'controller':controllers.roam,
    
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
    
    '_requires':'object'  
}

game.objectmanager.c('creature', Creature);


game.objectmanager.c('chest', {
    
    'sprite_name':'chest',
    'sprite':'full',
    'threadable':false,
    'is_open':false,
    'locked':false,
    
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
        this.is_open = true;
        this.fire('open');
    },
    
    'close':function(actor){
        this.set_sprite('close_anim').on('finish', this.set_default_sprite, this, true);
        this.is_open = false;
        this.fire('close');
        if(this.opened_by) this.opened_by.off('teleport', this.close, this);
    },
    
    'adjacent_player_action':function(actor){
        if(!this.is_open){
            this.open();
            this.opened_by = actor;
            actor.on('teleport', this.close, this, true);
        }else {
            this.close();
        }
    }
});
