var game = require('../game').game;
var actions = require('./actions');

game.objectmanager.c('item', {
    '_requires': 'object',

    '_container': null,

    'on_put_into_container': function(container) {
        if(this._container && this._container.has(this) && this._container != container){
            this._container.remove(this);
        }
        this._container = container;
    },

    'on_drop_null_container': function(){
        this._container = null;
    },  

    'inventory_action_drop': actions.action({
        'name': 'Drop',
        'condition': function (actor) {
            return actor.inventory.has(this);
        },
        'do': function (actor) {
            actor.drop(this);
        }
    }),

    'remove_from_container': function(){
        if(this._container) this._container.remove(this);
    },

    'combine': function(item, actor){

    }
});



game.objectmanager.c('equippable', {
    'equipped': false,
    '_slot': 'weapon',
    '_equipped_by': null,

    'init_equippable': function() {
        this.on('drop', function(owner) {
            if (this.equipped) this.unequip(owner);
        }, this);

    },

    'on_remove_from_container':function(container){
        if(this.equipped) this.unequip()
    },

    'inventory_action_equip': actions.action({
        'name': 'Equip',
        'condition': function(actor) {
            return !this.equipped && actor._equipment_slots && actor._equipment_slots.indexOf(this._slot) != -1;
        },
        'do': function(actor) {
            this.equip(actor);
        }
    }),

    'inventory_action_unequip': actions.action({
        'name': 'Unequip',
        'condition': function(actor) {
            return this.equipped;
        },
        'do': function(actor) {
            this.unequip();
        }
    }),

    'serialize_equipped_by': function(data){
        if(this._equipped_by) data.equipped_by = this._equipped_by.id;
    },

    'post_load_equipped_by': function(data){
        if(data.equipped_by) this._equipped_by = this.world.objects.by_id(data.equipped_by);
    },

    'equip': function(owner) {
        if (!this.equipped) {
            owner.inventory.iter(function(item) {
                if (item.is_type('equippable') && item._slot == this._slot && item.equipped) item.unequip(owner);
            }, this)
            this.equipped = true;
            this._equipped_by = owner;
            this.fire('equip', [owner]);
            this._equipped_by.fire('equip', [this]);
        } else {
            console.log("Equipping already equipped item??", this, owner);
        }
    },
    'unequip': function() {
        if (this.equipped) {
            this.equipped = false;
            this.fire('unequip', [this._equipped_by]);
            this._equipped_by.fire('unequip', [this]);
            this._equipped_by = null;
        } else {
            console.log('Unequipping equipped item??', this);
        }
    }
});