var game = require('../game').game;
var objutils = require('./utils');
var utils = require('../utils');
var actions = require('./actions');
var events = require('../events');
var random = require('../random');
var gamejs = require('gamejs');
var vec = gamejs.utils.vectors;

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
     
     'ammo_per_shot':1,
     
     'can_attack_usesammo':function(owner, pos){
        return this.get_ammo()>=this.ammo_per_shot;  
     },
     
     
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
         if(this._clip.ammo <=0){
             this._clip.destroy();
             this.fire('unloaded', [this._clip]);
             this._clip = null;
             this.fire('empty');  
         }
         this.fire('use_ammo', [retv]);
         return retv;
     },

    'init_use_ammo_on_shoot':function(){
        this.on(['swing', 'shoot'], function(){
            this.use_ammo(this.ammo_per_shot);      
        }, this);
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

game.objectmanager.c('weapon', {
    '_requires':'item equippable',
    'base_accuracy':0.7,
    'max_accuracy':0.95,
    'min_accuracy':0.01,
    'base_damage':1,
    'shots':1,
    'hits_per_shot':1,
    'fire_rate':60,
    'damage_type':'kinetic',
    '_event':null,
    
    //returns hit chance of owner attacking position with this weapon
    'calc_hit_chance':function(owner, object){
        var acc =  this.base_accuracy;
        this.iter_prefixed('calc_hit_chance', function(fn){
            acc = fn.apply(this, [owner, object, acc]);
        }, this);
        return Math.max(Math.min(acc, this.max_accuracy), this.min_accuracy);
    },
    
    //get damage this weapon does
    'calc_damage':function(owner, object){
        return new objutils.Damage({
            'amount':this.base_damage,
            'type':this.damage_type,
            'owner':owner,
            'weapon':this 
        });
    },
    
    //call this when this weapon wielded by owner hits object
    'hit':function(owner, object){
        object.hit(this.calc_damage(owner, object));
        this.fire('hit', [owner, object]);
    },
    
    //can this weapon, wielded by owner, be used to attack pos?
    //action points have to be validated externally!
    // this only validates conditions related to weapon itself, eg range
    'can_attack':function(owner, object){
        var can = true;
        this.iter_prefixed('can_attack', function(fn){
            if(!fn.apply(this, [owner, object])) can = false;
        }, this);
        return can;
    },
    
    'attack':function(owner, object){
        var event = new this._event({
            'owner':owner,
            'target':object,
            'weapon':this
        });
        this.world.add_event(event);
    }
    

});

game.objectmanager.c('melee_weapon', {
    '_requires':'weapon',
    '_event': events.MeleeAttackEvent,
    'can_attack_melee':function(owner, object){
        return owner.is_adjacent_to(object);
    },
    
    'swing':function(owner, target){
        if(this.can_attack(owner, target)){
               var chance = this.calc_hit_chance(owner, target);
               var c = random.generator.random();
               if(c<=chance){
                   console.log('hit!');
                   this.hit(owner, target);
               }else {
                   console.log('miss!');
               }
               this.fire('swing', [owner, target]);
        } else {
            console.log('Swinging, but can no longer attack!', owner, target)
        }
    }
});


game.objectmanager.c('ranged_weapon', {
   '_requires':'weapon',
   '_event':events.RangedAttackEvent,
   '_particle_type':'projectile',
   '_particle_opts':{
        'sprite_name':'bullet',
        'velocity':10
   },
   'spread':2,
   'effective_range':5,
   'max_range':10,
   
   'calc_spread':function(){
       return this.spread;
   },
   
   'spawn_particle':function(owner, target_position){
          var opts = {
              pos_px_from:owner.get_center_position_px(),
              pos_px_to:utils.pos_px(target_position)
          };
          for(var key in this._particle_opts){
              opts[key] = this._particle_opts[key];
          }
          return this.world.spawn_particle(this._particle_type, opts);
   },
   
   'can_attack_ranged':function(owner, object){
       return owner.can_see(object.position) && vec.distance(owner.position, object.position)<=this.max_range;
   },
   
   'calc_hit_chance_ranged_falloff':function(owner, object, acc){
       var dist = owner.get_distance_to(object);
       if(dist<=this.effective_range){
           return acc - 0.25 * (dist/this.effective_range);
       }else {
           return acc - 0.9 * (dist/this.max_range);
       }
   },
   
   'shoot':function(owner, target){
       if(this.can_attack(owner, target)){
           for(var i=0;i<this.hits_per_shot;i++) {
               var dir = utils.direction_raw(owner.position, vec.add(target.position, [0.5, 0.5]));
               var spread = this.calc_spread();
               var rspread = random.generator.float(-spread, spread) 
               var target_pos = vec.add(owner.position,  vec.rotate([0, -vec.distance(owner.position, target.position)], gamejs.utils.math.radians(dir+rspread)));
               var particle = this.spawn_particle(owner, target_pos);
               var event = new events.ProjectileEvent({
                  'weapon':this,
                  'owner':owner,
                  'target_pos':target_pos,
                  'target':target ,
                  'particle':particle
               });
               this.world.add_event(event);
           }
           this.fire('shoot', [owner, target, event]);
       }else{
           console.log('shooting, but!');
       }
   }
});
