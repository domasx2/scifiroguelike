var gamejs = require('gamejs');
var tmx    = require('gamejs/tmx');
var utils = require('./utils');
var game = require('./game').game;

var Map = exports.Map = function(options){
    utils.process_options(this, options, {
        size: [100, 100],
        walls: null,
        floor_surface: null,
        wall_surface: null  
    });   
    
    //default wall map with no walls
    if(!this.walls){
        this.walls = [];
        for(var y=0;y<this.size[1];y++){
            var row = [];
            for(var x=0;x<this.size[0];x++){
                row.push(false);
            }
            this.walls.push(row);
        }  
    }
    
    if(!this.floor_surface) 
        this.floor_surface = new gamejs.Surface([this.size[0] * game.settings.TILE_WIDTH,
                                                 this.size[1] * game.settings.TILE_WIDTH]);
                                                 
    if(!this.wall_surface) 
        this.wall_surface = new gamejs.Surface([this.size[0] * game.settings.TILE_WIDTH,
                                                this.size[1] * game.settings.TILE_WIDTH]); 
                                                
    this.size_px = [this.size[0] * game.settings.TILE_WIDTH,
                    this.size[1] * game.settings.TILE_WIDTH];  
};

Map.prototype.is_wall = function(position){
    return this.walls[position[1]][position[0]];  
};

exports.from_tmx = function(url){
    var tmxmap = new tmx.Map(url);
    var wall_layer, floor_layer = null;
    
    tmxmap.layers.forEach(function(layer){
         if(layer.properties.floor) floor_layer = layer;
         if(layer.properties.walls) wall_layer = layer;
         layer.surface = draw_tmx_layer_surface(layer, tmxmap);
    }, this);
    
    var walls = [];
    for(var y = 0;y<wall_layer.gids.length;y++){
        var row = [];
        for(var x=0; x<wall_layer.gids[y].length;x++){
            row.push(wall_layer.gids[y][x]!=0);
        }
        walls.push(row);
    }

    options = {
        size: [tmxmap.width, tmxmap.height],
        walls: walls,
        wall_surface: wall_layer.surface,
        floor_surface: floor_layer.surface
    };
    
    return new Map(options);
}

function draw_tmx_layer_surface(layer, map){
    /*
     * pre-render layer surface
     */

   var surface = new gamejs.Surface(map.width * map.tileWidth, map.height * map.tileHeight);
   surface.setAlpha(layer.opacity);

   layer.gids.forEach(function(row, i) {
      row.forEach(function(gid, j) {
         if (gid ===0) return;

         var tileSurface = map.tiles.getSurface(gid);
         if (tileSurface) {
            surface.blit(tileSurface,
               new gamejs.Rect([j * map.tileWidth, i * map.tileHeight], 
                               [map.tileWidth,     map.tileHeight])
            );
         } else {
            gamejs.log('no gid ', gid, i, j, 'layer', i);
         }
      });
   });
   return surface;
};
