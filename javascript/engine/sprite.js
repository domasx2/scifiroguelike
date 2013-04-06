var gamejs = require('gamejs');
var vec = gamejs.utils.vectors;
var utils = require('./utils');
var game = require('./game').game;
var eventify = require('./lib/events').eventify;

var Sprite = exports.Sprite = function(options){
    eventify(this);
    utils.process_options(this, options, {
        definition: utils.required,
        name: utils.required,
        position: [0, 0],
        angle: 0,
        pos_center:false //if fales, position is top left corner. if true, position is center
    });
   
    this.spritesheet = game.cache.spritesheets[this.definition.spritesheet_url];
    this.offset = this.definition.offset || [0, 0];
};

Sprite.prototype.get_position = function(){
    if(this.pos_center) return vec.subtract(this.position, vec.divide(this.definition.cell_size, 2));
    else return this.position;
},

Sprite.prototype.draw = function (view){
    view.draw_surface(this.spritesheet.get_surface(this.angle), 
                      this.get_position(), 
                      this.offset, 
                      this.definition.cell_size)
};

Sprite.prototype.get_surface = function(){
        var cf = vec.multiply(this.definition.cell_size, game.settings.ZOOM),
            surface = new gamejs.Surface(cf);
        surface.blit(this.spritesheet.get_surface(this.angle), 
                    new gamejs.Rect([0, 0], cf), 
                    new gamejs.Rect(this.offset, cf));
        return surface;
};

Sprite.prototype.update = function(deltams){};

Sprite.prototype.reset = function(){};

var AnimatedSprite = exports.AnimatedSprite = function(options){
    AnimatedSprite.superConstructor.apply(this, [options]);
    
    this.current_frame_index = 0;
    this.current_frame = this.definition.frame_sequence[0];
    this.age = 0;
    this.finished = false;
    this.fire('reset');
    
};

gamejs.utils.objects.extend(AnimatedSprite, Sprite);

AnimatedSprite.prototype.reset = function(){
    this.age=0;
    this.finished = false;
    this.update(0);
};

AnimatedSprite.prototype.draw = function(view){
    if(this.finished) return;
    var offset = [this.offset[0]+this.current_frame * this.definition.cell_size[0], this.offset[1]];
    view.draw_surface(this.spritesheet.get_surface(this.angle), this.get_position(), offset, this.definition.cell_size)
};

AnimatedSprite.prototype.update = function(deltams){
    this.age += deltams;
    if(this.age > this.definition.duration){
        this.age = this.age % this.definition.duration;
        if(!this.definition.loop) {
            this.finished = true;
            this.fire('finish');
        } else {
            this.reset();
            this.fire('restart');
        }
        
    }  
    var fs = this.definition.frame_sequence; 
    this.current_frame_index = parseInt(this.age / (this.definition.duration/fs.length));
    if(this.current_frame_index == fs.length) this.current_frame_index--;
    this.current_frame = this.definition.frame_sequence[this.current_frame_index];
};

exports.new_sprite = function(name, options){
    if(!options) options = new Object();
    var definition = game.sprite_defs[name];
    options.name = name;
    if(!definition){
        console.log('Undefined sprite: '+ name);
        return null;
    }
   
    var cls;
    if(definition.type=='static') cls = Sprite;
    else if(definition.type=='animated') cls = AnimatedSprite;
    else throw 'Unknown sprite type:' + definition.type;
    
    options.definition = definition;
    
    return new cls(options);
};


