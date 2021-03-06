var gamejs = require('gamejs'),
    vec = gamejs.utils.vectors,
    tmx    = require('gamejs/tmx'),
    utils = require('./utils'),
    game = require('./game').game;



var Map = exports.Map = function(options){
    utils.process_options(this, options, {
        size: [100, 100],
        walls: null,
        floor_surface: null,
        wall_surface: null,
        tilesheet: 'default'
    });   
    
    this.tilesheet = game.cache.tilesheets[this.tilesheet];
    
    this.size_px = vec.multiply(this.size, game.tw);

    //default wall map with no walls
    if(!this.walls) this.walls = new utils.Array2D(this.size, false);
    
    if(!this.floor_surface) 
        this.floor_surface = this.draw_floor(game.settings.ZOOM);
                                                 
    if(!this.wall_surface) 
        this.wall_surface = this.draw_walls(game.settings.ZOOM);
  
};

Map.load = function(data){
    var map = new Map({
        size: data.size,
        tilesheet: data.tilesheet,
        walls: utils.Array2D.load_bool(data.walls)
    });
    return map;
};


Map.prototype.serialize = function(){
    return {
        'size':this.size,
        'tilesheet':this.options.tilesheet,
        'walls':this.walls.serialize_bool()  
    };
};

Map.prototype.new_surface = function(zoom){
    return new gamejs.Surface(vec.multiply(this.size, game.tw * zoom));
};

Map.prototype.draw_walls = function(zoom){
    console.log('drawing walls..');
    var tt = utils.t(),
        tile_size = vec.multiply(game.ts, zoom),
        surface = this.new_surface(zoom),
        hash, x, y, ofsts;
    this.walls.iter2d(function(p, wall){
        if(wall){
            hash=''
            for(y= -1;y<=1;y++){
                for(x= -1; x<=1;x++){
                    hash += this.walls.get([p[0]+x, p[1]+y])===false ? '0' : '1';
                }
            }
            gamejs.draw.rect(surface, game.settings.BG_COLOR, 
                             new gamejs.Rect(vec.multiply(p, game.tw*zoom), tile_size));
            ofsts = this.tilesheet.hash2ofst[hash];
            if(ofsts) ofsts.forEach(function(ofst){
                surface.blit(this.tilesheet.surface, 
                    new gamejs.Rect(vec.multiply(p, game.tw * zoom), tile_size), 
                    new gamejs.Rect(vec.multiply(ofst, game.tw), game.ts));
            }, this);   
        } 
    }, this);
    console.log('done. '+(utils.t()-tt));
    return surface;                                        
};

Map.prototype.draw_floor = function(zoom){
    console.log('drawing floor..');
    var tt=utils.t(),
        tile_size = vec.multiply(game.ts, zoom),
        surface = this.new_surface(zoom),
        ofst;
                                      
    this.walls.iter2d(function(pos, wall){
        if(!wall){
            ofst = this.tilesheet.floor_ofst;
            surface.blit(this.tilesheet.surface, 
                    new gamejs.Rect(vec.multiply(pos, game.tw * zoom), tile_size), 
                    new gamejs.Rect(vec.multiply(ofst, game.tw), game.ts));
        }
    }, this);
    console.log('done. '+(utils.t()-tt));
    return surface;
};

Map.prototype.is_wall = function(position){
    return this.walls.get(position);  
};

/*
exports.from_tmx = function(url){
    var tmxmap = new tmx.Map(url);
    var wall_layer, floor_layer = null;
    
    tmxmap.layers.forEach(function(layer){
         if(layer.properties.floor) floor_layer = layer;
         if(layer.properties.walls) wall_layer = layer;
         layer.surface = draw_tmx_layer_surface(layer, tmxmap);
    }, this);
    
    var walls = new utils.Array2D([tmxmap.width, tmxmap.height], false);
    for(var y = 0;y<wall_layer.gids.length;y++){
        for(var x=0; x<wall_layer.gids[y].length;x++){
            walls.set([x, y], wall_layer.gids[y][x]!=0);
        }
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
/*
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

*/