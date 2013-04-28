var gamejs = require('gamejs');
var utils = require('../utils');
var game = require('../game').game;
var sprite = require('../sprite');
var eventify = require('../lib/events').eventify;
var uiutils = require('./utils');
var game = require('../game').game;




game.uimanager.c('item_container', {
    '_requires': 'dialog',
    
    'collection': utils.required,
    'owner': utils.required,
    'item_class': 'item',
    'slot_class': 'item_slot',
    'rows': 2,
    'columns': 4,
    'table': null,
    'slots': [],

    '_last_dropped_slot': null, 

    'on_drop_move': function (item, slot) {
        if(item.slot && item.slot.container === slot.container){
            if(!slot.item){
                slot.attach(item);
            }
        }
    },
    
    'init_disable': function (scene) {
        uiutils.disable_between_turns(this.dom, this.owner);
    },
    
    'init_collection': function (scene) {
        this.items_by_id = {};
        this.collection.on('add', this.update_items, this);
        this.collection.on('remove', this.update_items, this);
        this.update_items();
    },

    'on_dialog_options': function (options) {
        options.width = this.columns * 42;
        options.resizable = false; 
    },

   'on_create_dom': function () {
        var x, y, row, slot;
        this.table = $('<div class="inventory-container"></div>');
        this.slots = [];
        this.dialog.append(this.table);
        this.dialog.css('height', 'auto');

        for(y=0; y<this.rows; y++){
            row = $('<div class="row"></div>');
            this.table.append(row);
            for(x=0;x<this.columns;x++){
                slot = this.scene.spawn_ui(this.slot_class, {
                    'container': this
                });
                row.append(slot.dom);
                this.slots.push(slot);
            }
        }
   },

   'get_free_slot': function () {
        if(this._last_dropped_slot && !this._last_dropped_slot.item) {
            return this._last_dropped_slot;
        } else {
            this._last_dropped_slot = null;
        }
        for(var i=0;i<this.slots.length;i++){
            if(!this.slots[i].item) return this.slots[i];
        }
        return null;
   },

   'add_item_to_dom': function (item) {
        var slot = this.get_free_slot();
        if(slot){
            slot.attach(item);
        } else {
            console.log('not enough slots!');
        }
    },

    'remove_item_from_dom': function (item) {
        item.dom.remove();
    },
    
    'update_items': function () {
        this.collection.iter(function(item){
            if(!this.items_by_id[item.id]){
                var idom = this.scene.spawn_ui(this.item_class, {
                    'item':item
                });
                idom.on('click', this.click_item, this);
                idom.on('rightclick', this.right_click_item, this);
                this.items_by_id[item.id]=idom;
                this.add_item_to_dom(idom);
            }
        }, this);
        
        gamejs.utils.objects.keys(this.items_by_id).forEach(function(item_id){
            if(!this.collection.by_id(item_id)){
                var item = this.items_by_id[item_id];
                item.slot.detach();
                item.destroy();
                delete this.items_by_id[item_id];
            }
        }, this);
    },

    'remove_ui_item': function (item) {

    },
    
    'click_item': function (item, event) {

    },

    'right_click_item': function (item, event) {

    }
});


game.uimanager.c('inventory', {
    '_requires': 'item_container',
    'title': 'Inventory',
    'item_class': 'inventory_item',
    'slot_class': 'inventory_slot',
    'rows': 5,
    'columns': 5,
   
    'remove_item_from_dom': function(item){
        item.dom.remove();
    },

    
});

game.uimanager.c('ground_items', {
    '_requires': 'item_container',
    'title': 'Ground',
    'update_items': function () {
        game.uimanager.components['item_container'].update_items.apply(this);
        if(this.collection.len()){
            this.show();
        }  else {
            this.hide();
        }
    },

    'on_drop_put':  function (item, slot){
        if(this.owner.inventory.has(item.item)){
            this.owner.drop(item.item);
        }
    },

    'click_item': function (item, event){
        this.owner.pick_up(item.item);

    }
    
});


game.uimanager.c('chest', {
   '_requires': 'item_container',
   'title': 'Chest',
   'chest_object': utils.required,
   'close_button': true,
    
   'init_events': function () {
       this.owner.on('teleport end_turn', this.destroy, this);
       this.chest_object.content.on('remove', this.on_item_removed, this);
   },

   'on_item_removed': function(content, item){
        if(!content.len()) {
            this.chest_object.close();
            this.destroy();
        }
   },

   'on_drop_put': function (item, slot) {
        if(this.owner.inventory.has(item.item)){
            this.chest_object.put(item.item);
        }
   },
   
   'destroy_events': function() {
       this.owner.off('teleport end_turn', this.destroy, this);
       this.chest_object.off('remove', null, this);
   },

   'click_item': function (item, event){
        this.chest_object.remove(item.item);
        this.owner.pick_up(item.item);
    }
   
});

