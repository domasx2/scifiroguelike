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
       width: 800,
       height: 600,
       offset: [0, 0],
       zoom: 3
    });
    this.surface = null;
};

View.prototype.move_offset_x = function(x){
    this.offset[0] = Math.max(0, Math.min(this.offset[0]+x, this.world.map.width_px*this.zoom-parseInt(this.width/this.zoom)));
}

View.prototype.move_offset_y = function(y){
    this.offset[1] = Math.max(0, Math.min(this.offset[1]+y, this.world.map.height_px*this.zoom-parseInt(this.height/this.zoom)));
}

View.prototype.draw_layer = function(layer){
    utils.draw(this.surface, layer.surface, [0,0], [parseInt(this.offset[0]/this.zoom), parseInt(this.offset[1]/this.zoom)], this.zoom);
};

View.prototype.draw_surface = function(surface, dst_position, src_position, src_size){
    var ofst = [dst_position[0] * this.zoom - this.offset[0], dst_position[1] * this.zoom - this.offset[1]];
    utils.draw(this.surface, surface, ofst , src_position, this.zoom, src_size);  
};

View.prototype.update = function(deltams){
    
};


