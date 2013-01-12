var gamejs = require('gamejs');
var utils = require('./utils');
var game = require('./game').game;

var Sprite = exports.Sprite = function(options){
    utils.process_options(this, options, {
        definition: utils.required,
        position: [0, 0],
        angle: 0
    });
   
    this.spritesheet = game.cache.spritesheets[this.definition.spritesheet_url];
    this.offset = this.definition.offset || [0, 0];
};

Sprite.prototype.draw = function (view){
    view.draw_surface(this.spritesheet.get_surface(this.angle), this.position, this.offset, this.definition.cell_size)
};

Sprite.prototype.update = function(deltams){};

Sprite.prototype.reset = function(){};

var AnimatedSprite = exports.AnimatedSprite = function(options){
    AnimatedSprite.superConstructor.apply(this, [options]);
    
    this.current_frame_index = 0;
    this.current_frame = this.definition.frame_sequence[0];
    this.age = 0;
    this.finished = false;
    
};

gamejs.utils.objects.extend(AnimatedSprite, Sprite);

AnimatedSprite.prototype.reset = function(){
    this.age=0;
    this.update(0);
};

AnimatedSprite.prototype.draw = function(view){
    var offset = [this.offset[0]+this.current_frame * this.definition.cell_size[0], this.offset[1]];
    view.draw_surface(this.spritesheet.get_surface(this.angle), this.position, offset, this.definition.cell_size)
};

AnimatedSprite.prototype.update = function(deltams){
    this.age += deltams;
    if(this.age > this.definition.duration){
        this.fininshed = true;
        this.age = this.age % this.definition.duration;
    }  
    
    this.current_frame_index = parseInt(this.age / (this.definition.duration/this.definition.frame_sequence.length));
    this.current_frame = this.definition.frame_sequence[this.current_frame_index];
};

exports.new_sprite = function(name, options){
    if(!options) options = new Object();
    var definition = game.sprite_defs[name];
    if(!definition) throw 'Undefined sprite: '+ name;
   
    var cls;
    if(definition.type=='static') cls = Sprite;
    else if(definition.type=='animated') cls = AnimatedSprite;
    else throw 'Unknown sprite type:' + definition.type;
    
    options.definition = definition;
    
    return new cls(options);
};


