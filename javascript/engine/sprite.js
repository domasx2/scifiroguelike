var gamejs = require('gamejs');
var vec = gamejs.utils.vectors;
var utils = require('./utils');
var game = require('./game').game;
var eventify = require('./lib/events').eventify;

var Sprite = exports.Sprite = function (options) {
    eventify(this);
    utils.process_options(this, options, {
        definition: utils.required,
        name: utils.required,
        position: [0, 0],
        angle: 0,
        pos_center: false //if false, position is top left corner. if true, position is center
    });
    this.offset = this.definition.offset || [0, 0];
};

Sprite.prototype.get_position = function () {
    if (this.pos_center) {
        return vec.subtract(this.position, vec.divide(this.definition.cell_size, 2));
    } else {
        return this.position;
    }
};

Sprite.prototype.draw = function (view) {
    try {
        view.draw_surface(this.get_surface(), this.get_position());
    } catch(e) {
        console.log('failed to draw sprite', this.name, this.angle, this.definition, game.cache.spritesheets['bullet']);
    }
};

Sprite.prototype.get_surface = function () {
        return game.cache.get_surface(this.name, this.angle);
};

Sprite.prototype.update = function (deltams) {};

Sprite.prototype.reset = function () {};

var AnimatedSprite = exports.AnimatedSprite = function (options) {
    AnimatedSprite.superConstructor.apply(this, [options]);
    this.current_frame_index = 0;
    this.current_frame = this.definition.frame_sequence[0];
    this.age = 0;
    this.finished = false;
    this.fire('reset');
};

gamejs.utils.objects.extend(AnimatedSprite, Sprite);

AnimatedSprite.prototype.reset = function () {
    this.age = 0;
    this.finished = false;
    this.update(0);
};

AnimatedSprite.prototype.get_surface = function () {
    return game.cache.get_surface(this.name, this.angle, this.current_frame);
};

AnimatedSprite.prototype.update = function (deltams) {
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


