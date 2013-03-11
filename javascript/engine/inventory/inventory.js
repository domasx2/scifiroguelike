var gamejs = require('gamejs')
var utils = require('../utils');

var Inventory  = exports.Inventory = function(owner){
    this.owner = owner;
    Inventory.superConstructor.apply(this, []);
};

gamejs.utils.objects.extend(Inventory, utils.Collection);

Inventory.prototype.has_space = function(){
    return this.owner.inventory_size > this.len();
};

Inventory.prototype.get_equipped_items = function(){
    var retv = [];
    this.iter(function(item){
        if(item.equipped) retv.push(item);
    })
    return retv;
};

//always contains items on the ground relative to provided object
var GroundItems = exports.GroundItems = function(relative_to){
    this.relative_to = relative_to;
    GroundItems.superConstructor.apply(this, []);
    this.relative_to.on(['teleport', 'pick_up_item', 'drop_item'], this.update_items, this);
    this.update_items();
    
};

gamejs.utils.objects.extend(GroundItems, utils.Collection);

GroundItems.prototype.update_items = function(){
    var items = new utils.Collection(this.relative_to.world.objects.by_pos(this.relative_to.position, 'item'));
    var rem = [];
    this.iter(function(item){
       if(!items.has(item)) rem.push(item); 
    });
    rem.forEach(function(item){
        this.remove(item);
    }, this);
    
    items.iter(function(item){
        if(!this.has(item)) this.add(item);
    }, this);
}
