var objects = require('../objects');
var game = require('../game').game;

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
    
    'drop':function(obj){
        obj.inventory.remove(this);
        this.teleport(obj.position);
        this.fire('drop', [obj]);
        obj.fire('drop_item', [this]);
    },
    
    '_inventory_action_drop':{
         'label':'Drop',
         'action':'drop'
    },
    
    'get_inventory_actions': function(inventory){
        var actions = [];
        for(var key in this){
            if(key.search('_inventory_action')==0){
                action = this[key];
                if(!action.available || action.available.apply(this, [inventory])){
                    actions.push(action);
                } 
            }
        }
        return actions;
    } 
});

game.objectmanager.c('usesammo', {
     'max_capacity':10,
     'ammo': 0,     //current ammo
     'clip_type':'clip', //object type for clip
     
     
     '_inventory_action_reload':{
           'label':'Reload',
           'action':'reload',
           'available':function(inventory){
               return (this.ammo < this.max_capacity) && inventory.get_by_type(this.clip_type);
           }
      },

     'reload': function(owner){
         var clip = owner.inventory.get_by_type(this.clip_type);
         if(clip){
             clip.destroy();
             this.ammo = this.max_capacity;
             this.fire('reloaded');
         } else {
             console.warning('Reloading, but have no clip:', this);
         }
     } 
});

game.objectmanager.c('equippable', {
   'equipped': false,
   '_slot': 'weapon',
   
   'init_equippable':function(){
       this.on('drop', function(owner){
           if(this.equipped) this.unequip(owner);
       }, this);
   },
   
   '_inventory_action_equip':{
       'label':'Equip',
       'action':'equip',
       'available':function(inventory){
           return !this.equipped && inventory.owner._equipment_slots && inventory.owner._equipment_slots.indexOf(this._slot) != -1;
       }
   },
   
   '_inventory_action_unequip':{
       'label':'Unequip',
       'action':'unequip',
       'available':function(item, inventory){
           return item.equipped;
       }
   },

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
