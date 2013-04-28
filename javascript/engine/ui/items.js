var gamejs = require('gamejs');
var utils = require('../utils');
var game = require('../game').game;
var sprite = require('../sprite');
var eventify = require('../lib/events').eventify;
var uiutils = require('./utils');
var game = require('../game').game;

game.uimanager.c('inventory_item', {
    '_requires': 'item',

    'on_rightclick': function() {
        var actions = this.item.get_available_actions('inventory_action', this.owner);
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

game.uimanager.c('item', {
    '_requires': 'base',
    '_dropped': false,
    'item': null, //required
    'slot': null,

    'drag_start': function() {
        this._dropped = false;
    },

    'attach_to': function(slot) {
        slot.attach(this);
    },

    'detach': function() {
        this.slot.detach(this);
    },

    'drag_stop': function() {
        if (!this._dropped) {
            this.attach_to(this.slot);
        }
        this.dom.css({
            top: '0px',
            left: '0px'
        });
    },


    'create_dom': function() {
        var sprt = sprite.new_sprite(this.item.sprite_name + '_inventory'),
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

        this.dom.bind('contextmenu', $.proxy(function(event) {
            this.fire('rightclick', [event]);
            return false;
        }, this));

        this.dom.bind('click', $.proxy(function(event) {
            this.fire('click', [event]);
            return false;
        }, this));

        if (this.item.is_type('equippable')) {
            this.equip_tag = $('<div class="equip-tag">E</div>');
            this.equip_tag.appendTo(this.dom);
            this.item.on(['equip', 'unequip'], this.update_dom, this);
        }

        if (this.item.get_ammo) {
            this.ammo_tag = $('<div class="ammo-tag"></div>');
            this.ammo_tag.appendTo(this.dom);
            this.item.on(['reloaded', 'unload', 'use_ammo'], this.update_dom, this);
        }
        this.update_dom();
    },

    'update_dom': function() {
        if (this.item.is_type('equippable')) {
            if (this.item.equipped) this.equip_tag.show();
            else this.equip_tag.hide();
        }

        if (this.item.get_ammo) {
            this.ammo_tag.html(this.item.get_ammo());
        }
    }
});

game.uimanager.c('item_slot', {
    '_requires': 'base',
    'container': null,
    'item': null,

    'attach': function(item) {
        if (item.slot) item.slot.detach();
        this.dom.append(item.dom);
        item.fire('attach', [this]);
        this.fire('attach', [item]);
        this.item = item;
        item.slot = this;
    },

    'detach': function() {
        var item = this.item;
        item.dom.appendTo($('body'));
        this.fire('detach', [item]);
        item.fire('detach', [this]);
        this.item = null;
        item.slot = null;
    },

    'on_drop': function(item) {

    },

    'create_dom': function() {
        this.dom = $('<div class="inventory-slot"></div>').droppable({
            accept: '.ui-item'
        }).bind('drop', $.proxy(function(evt, ui) {
            var item = ui.draggable.data('ui');
            this.container._last_dropped_slot = this;
            item.fire('drop', [this]);
            this.fire('drop', [item]);
            this.container.fire('drop', [item, this]);
        }, this));
    }
});

game.uimanager.c('inventory_slot', {
    '_requires': 'item_slot',

    'on_drop_handle': function(item){
        if(this.item && this.item.item != item.item){
            if(this.item.item.combine(item.item, this.owner)){
                return;
            } 
        }
        if(!this.owner.inventory.has(item.item)){
            this.owner.pick_up(item.item);
            return;
        }
         if(this.owner.inventory.has(item.item) && item.item.equipped){
            item.item.unequip();
        }
    },

});

game.uimanager.c('equipment_slot', {
    '_requires': 'inventory_slot',
    'slot_type': utils.required,

    'on_drop_equip': function (item) {
        if(item.item.is_type('equippable') && item.item._slot == this.slot_type){
            if(this.item) this.item.item.unequip();
            if(!this.owner.inventory.has(item.item)) this.owner.pick_up(item.item);
            item.item.equip(this.owner);
        }
    }
});