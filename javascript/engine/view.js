var gamejs = require('gamejs'),
    vec = gamejs.utils.vectors,
    utils = require('./utils'),
    game = require('./game').game;

var View = exports.View = function(options) {
  /*
   * Implements zooming, scrolling  & render utilities. Is passed to draw methods for anything drawable
   *
   */

  utils.process_options(this, options, {
    world: utils.required,
    surface: utils.required,
    width: game.settings.DISPLAY_SIZE[0],
    height: game.settings.DISPLAY_SIZE[1],
    offset: [0, 0],
    zoom: game.settings.ZOOM
  });

  this.follow = null; //object to center view on
};

View.prototype.world_pos = function(screen_pos) {
  //translate screen position into world position
  tile_pos = vec.divide(vec.add(screen_pos, this.offset), game.tw * this.zoom);
  tile_pos = [parseInt(tile_pos[0]), parseInt(tile_pos[1])];
  if (tile_pos[0] >= 0 && tile_pos[0] < this.world.map.size[0] && tile_pos[1] >= 0 && tile_pos[1] < this.world.map.size[1]) return tile_pos;
  return null;
};

View.prototype.move_offset_x = function(x) {
  this.set_offset_x(this.offset[0] + x);
};

View.prototype.move_offset_y = function(y) {
  this.set_offset_y(this.offset[1] + y);
};

View.prototype.center_of_map = function() {
  this.set_offset_x((this.world.map.size_px[0] * this.zoom) / 2 - this.width / 3);
  this.set_offset_y((this.world.map.size_px[1] * this.zoom) / 2 - this.height / 3);
};

View.prototype.set_offset_x = function(x) {
  this.offset = [Math.max(0, Math.min(x, this.world.map.size_px[0] * this.zoom - this.width)), this.offset[1]];
};

View.prototype.set_offset_y = function(y) {
  this.offset = [this.offset[0], Math.max(0, Math.min(y, this.world.map.size_px[1] * this.zoom - this.height))];
};

View.prototype.get_visible_tiles = function() {
  var tw = game.tw * this.zoom;
  return {
    'pos': [parseInt(this.offset[0] / tw), parseInt(this.offset[1] / tw)],
    'size': [parseInt(this.width / tw) + 2, parseInt(this.height / tw) + 2]
  }
};

View.prototype.draw_rect = function(rect, color, width) {
  rect = new gamejs.Rect(vec.subtract(vec.multiply([rect.left, rect.top], this.zoom), this.offset),
  vec.multiply([rect.width, rect.height], this.zoom));
  gamejs.draw.rect(this.surface, color, rect, width);
};

View.prototype.draw_map_layer_surface = function(surface) {
  var view_size = this.surface.getSize(),
      available_size = vec.subtract(surface.getSize(), this.offset),
      size = [Math.min(view_size[0], available_size[0]),
              Math.min(view_size[1], available_size[1])];

  this.surface.blit(surface,
                    new gamejs.Rect([0, 0], size),
                    new gamejs.Rect(this.offset, size));
};

View.prototype.draw_text = function(text, dst_position, font) {
  var fdef = game.settings.FONTS[font];
  if (fdef) {
    var font = game.cache.get_font(fdef[0], fdef[1]);
    font.render(this.surface, text, this.screen_position(dst_position));
  } else {
    console.log('Unknown font!', font);
  }
};

View.prototype.screen_position = function(world_position) {
  return vec.subtract(vec.multiply(world_position, this.zoom), this.offset);
};

View.prototype.draw_surface = function(surface, dst_position) {
  src_size = surface.getSize();
  this.surface.blit(surface, 
                    new gamejs.Rect(this.screen_position(dst_position),
                                    src_size),
                    new gamejs.Rect([0, 0],
                                    src_size));
};

View.prototype.update = function(deltams) {
  if (this.follow && this.follow.active_sprite) {
    var pos = this.follow.active_sprite.position;
    var cs = this.follow.active_sprite.definition.cell_size
    this.set_offset_x(parseInt(pos[0] * this.zoom - this.width / 2) + (cs[0] * this.zoom) / 2);
    this.set_offset_y(parseInt(pos[1] * this.zoom - this.height / 2) + (cs[1] * this.zoom) / 2);
  }
};