var gamejs = require('gamejs');
var vec = gamejs.utils.vectors;
var game = require('./game').game;
var utils = require('./utils');
var sprite = require('./sprite');

exports.particles = {};

exports.register_particle = function(name, cls){
    exports.particles[name] = cls;
}

var Particle = exports.Particle = function(options){
    utils.process_options(this, options, {
        z:100
    });
    this.age = 0;
};

Particle.prototype.draw = function(view){};
Particle.prototype.update = function(deltams){
    this.age += deltams;
};
Particle.prototype.is_finished = function(){return true;}

var SpriteParticle = exports.SpriteParticle = function(options){
    utils.process_options(this, options, {
        sprite_name:utils.required,
        position_px:utils.required,
        angle: 0,
        pos_center:false
    });
    
    SpriteParticle.superConstructor.apply(this, [options]);
    this.sprite = sprite.new_sprite(this.sprite_name, {
        position: this.position_px,
        angle: this.angle,
        pos_center: this.pos_center
    });
    
};

exports.register_particle('sprite', SpriteParticle);

gamejs.utils.objects.extend(SpriteParticle, Particle);

SpriteParticle.prototype.update = function(deltams){
    Particle.prototype.update.apply(this, [deltams]);
    this.sprite.update(deltams);
};

SpriteParticle.prototype.draw = function(view){
    this.sprite.draw(view);  
};

SpriteParticle.prototype.is_finished = function(){
    return this.sprite.finished;  
};

var ProjectileParticle = exports.ProjectileParticle = function(options){
    utils.process_options(this, options, {
        'pos_px_from':utils.required,
        'pos_px_to':utils.required,
        'velocity':10 //tiles per second,
    });
    options.position_px = options.pos_px_from;
    ProjectileParticle.superConstructor.apply(this, [options]);
    
    this.velocity_px = this.velocity * game.tw;
    this.length = vec.distance(this.pos_px_from, this.pos_px_to);
};

gamejs.utils.objects.extend(ProjectileParticle, SpriteParticle);

ProjectileParticle.prototype.update = function(deltams){
    SpriteParticle.prototype.update.apply(this, [deltams]);
    this.d = this.age / ((this.length / this.velocity_px) * 1000);
    this.sprite.position = vec.add(this.pos_px_from, vec.multiply(vec.subtract(this.pos_px_to, this.pos_px_from), this.d));
};

ProjectileParticle.prototype.is_finished = function(){
    return this.d >=1;
};

exports.register_particle('projectile', ProjectileParticle);


