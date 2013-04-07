var gamejs = require('gamejs'),
    vec = gamejs.utils.vectors,
    game = require('./game').game,
    utils = require('./utils'),
    CachedFont = require('./lib/cachedfont').CachedFont;

var TileSheet = function (def, cache) {
    this.cache = cache;
    this.def = def;
    this.surface = cache.load_img(def.url); 
    this.floor_ofst = def.floor;
    
    var hash2ofst = {};
    function rec(h, k, okey){
        var c;
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
        var key = okey.replace(/ /g, '');
        rec('', key, okey);
    });
    this.hash2ofst = hash2ofst;
};

var SpriteSheet = function(def, cache){
    this.cache = cache;
    this.def = def;
    this.frames = 1;

    //set up general optional params
    if(!def.offset) def.offset = [0, 0];
    if(!def.cell_size) def.cell_size = game.ts;

    var surface = cache.load_img(def.spritesheet_url),
        cs = vec.multiply(def.cell_size, cache.zoom),
        frame, s, ofst;
    
    //set up animated optional params
    if(def.type=='animated'){
        this.frames = surface.getSize()[0] / def.cell_size[0];
        if(!def.frame_sequence){
            def.frame_sequence = [];
            for(var i=0; i<surface.getSize()[0]/def.cell_size[0];i++){
                def.frame_sequence.push(i);
            }
        }
    }

    this.surfaces = {};
    //init all frames
    for(frame=0;frame<this.frames;frame++){
        s = new gamejs.Surface(cs);
        ofst = [def.offset[0]+ def.cell_size[0]*frame, def.offset[1]];
        s.blit(surface, 
            new gamejs.Rect([0, 0], cs),
            new gamejs.Rect(ofst, def.cell_size));

        this.surfaces[frame] = {
            0: s
        }

        //prerotate if needed
        if(def.angle_step){
            for(var angle=def.angle_step;angle<360;angle+=def.angle_step){
                s = new gamejs.Surface(cs);
                s.blit(surface, 
                            new gamejs.Rect([0, 0], cs), 
                            new gamejs.Rect(ofst, def.cell_size));
                s = gamejs.transform.rotate(s, angle);
                this.surfaces[frame][angle] = s;
            }
        }
        
    }
};

SpriteSheet.prototype.get_surface = function(angle, frame){
    frame = frame || 0;
    if(this.surfaces[frame][angle]) {
        return this.surfaces[frame][angle];
    }
    else {
        return this.surfaces[frame][Math.round(angle/this.def.angle_step) * this.def.angle_step];
    }
    
};

var Cache = exports.Cache = function(resources, zoom){
    this.resources = resources;
    this.zoom = zoom;
    this.init();
};

Cache.prototype.load_img = function(url){
    return gamejs.image.load(url);
};


Cache.prototype.init = function() {
    this.spritesheets = {};
    this.tilesheets = {};
    this.fonts = {}

    var def;
    
    gamejs.utils.objects.keys(this.resources.tilesheets).forEach(function(key){
        def = this.resources.tilesheets[key];
        this.tilesheets[key] = new TileSheet(def, this); 
    }, this);
    
    gamejs.utils.objects.keys(this.resources.sprites).forEach(function(key){
        def = this.resources.sprites[key];
        this.spritesheets[key] = new SpriteSheet(def, this);
    }, this);
};

Cache.prototype.get_surface = function(sprite_name, angle, frame){
    return this.spritesheets[sprite_name].surfaces[frame || 0][angle || 0];

}

Cache.prototype.get_font = function(font, color){
    var hash = font+'_'+color;
    if(!this.fonts[hash]) this.fonts[hash] = new CachedFont(font, color);
    return this.fonts[hash];
};