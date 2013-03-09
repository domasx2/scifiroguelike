var gamejs = require('gamejs');
var utils = require('../utils');
var game = require('../game').game;
var sprite = require('../sprite');
var eventify = require('../lib/events').eventify;
var uiutils = require('./utils');
var game = require('../game').game;

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
    
     
    if(this.item.is_type('equippable')){
        this.equip_tag = $('<div class="equip-tag">E</div>');
        this.equip_tag.appendTo(this.dom);
        this.item.on(['equip', 'unequip'], this.update, this);
    }
    
    if(this.item.get_ammo){
        this.ammo_tag = $('<div class="ammo-tag"></div>');
        this.ammo_tag.appendTo(this.dom);
        this.item.on(['reloaded', 'unload'], this.update, this);
    }
    this.update();
};

Item.prototype.update = function(item){
    if(this.item.is_type('equippable')){
        if(this.item.equipped) this.equip_tag.show();
        else this.equip_tag.hide();
    }
    
    if(this.item.get_ammo){
        this.ammo_tag.html(this.item.get_ammo());
    }
}

game.uimanager.c('item_container', {
    '_requires':'dialog',
    
    'collection':utils.required,
    'owner':utils.required,
    
    'init_disable':function(scene){
        uiutils.disable_between_turns(this.dom, this.owner);
    },
    
    'init_collection':function(scene){
        this.items_by_id = {};
        this.collection.on('add', this.update_items, this);
        this.collection.on('remove', this.update_items, this);
        this.update_items();
    },
    
    'update_items':function(){
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
    },
    
    'click_item':function(item, event){
        
    }
});


game.uimanager.c('inventory', {
   '_requires':'item_container',
   'title':'Inventory',
   
   'click_item':function(item, event){
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
    '_requires':'item_container',
    'title':'Ground',
    'update_items':function(){
        game.uimanager.components['item_container'].update_items.apply(this);
        if(this.collection.len()){
            this.show();
        }  else {
            this.hide();
        }
    },
    
    'click_item':function(item){
        item.item.pick_up(this.owner);
    }
});


game.uimanager.c('chest', {
   '_requires':'item_container',
   'title': 'Chest',
   'chest_object':utils.required,
   'close_button':true,
    
   'init_events':function(){
       this.owner.on('teleport end_turn', this.destroy, this);
   },
   
   'destroy_events':function(){
       this.owner.off('teleport end_turn', this.destroy, this);
   },
   
   'click_item':function(item){
        if(item.item.pick_up(this.owner)){
            this.collection.remove(item.item);
            if(!this.collection.len()) this.chest_object.close();
        } 
    }
   
});

