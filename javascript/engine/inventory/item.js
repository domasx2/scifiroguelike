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
    }
});
