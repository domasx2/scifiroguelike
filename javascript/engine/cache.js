var gamejs = require('gamejs');
var game = require('./game').game;
var utils = require('./utils');

var TileSheet = function(def){
    this.def = def;
    this.surface = gamejs.image.load(def.url); 
    this.floor_ofst = def.floor;
};

TileSheet.prototype.get_tile_ofsts = function(walls){
    //walls is a 3x3 utils.Array2D instance.
    //returns list of tile offsets to paint on middle square.
    var retv = [];
    gamejs.utils.objects.keys(this.def.wallmap).forEach(function(key){
        var ok =true;
        utils.iter2d([3, 3], function(pos){
            var k = key[pos[1]*3+pos[1]+pos[0]];
            var p = walls.get(pos);
            if((k=='0' && (p===true || p===null)) || (k==='1' && p==false)) ok = false;
        });
        if(ok) retv.push(this.def.wallmap[key]);
    }, this); 
    return retv;
};

var SpriteSheet = function(url){
    this.url = url;
    this.surfaces = {0:gamejs.image.load(url)}; 
};

SpriteSheet.prototype.get_surface = function(angle){
    if(this.surfaces[angle]) return this.surfaces[angle];
    throw 'Spritesheet '+this.url+' not prerotated for angle '+angle;
};

SpriteSheet.prototype.prerotate = function(step, size){
    var source = this.surfaces[0];
    var source_size = source.getSize();
    var xlen = source_size[0]/size[0];
    var ylen = source_size[1]/size[1];
    for(var angle=step;angle<360;angle+=step){
        if(!this.surfaces[angle]){
            var surface = new gamejs.Surface(source_size);
            for(var y=0;y<ylen;y++){
                for(var x=0;x<xlen;x++){
                    var cell = new gamejs.Surface(size);
                    var ofst = [x*size[0], y*size[1]];
                    cell.blit(source, new gamejs.Rect([0, 0], size), new gamejs.Rect(ofst, size));
                    cell = gamejs.transform.rotate(cell, angle);
                    surface.blit(cell, new gamejs.Rect(ofst, size), new gamejs.Rect([0, 0], size));
                }
            }
            this.surfaces[angle] = surface;
        }
    }
};

exports.Cache = function(resources){
    this.spritesheets = {};
    this.tilesheets = {};
    
    gamejs.utils.objects.keys(resources.tilesheets).forEach(function(key){
        this.tilesheets[key] = new TileSheet(resources.tilesheets[key]); 
    }, this);
    
    resources.images.forEach(function(url){
        this.spritesheets[url] = new SpriteSheet(url);
    }, this);
    
    gamejs.utils.objects.keys(resources.sprites).forEach(function(sprite_def_key){
        var sprite_def = resources.sprites[sprite_def_key];
        
        //initialize some optional attrs
        if(!sprite_def.offset) sprite_def.offset = [0, 0];
        if(!sprite_def.cell_size) sprite_def.cell_size = [game.settings.TILE_WIDTH, game.settings.TILE_WIDTH];
        
        var sheet = this.spritesheets[sprite_def.spritesheet_url];
        if(!sheet) throw "Undefined spritesheet for sprite: " + sprite_def_key;
        if(sprite_def.angle_step) sheet.prerotate(sprite_def.angle_step, sprite_def.cell_size);
    }, this);
};
