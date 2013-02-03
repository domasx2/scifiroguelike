var GUI = require('./lib/gamejs-gui');
var gamejs = require('gamejs');
var game = require('./game').game;
var utils = require('./utils');
var sprite = require('./sprite');

var SCALE = game.settings.UI_SCALE;

var DEFAULT_FONT = GUI.DEFAULT_FONT = new GUI.CachedFont((6*game.settings.UI_SCALE)+'px visitor', 'white');

var FrameHeader = exports.FrameHeader = function(options){
   options.height = 10 * SCALE;
   FrameHeader.superConstructor.apply(this, [options]);
};

gamejs.utils.objects.extend(FrameHeader, GUI.FrameHeader);

FrameHeader.prototype.paint = function(){
    this.surface.clear();  
    this.surface.fill('#00beff');
};

var Frame = exports.Frame = function(options){
   utils.process_options(this, options, {
        'title':'container',
        'gui':utils.required,
        'size':utils.required,
        'position':[0, 0]
   });
   
   Frame.superConstructor.apply(this, [{
        'size':this.size,
        'parent':this.gui,
        'constrain': true,
        'position': this.position
   }]);
    
   this.header = new FrameHeader({
        parent: this,
        title: ' '+this.title
    });
    
    this.container = new GUI.View({
       position:  [0, this.header.size[1]],
       size: [this.size[0], this.size[1]-this.header.size[1]],
       parent: this
    });
};

gamejs.utils.objects.extend(Frame, GUI.Frame);

Frame.prototype.resize = function(sz){
      GUI.Frame.prototype.resize.apply(this, [sz]);
      this.container.resize([this.size[0], this.size[1]-this.header.size[1]]);
};

Frame.prototype.paint = function(){
     this.surface.clear();

     var s = new gamejs.Surface(this.surface.getSize());
     //s.setAlpha(0.5);
     gamejs.draw.rect(s, '#FFF', new gamejs.Rect([0, 0], this.size));   
     this.surface.blit(s, [0, 0]);
     
     gamejs.draw.rect(this.surface, '#00beff', new gamejs.Rect([0, 0], this.size), 2*game.settings.UI_SCALE);
};

var ContainerFrame = exports.ContainerFrame = function(options){
    utils.process_options(this, options, {
        'collection':utils.required,
        'gui':utils.required,
        'always_visible':false,
        'protagonist':utils.required
    });
    
    options.size = this.calcsize();
    ContainerFrame.superConstructor.apply(this, [options]);
    this.collection.on('add', this.update_items, this);
    this.collection.on('remove', this.update_items, this);
    this.update_items();
};

gamejs.utils.objects.extend(ContainerFrame, Frame);



ContainerFrame.prototype.calcsize = function(){
    var scale = game.settings.UI_SCALE;
    return [(game.tw+(scale*2))*scale, Math.max(this.collection.len(), 1)*(game.tw+(scale*2))*scale+10*SCALE];
}

ContainerFrame.prototype.update_items = function(){
    
    this.resize(this.calcsize());
    while(this.container.children.length) {
        this.container.children.shift().destroy();
    }
    if(this.collection.len()){
        this.show();
        this.collection.iter(function(item){
            var iv = new ItemView({
               'item':item,
               'parent':this.container
            });
            
            iv.on(GUI.EVT_MOUSE_DOWN, this.click_item, this);
        }, this);
        
        GUI.layout.vertical(this.container.children, null, SCALE);
    }else {
        if(!this.always_visible) this.hide();
        else this.show();
    }
    
};

ContainerFrame.prototype.click_item = function(evt, itemview){
      
};

//ITEM

var ItemView = exports.ItemView = function(options){
    utils.process_options(this, options, {
        'item':utils.required, 
        'parent':utils.required,
    });
    
    this.sprite = sprite.new_sprite(this.item.sprite_name+'_inventory');
    
    var opts ={
        'parent':this.parent,
        'size':gamejs.utils.vectors.multiply(this.sprite.definition.cell_size, SCALE),
        'position':[SCALE, 0]
    }
    
    ItemView.superConstructor.apply(this, [opts]);
    this.dirty = true;
};

gamejs.utils.objects.extend(ItemView, GUI.View);

ItemView.prototype.paint = function(){
    if(this.dirty){
        this.surface.clear();
        var s = this.sprite.get_surface();
        this.surface.blit(s, new gamejs.Rect([0, 0], this.size), new gamejs.Rect([0, 0], s.getSize()));
        this.dirty = false;
    }
};

//INVENTORY

var InventoryFrame = exports.InventoryFrame = function(options){
    options.title = 'inv';
    options.always_visible = true;
    InventoryFrame.superConstructor.apply(this, [options]);
};

gamejs.utils.objects.extend(InventoryFrame, ContainerFrame);

InventoryFrame.prototype.click_item = function(evt, itemview){
    itemview.item.drop(this.protagonist);
    this.update_items();
};


//GROUND ITEMS
var GroundItemsFrame = exports.GroundItemsFrame = function(options){
    options.title = 'grnd';
    InventoryFrame.superConstructor.apply(this, [options]);
};

gamejs.utils.objects.extend(GroundItemsFrame, ContainerFrame);

GroundItemsFrame.prototype.click_item = function(evt, itemview){
    itemview.item.pick_up(this.protagonist);
    this.update_items();
};


