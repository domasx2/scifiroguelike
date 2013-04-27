var gamejs = require('gamejs');
var utils = require('../utils');
var game = require('../game').game;
var uiutils = require('./utils');

game.uimanager.c('character_status', {
    '_requires': 'base',

    'create_dom': function() {
        this.dom = uiutils.render_template('character');
        this.attach_dom();
        this.position_dom();
        this.dom.draggable();

        this.slots = {};

        this.owner._equipment_slots.forEach(function(slot_str) {
            var slot = this.scene.spawn_ui('equipment_slot', {
                'container': this,
                'slot_type': slot_str,
            });
            this.slots[slot_str] = slot;
            this.dom.find('[data-slot="'+slot_str+'"] .slot').append(slot.dom);
        }, this);

        this.owner.inventory.equipped.on('add', this.on_equip_item, this);
        this.owner.inventory.equipped.on('remove', this.on_unequip_item, this);

        this.owner.inventory.equipped.iter(function(item){
            this.on_equip_item(null, item);
        }, this);

    },

    'on_equip_item': function(c, item) {
        var slot = this.slots[item._slot];
        if (slot) {
            var idom = this.scene.spawn_ui('inventory_item', {
                'item':item
            });
            slot.attach(idom);
        }
    },

    'on_unequip_item': function(c, item) {
        var slot = this.slots[item._slot];
        if (slot) {
            var item = slot.item;
            slot.detach();
            item.destroy();
        }
    },

    'init_stuff': function() {
        this.owner.on('start_turn', this.refresh_ac, this);
        this.owner.on('consume_move', this.consume_move, this);
        this.owner.on('consume_action', this.consume_action, this);
        this.owner.on('take_damage', this.update_health, this);
        this.update_health();
        this.move_ticks = [];
        this.action_ticks = [];
        this.refresh_ac();
    },

    'consume_action': function() {
        if (this.action_ticks.length) {
            var tick = this.action_ticks.shift();
            tick.animate({
                width: 0,
                height: 0,
                marginBottom: 10
            }, 'fast', $.proxy(tick.remove, tick));
        }
    },

    'consume_move': function() {
        if (this.move_ticks.length) {
            var tick = this.move_ticks.shift();
            tick.animate({
                width: 0,
                height: 0,
                marginBottom: 10
            }, 'fast', $.proxy(tick.remove, tick));
        }
    },

    'refresh_ac': function() {
        var c = this.dom.find('.action-points');
        c.empty();
        this.move_ticks = [];
        this.action_ticks = [];
        for (var i = 0; i < this.owner.moves_left; i++) {
            this.move_ticks.push($('<div class="ac ac-move"></div>').appendTo(c));
        }
        for (var i = 0; i < this.owner.actions_left; i++) {
            this.action_ticks.push($('<div class="ac ac-action"></div>').appendTo(c));
        }
        this.dom.find('.action-points .ac').css({
            width: 0,
            height: 0,
            marginBottom: 10
        }).
        animate({
            width: 10,
            height: 10,
            marginBottom: 0
        }, 'fast');
    },

    'update_health': function() {
        this.dom.find('.health .filler').css('width', parseInt((this.owner.health / this.owner.max_health) * 100) + 'px');
        this.dom.find('.health label').html(this.owner.health + '/' + this.owner.max_health);
    }
});

var CharacterStatus = exports.CharacterStatus = function(options) {
    utils.process_options(this, options, {
        'owner': utils.required,
        'position': [0, 0]
    });

    this.dom = $('<div class="character-status"><label class="character-title">Protagonist</label><div class="health"><div class="filler"></div><label>100/100</label></div><div class="action-points"></div></div>');
    this.dom.css({
        'left': this.position[0],
        'top': this.position[1]
    });
    this.dom.appendTo($('body'));
    this.dom.draggable();

};