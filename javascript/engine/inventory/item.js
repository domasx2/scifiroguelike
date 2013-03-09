var objects = require('../objects');
var game = require('../game').game;
var actions = require('../actions');

game.objectmanager.c('item', {
    '_requires': 'object',
    
    'pick_up':function(obj){
        if(obj.inventory && obj.inventory.has_space()){
            obj.inventory.add(this);
            this.hide();
            obj.fire('pick_up_item', [this]);
            return true;
        }
        return false;
    },
    
    'drop':function(actor){
        actor.inventory.remove(this);
        this.teleport(actor.position);
        this.fire('drop', [actor]);
        actor.fire('drop_item', [this]);
    },
    
    'inventory_action_drop':actions.action({
        'name':'Drop',
        'condition':function(actor){
            return actor.inventory.has(this);
        },
        'do':function(actor){
            this.drop(actor);
        } 
    })
});

game.objectmanager.c('clip', {
    'ammo':10,
    'capacity':10,
    'ammo_type':'generic',
    '_requires':'item',
    
    'get_ammo':function(){
        return this.ammo;
    }
});

game.objectmanager.c('usesammo', {
     'clip_type':'clip', //object type for clip
     '_clip':null,
     
     
     'get_extra_inventory_action_load':function(actor){
         //create a bound action for each type of available clip
            var types_covered = {};
            var mt;
            var retv = [];
            if(!this._clip){
                actor.inventory.iter(function(obj){
                    if(obj.is_type(this.clip_type)){
                        mt = obj.main_type();
                        if(!types_covered[mt]){
                            types_covered[mt] = true;
                            retv.push(actions.bound_action(this, {
                                data:obj,
                                name:function(actor, clip){
                                    return 'load '+clip.ammo_type;
                                },
                                'do':function(actor, clip){
                                    var clip = actor.inventory.get_by_type(clip.main_type());
                                    if(!clip){
                                       console.log('No longer able to load clip', clip);
                                       return; 
                                    } 
                                    this.load_clip(clip, actor);
                                }
                            }));
                        }
                    }
                }, this);   
           }
           return retv;
     },
     
     'get_ammo':function(){
         if(this._clip) return this._clip.get_ammo();
         return 0;
     },
     
     'unload_clip':function(actor){
        if(!this._clip){
            console.log('Unloading not loaded!', this);
            return;
        }
        if(!actor.inventory.by_id(this.id)){
            console.log('Unloading, but not in inventory!', this, actor);
            return;
        }
        if(actor.inventory.has_space()){
            var clip = this._clip;
            actor.inventory.add(clip);
            this._clip = null;
            this.fire('unload', [clip]);
            
        }
     },
     
     'inventory_action_unload_clip':actions.action({
            condition:function(actor){
                return this._clip  && actor.inventory.has_space(); 
            },
            name: function(actor){
                return 'unload'
            },
            'do':function(actor){
                return this.unload_clip(actor);
            }
     }),
     
     'use_ammo':function(count){
         //returns number of ammunition used
         if(!count) count = 1;
         if(!this._clip){
             console.log('Using ammo, but no clip!', this);
             return 0;
         }  
         
         var retv = Math.min(count, this._clip.ammo);
         this._clip.ammo -= retv;
         if(!this._clip.ammo <=0){
             this._clip.destroy();
             this.fire('unloaded', [this._clip]);
             this._clip = null;
             this.fire('empty');  
         }
         return retv;
     },

     'load_clip': function(clip, actor){
         //why am I ashamed of this defensive programming? 
         if(this._clip){
            console.log('Already loaded!', this);
            return;  
         }
         if(!clip.is_type(this.clip_type)){
             console.log('Wrong clip type!', this, clip);
             return;
         } 
         if(!actor.inventory.has(clip)){
             console.log('Actor does not have clip in inventory!', actor, clip);
         }
         actor.inventory.remove(clip);
         this._clip = clip;
         this.fire('reloaded', [clip]);
       
     },
     
    'serialize_clip':function(data){
        data.clip = this._clip ? this._clip.id : null;
    },
    
    'post_load_clip':function(data){
        if(data.clip) this._clip = this.world.objects.by_id(data.clip);
        else this._clip = null;
    },
});

game.objectmanager.c('equippable', {
   'equipped': false,
   '_slot': 'weapon',
   
   'init_equippable':function(){
       this.on('drop', function(owner){
           if(this.equipped) this.unequip(owner);
       }, this);
   },
   
   'inventory_action_equip':actions.action({
        'name':'Equip',
        'condition':function(actor){
            return !this.equipped && actor._equipment_slots && actor._equipment_slots.indexOf(this._slot) != -1;
        },  
        'do':function(actor){
            this.equip(actor);
        }
   }),
   
   'inventory_action_unequip':actions.action({
        'name':'Unequip',
        'condition':function(actor){
            return this.equipped;
        },  
        'do':function(actor){
            this.unequip(actor);
        }
   }),
   
   
   
   'equip': function(owner){
        if(!this.equipped){
            owner.inventory.iter(function(item){
                if(item.is_type('equippable') && item._slot==this._slot && item.equipped) item.unequip(owner);
            }, this)
            this.equipped = true;
            this.fire('equip', [owner]);
            owner.fire('equip', [this]);
        } else{
            console.warning("Equipping already equipped item??", this, owner);
        }
   },
   'unequip': function(owner){
       if(this.equipped){
           this.equipped = false;
           this.fire('unequip', [owner]);
           owner.fire('unequip', [this]);
       }else{
           console.warning('Unequipping equipped item??', this, owner);
       }
   }
});
