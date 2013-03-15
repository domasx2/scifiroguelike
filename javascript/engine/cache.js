var gamejs = require('gamejs');
var game = require('./game').game;
var utils = require('./utils');

var TileSheet = function(def){
    this.def = def;
    this.surface = gamejs.image.load(def.url); 
    this.floor_ofst = def.floor;
    
    
    var hash2ofst = {};
    function rec(h, k, okey){
        if(k.length){
            c = k[0];
            if(c=='x'){
                rec(h+'0', k.substr(1), okey);
                rec(h+'1', k.substr(1), okey);
            }else{
                rec(h+c, k.substr(1), okey);
            }
        } else {
            if(!hash2ofst[h]) hash2ofst[h] = [def.wallmap[okey]];
            else hash2ofst[h].push(def.wallmap[okey]);
        }
    };
    gamejs.utils.objects.keys(this.def.wallmap).forEach(function(okey){
        key = okey.replace(/ /g, '');
        rec('', key, okey);
    });
    this.hash2ofst = hash2ofst;
};

var SpriteSheet = function(url){
    this.url = url;
    this.surfaces = {0:gamejs.image.load(url)}; 
    this.min_angle_step = 0;
};

SpriteSheet.prototype.get_surface = function(angle){
    if(this.surfaces[angle]) return this.surfaces[angle];
    else {
        if(this.min_angle_step){
            return this.surfaces[Math.round(angle/this.min_angle_step) * this.min_angle_step];
        }else {
            throw 'Spritesheet '+this.url+' not prerotated for angle '+angle;
        }
    }
    
};

SpriteSheet.prototype.prerotate = function(step, size){
    this.min_angle_step = Math.min(this.min_angle_step || 360, step);
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
        
        //init sheet and prerotate if needed
        var sheet = this.spritesheets[sprite_def.spritesheet_url];
        if(!sheet) throw "Undefined spritesheet for sprite: " + sprite_def_key;
        if(sprite_def.angle_step) sheet.prerotate(sprite_def.angle_step, sprite_def.cell_size);
        
        //if animated and frame sequence not defined, calc it
        if(sprite_def.type == 'animated' && !sprite_def.frame_sequence){
            sprite_def.frame_sequence = [];
            for(var i=0; i<sheet.get_surface(0).getSize()[0]/sprite_def.cell_size[0];i++){
                sprite_def.frame_sequence.push(i);
            }
        };
        
    }, this);
};
