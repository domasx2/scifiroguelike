var gamejs = require('gamejs');
var utils = require('./utils');
var game = require('./game').game;

var View = exports.View = function(options){
/*
 * Implements zooming, scrolling  & render utilities
 * 
 */
    
    utils.process_options(this, options, {
       world: utils.required,
       width: game.settings.DISPLAY_SIZE[0],
       height: game.settings.DISPLAY_SIZE[1],
       offset: [0, 0],
       zoom: game.settings.ZOOM
    });
    this.surface = null;
    this.follow = null; //object to center view on
};

View.prototype.move_offset_x = function(x){
    this.set_offset_x(this.offset[0]+x);
};

View.prototype.move_offset_y = function(y){ 
    this.set_offset_y(this.offset[1]+y);
};

View.prototype.center_of_map = function(){
    this.set_offset_x((this.world.map.size_px[0]*this.zoom)/2 - this.width/3);
    this.set_offset_y((this.world.map.size_px[1]*this.zoom)/2 - this.height/3); 
};

View.prototype.set_offset_x = function(x){
    this.offset[0] = Math.max(0, Math.min(x, this.world.map.size_px[0]*this.zoom-parseInt(this.width/this.zoom)));
};

View.prototype.set_offset_y = function(y){
    this.offset[1] = Math.max(0, Math.min(y, this.world.map.size_px[1]*this.zoom-parseInt(this.height/this.zoom)));
};

View.prototype.get_visible_tiles = function(){
    var tw = game.tw*this.zoom;
    return {
        'pos':[parseInt(this.offset[0]/tw), parseInt(this.offset[1]/tw)],
        'size':[parseInt(this.width/tw)+1, parseInt(this.height/tw)+1]
   }
}

View.prototype.draw_map_layer_surface = function(surface){
    utils.draw(this.surface, surface, [0,0], [parseInt(this.offset[0]/this.zoom), parseInt(this.offset[1]/this.zoom)], this.zoom);
};

View.prototype.draw_surface = function(surface, dst_position, src_position, src_size){
    var ofst = [dst_position[0] * this.zoom - this.offset[0], dst_position[1] * this.zoom - this.offset[1]];
    utils.draw(this.surface, surface, ofst , src_position, this.zoom, src_size);  
};

View.prototype.update = function(deltams){
    if(this.follow && this.follow.active_sprite){
        var pos = this.follow.active_sprite.position;
        var cs = this.follow.active_sprite.definition.cell_size
        this.set_offset_x(parseInt(pos[0]*this.zoom - (this.width)/3)  + (cs[0]*this.zoom)/2);
        this.set_offset_y(parseInt(pos[1]*this.zoom - (this.height)/3) + (cs[1]*this.zoom)/2);
        //WHY DO SCREEN DIMENSIONS HAVE TO BE DIVIDED BY 3, NOT 2, TO CENTER???
        //I DONT KNOW! IM DUMB! WTF MATH!
    }
};


