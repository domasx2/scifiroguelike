var utils = require('../utils');
var gamejs = require('gamejs');
var pieces = require('./pieces');
var game = require('../game').game;

var MapCanvas = exports.MapCanvas = function(options){
    MapCanvas.superConstructor.apply(this, [options]);
};

gamejs.utils.objects.extend(MapCanvas, pieces.Piece)

MapCanvas.prototype.draw_walls = function(tilesheet){
    if(!tilesheet) tilesheet = 'default';
    var surface = new gamejs.Surface([this.size[0]*game.settings.TILE_WIDTH,
                                      this.size[1]*game.settings.TILE_WIDTH]);
    var tilesheet = game.cache.tilesheets[tilesheet];
    var t = game.settings.TILE_WIDTH;
    var tile_size = [t, t];
    
    this.walls.iter2d(function(pos, wall){
        if(wall){
            surface.blit(tilesheet, new gamejs.Rect([pos[0]*t, pos[1]*t], tile_size), new gamejs.Rect([2*t, 3*t], tile_size));
        } 
    });
    
    return surface;                                        
};

