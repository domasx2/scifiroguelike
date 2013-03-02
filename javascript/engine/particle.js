var gamejs = require('gamejs');
var utils = require('./utils');
var sprite = require('./sprite');

exports.particles = {};

exports.register_particle = function(name, cls){
    exports.particles[name] = cls;
}

var Particle = exports.Particle = function(options){
    utils.process_options(this, options, {
        z:100
    })
};

Particle.prototype.draw = function(view){};
Particle.prototype.update = function(deltams){};
Particle.prototype.is_finished = function(){return true;}

var SpriteParticle = exports.SpriteParticle = function(options){
    utils.process_options(this, options, {
        sprite_name:utils.required,
        position_px:utils.required
    })
    
    SpriteParticle.superConstructor.apply(this, [options]);
    this.sprite = sprite.new_sprite(this.sprite_name, {
        position: this.position_px
    });
    
};

exports.register_particle('sprite', SpriteParticle);

gamejs.utils.objects.extend(SpriteParticle, Particle);

SpriteParticle.prototype.update = function(deltams){
    this.sprite.update(deltams);
};

SpriteParticle.prototype.draw = function(view){
    this.sprite.draw(view);  
};

SpriteParticle.prototype.is_finished = function(){
    return this.sprite.finished;  
};

