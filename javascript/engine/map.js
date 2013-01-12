var gamejs = require('gamejs');
var tmx    = require('gamejs/tmx');

var Map = exports.Map = function(url){
    Map.superConstructor.apply(this, [url]);
    this.width_px = this.tileWidth * this.width;
    this.height_px = this.tileHeight * this.height;
    
    this.floor_layer = null;
    this.wall_layer = null;
    this.layers.forEach(function(layer){
         if(layer.properties.floor) this.floor_layer = layer;
         if(layer.properties.walls) this.wall_layer = layer;
         layer.map = this;
         layer.surface = draw_layer_surface(layer);
    }, this);
    
    if(this.floor_layer == null) throw 'Floor layer missing: '+url;
    if(this.wall_layer == null) throw 'Wall layer missing: '+url;
};

gamejs.utils.objects.extend(Map, tmx.Map);


function draw_layer_surface(layer){
    /*
     * pre-render layer surface
     */

   var surface = new gamejs.Surface(layer.map.width * layer.map.tileWidth, layer.map.height * layer.map.tileHeight);
   surface.setAlpha(layer.opacity);

   layer.gids.forEach(function(row, i) {
      row.forEach(function(gid, j) {
         if (gid ===0) return;

         var tileSurface = layer.map.tiles.getSurface(gid);
         if (tileSurface) {
            surface.blit(tileSurface,
               new gamejs.Rect([j * layer.map.tileWidth, i * layer.map.tileHeight], 
                               [layer.map.tileWidth,     layer.map.tileHeight])
            );
         } else {
            gamejs.log('no gid ', gid, i, j, 'layer', i);
         }
      });
   });
   return surface;
};
