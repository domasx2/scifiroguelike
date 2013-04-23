var gamejs = require('gamejs');
var utils = require('../utils');
var game = require('../game').game;
var sprite = require('../sprite');
var eventify = require('../lib/events').eventify;
var uiutils = require('./utils');
var game = require('../game').game;


game.uimanager.c('item', {
    '_requires': 'base',
    '_dropped': false,
    'item': null, //required
    'slot': null,

    'drag_start': function () {
        this._dropped = false;
    },

    'attach_to': function (slot){
        slot.attach(this);
    },

    'detach': function () {
        this.slot.detach(this);
    },

    'drag_stop': function () {
        if(!this._dropped){
            this.attach_to(this.slot);
        }
        this.dom.css({
            top: '0px',
            left: '0px'
        });
    },


    'create_dom': function () {
        var sprt = sprite.new_sprite(this.item.sprite_name+'_inventory'),
            surface, s;

        this.dom = $('<div class="ui-item"></div>').draggable({
            'start': $.proxy(this.drag_start, this),
            'stop': $.proxy(this.drag_stop, this)
        });

        this.dom.bind('item_drop', $.proxy(this.dropped, this));
        this.dom.data('itemid', this.item.id);
        this.dom.data('ui', this);
        surface = new gamejs.Surface(gamejs.utils.vectors.multiply(game.ts, game.settings.UI_SCALE));
        s = sprt.get_surface();
        surface.blit(s, new gamejs.Rect([0, 0], surface.getSize()), new gamejs.Rect([0, 0], s.getSize()));
        this.dom.append(surface._canvas);

        this.dom.bind('contextmenu', $.proxy(function(event){
            this.fire('rightclick', [event]);
            return false;
        }, this));

        this.dom.bind('click', $.proxy(function(event){
            this.fire('click', [event]);
            return false;
        }, this));

        if(this.item.is_type('equippable')){
            this.equip_tag = $('<div class="equip-tag">E</div>');
            this.equip_tag.appendTo(this.dom);
            this.item.on(['equip', 'unequip'], this.update_dom, this);
        }
        
        if(this.item.get_ammo){
            this.ammo_tag = $('<div class="ammo-tag"></div>');
            this.ammo_tag.appendTo(this.dom);
            this.item.on(['reloaded', 'unload', 'use_ammo'], this.update_dom, this);
        }
        this.update_dom();
    },

    'update_dom':function(){
        if(this.item.is_type('equippable')){
            if(this.item.equipped) this.equip_tag.show();
            else this.equip_tag.hide();
        }
        
        if(this.item.get_ammo){
            this.ammo_tag.html(this.item.get_ammo());
        }
    }
});

game.uimanager.c('item_slot', {
    '_requires': 'base',
    'container': null,
    'item': null,

    'attach': function (item) {
        if(item.slot) item.slot.detach();
        this.dom.append(item.dom);
        item.fire('attach', [this]);
        this.fire('attach', [item]);
        this.item = item;
        item.slot = this;
    },

    'detach': function () {
        var item = this.item;
        item.dom.appendTo($('body'));
        this.fire('detach', [item]);
        item.fire('detach', [this]);
        this.item = null;
        item.slot = null;
    },

    'on_drop': function (item){
        
    },

    'create_dom': function () {
        this.dom = $('<div class="inventory-slot"></div>').droppable({
            accept: '.ui-item'
        }).bind('drop', $.proxy(function(evt, ui){
            var item = ui.draggable.data('ui');
            this.container._last_dropped_slot = this;
            item.fire('drop', [this]);
            this.fire('drop', [item]);
            this.container.fire('drop', [item , this]);
        }, this));
    }  
});

game.uimanager.c('item_container', {
    '_requires': 'dialog',
    
    'collection': utils.required,
    'owner': utils.required,

    'rows': 2,
    'columns': 4,
    'table': null,
    'slots': [],

    '_last_dropped_slot': null, 

    'on_drop_move': function (item, slot) {
        if(item.slot.container === slot.container){
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
                slot = this.scene.spawn_ui('item_slot', {
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
                var idom = this.scene.spawn_ui('item', {
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

    'add_ui_item':function(ui_item, slot){
        if(!this.items_by_id[ui_item.item.id]){

        } else {
           // iit
        }
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

    'rows': 5,
    'columns': 5,

    'on_drop_pick_up': function(item, slot){
        if(!this.owner.inventory.has(item.item)){
            this.owner.pick_up(item.item);
        }
    },
   
    'remove_item_from_dom': function(item){
        item.dom.remove();
    },
   
   'right_click_item': function(item, event){
        var actions = item.item.get_available_actions('inventory_action', this.owner);
        var ctxmenu = this.scene.spawn_ui('context_menu', {
            items: uiutils.bound_actions_to_menu_items(actions, this.owner),
            position: [event.pageX, event.pageY]
        });
        ctxmenu.on('click_item', function(ctxmenu, action){
            if(action.condition(this.owner)) action.do(this.owner);
            else console.log('action no longer available', action);
        }, this);  
   }
    
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
   },

   'on_drop_put': function (item, slot) {
        if(this.owner.inventory.has(item.item)){
            this.chest_object.put(item.item);
        }
   },
   
   'destroy_events': function() {
       this.owner.off('teleport end_turn', this.destroy, this);
   },

   'click_item': function (item, event){
        this.chest_object.remove(item.item);
        this.owner.pick_up(item.item);
    }
   
});

