var gamejs = require('gamejs')
var item = require('./item');
var utils = require('../utils');

var Inventory  = exports.Inventory = function(object){
    this.object = object;
    Inventory.superConstructor.apply(this, []);
};

gamejs.utils.objects.extend(Inventory, utils.Collection);

Inventory.prototype.has_space = function(){
    return this.object.inventory_size > this.len();
}

//always contains items on the ground relative to provided object
var GroundItems = exports.GroundItems = function(relative_to){
    this.relative_to = relative_to;
    GroundItems.superConstructor.apply(this, []);
    this.relative_to.on(['teleport', 'pick_up_item', 'drop_item'], this.update_items, this);
    this.update_items();
    
};

gamejs.utils.objects.extend(GroundItems, utils.Collection);

GroundItems.prototype.update_items = function(){
    var items = this.relative_to.get_adjacent_items();
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
