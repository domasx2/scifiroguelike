var objects = require('../objects');
var game = require('../game').game;

game.objectmanager.c('item', {
    '_requires': 'object',
    
    'pick_up':function(obj){
        if(obj.inventory && obj.inventory.has_space()){
            obj.inventory.add(this);
            this.hide();
            obj.fire('pick_up_item', [this]);
        }
    },
    
    'drop':function(obj){
        obj.inventory.remove(this);
        this.teleport(obj.position);
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
                if(!action.available || action.available(this, inventory)){
                    actions.push(action);
                } 
            }
        }
        return actions;
    } 
});

game.objectmanager.c('equippable', {
   'equipped': false,
   '_slot': 'weapon',
   
   '_inventory_action_equip':{
       'label':'Equip',
       'action':'equip',
       'available':function(item, inventory){
           return !item.equipped && inventory.owner._equipment_slots && inventory.owner._equipment_slots.indexOf(item._slot) != -1;
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
