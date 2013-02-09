var gamejs = require('gamejs');
var base = require('./base');
var utils = require('../utils');
var game = require('../game').game;
var sprite = require('../sprite');
var eventify = require('../lib/events').eventify;

var Item = exports.Item = function(item){
    eventify(this);
    this.item = item; //object
    this.sprite = sprite.new_sprite(this.item.sprite_name+'_inventory');
    this.dom = $('<div class="ui-item"></div>');
    this.dom.data('itemid', this.item.id);
    var surface = new gamejs.Surface(gamejs.utils.vectors.multiply(game.ts, game.settings.UI_SCALE));
    var s = this.sprite.get_surface();
    surface.blit(s, new gamejs.Rect([0, 0], surface.getSize()), new gamejs.Rect([0, 0], s.getSize()));
    this.dom.append(surface._canvas);
    this.dom.click($.proxy(function(event){
        this.fire('click', [event]);
    }, this));
}

var ItemContainer = exports.ItemContainer = function(options){
    utils.process_options(this, options, {
        'collection':utils.required,
        'owner':utils.required,
    });
    
    ItemContainer.superConstructor.apply(this, [options]);
    
    this.collection.on('add', this.update_items, this);
    this.collection.on('remove', this.update_items, this);
    
    this.items_by_id={};
    this.update_items();
};

gamejs.utils.objects.extend(ItemContainer, base.Dialog);

ItemContainer.prototype.update_items = function(){
    this.collection.iter(function(item){
        if(!this.items_by_id[item.id]){
            var idom = new Item(item);
            idom.on('click', this.click_item, this);
            this.dialog.append(idom.dom);
            this.items_by_id[item.id]=idom;
        }
    }, this);
    
    gamejs.utils.objects.keys(this.items_by_id).forEach(function(item_id){
        if(!this.collection.by_id(item_id)){
            this.items_by_id[item_id].dom.remove();
            delete this.items_by_id[item_id];
        }
    }, this);
};

ItemContainer.prototype.click_item = function(item){
    
};

var Inventory = exports.Inventory = function(options){
    options.title = 'Inventory';
    options.id='inventory';
    Inventory.superConstructor.apply(this, [options]);
};

gamejs.utils.objects.extend(Inventory, ItemContainer);

Inventory.prototype.click_item = function(item, event){
    var actions = item.item.get_inventory_actions(this.collection);
    var ctxmenu = new base.ContextMenu({
        items: actions,
        position: [event.pageX, event.pageY]
    });
    ctxmenu.on('click_item', function(ctxmenu, action){
        item.item[action](this.owner);
    }, this);  
};




var GroundItems = exports.GroundItems = function(options){
    options.title = 'Ground';
    options.id='ground-items';
    GroundItems.superConstructor.apply(this, [options]);
};

gamejs.utils.objects.extend(GroundItems, ItemContainer);

GroundItems.prototype.update_items = function(){
    ItemContainer.prototype.update_items.apply(this);
    if(this.collection.len()){
        this.show();
    }  else {
        this.hide();
    }
};

GroundItems.prototype.click_item = function(item){
    item.item.pick_up(this.owner);
};
