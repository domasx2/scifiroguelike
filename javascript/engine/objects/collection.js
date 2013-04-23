var eventify = require('../lib/events').eventify;
var gamejs = require('gamejs');
var utils = require('../utils');

var Collection = exports.Collection = function(objects){
    /*
    Uuse this to store a collection of objects.
    provides 'add', 'remove' events,
    automatically drops objects that are destroyed
    */
    this.objects = [];  
    this.objects_by_id = {};
    eventify(this);
    if(objects){
        objects.forEach(function(obj){
            this.add(obj); 
        }, this);
    }
};

Collection.prototype.get_by_type = function(type){
    for(var i=0;i<this.objects.length;i++){
        if(this.objects[i].is_type(type)) return this.objects[i];
    }
    return null;
};

Collection.prototype.add = function(obj){
    this.objects.push(obj);
    this.objects_by_id[obj.id] = obj;
    this.fire('add', [obj]);
    obj.on('destroy', this.remove, this);
};

Collection.prototype.remove = function(obj){
    for(var i=0;i<this.objects.length;i++){
        if(this.objects[i].id == obj.id){
            this.objects.splice(i, 1);
            break;
        }
    }
    delete this.objects_by_id[obj.id];
    this.fire('remove', [obj]);
    obj.off('destroy', this.remove, this);
};


Collection.prototype.by_id = function(id){
    return this.objects_by_id[id];
};

Collection.prototype.has = function(obj){
   return this.objects_by_id[obj.id] ? true : false;  
};

Collection.prototype.iter = function(cb, context){
    this.objects.forEach(cb, context);  
};

Collection.prototype.clone = function(){
    var retv = new Collection();
    retv.objects = this.objects.slice(0);
    retv.objects_by_id = utils.clonedict(this.objects_by_id);
    return retv;
};

Collection.prototype.pop = function(){
    var obj = this.objects[0];
    this.remove(obj);
    return obj; 
};

Collection.prototype.len = function(){
    return this.objects.length;  
};

Collection.prototype.by_pos = function(pos, type){
    var retv=[];
    this.iter(function(obj){
        if((obj.position[0] == pos[0]) && (obj.position[1]==pos[1])
        && (!type || obj.is_type(type))) retv.push(obj);
    });
    return retv;
};


Collection.prototype.serialize = function(){
    var retv = [];
    this.iter(function(obj){
        retv.push(obj.id);
    }); 
    return retv;
};

Collection.prototype.filter = function(filter_fn){
    //returns array of objects filtered by filter_fn
    var retv = [];
    this.iter(function(obj){
        if(filter_fn(obj)) retv.push(obj);
    });
    return retv;
};

Collection.prototype.closest = function(position, filter_fn){
    //returns an object closest to position, or null. filter_fn - optional, to fitler objects by.
    var objects = [],
        retv = null,
        mdist = 1000000,
        obj,
        dist;
    if(filter_fn) objects = this.filter(filter_fn);
    else objects = this.objects;
    for(var i=0;i<objects.length;i++){
        obj = objects[i];
        dist = obj.get_distance_to(position);
        if(dist < mdist){
            mdist = dist;
            retv = obj;
        }
    }
    return retv;
};

var Container = exports.Container = function(objects){
    Container.superConstructor.apply(this, [objects]);

    this.on('add', function (container, obj) {
        if(!obj.is_type('item')){
            throw 'omg putting non item into a container';
        }
        obj.fire('put_into_container', [container]);
    });
};

gamejs.utils.objects.extend(Container, Collection);

var Inventory = exports.Inventory = function (owner) {
    this.owner = owner;
    Inventory.superConstructor.apply(this, []);
};

gamejs.utils.objects.extend(Inventory, Container);

Inventory.prototype.has_space = function(){
    return this.owner.inventory_size > this.len();
};

Inventory.prototype.get_equipped_item = function(slot){
    var item;
    for(var i=0;i<this.objects.length;i++){
        item = this.objects[i];
        if(item.equipped && item._slot == slot) return item;
    }
    return null;
}

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

gamejs.utils.objects.extend(GroundItems, Collection);

GroundItems.prototype.update_items = function(){
    var items = new Collection(this.relative_to.world.objects.by_pos(this.relative_to.position, 'item'));
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


