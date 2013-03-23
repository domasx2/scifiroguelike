var gamejs = require('gamejs');
var vec = gamejs.utils.vectors;
var game = require('./game').game;
var random = require('./random');
var utils = require('./utils');
var sprite = require('./sprite');

exports.particles = {};

exports.register_particle = function(name, cls){
    exports.particles[name] = cls;
}

var Particle = exports.Particle = function(options){
    utils.process_options(this, options, {
        z:100,
        duration:null
    });
    this.age = 0;
};

Particle.prototype.draw = function(view){};
Particle.prototype.update = function(deltams){
    this.age += deltams;
};

Particle.prototype.is_finished = function(){
    if(this.duration){
        return this.age >= this.duration;
    }
    return true;
};

var SpriteParticle = exports.SpriteParticle = function(options){
    utils.process_options(this, options, {
        sprite_name:utils.required,
        position:utils.required,
        angle: 0,
        pos_center:false
    });
    
    SpriteParticle.superConstructor.apply(this, [options]);
    this.sprite = sprite.new_sprite(this.sprite_name, {
        position: utils.pos_px(this.position),
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
        'pos_from':utils.required,
        'pos_to':utils.required,
        'velocity':10 //tiles per second,
    });
    this.position = options.position = options.pos_from;
    ProjectileParticle.superConstructor.apply(this, [options]);
    
    this.length = vec.distance(this.pos_from, this.pos_to);
};

gamejs.utils.objects.extend(ProjectileParticle, SpriteParticle);

ProjectileParticle.prototype.update = function(deltams){
    SpriteParticle.prototype.update.apply(this, [deltams]);
    this.d = this.age / ((this.length / this.velocity) * 1000);
    this.position = vec.add(this.pos_from, vec.multiply(vec.subtract(this.pos_to, this.pos_from), this.d));
    this.sprite.position = utils.pos_px(this.position);
};

ProjectileParticle.prototype.is_finished = function(){
    return this.d >=1;
};

exports.register_particle('projectile', ProjectileParticle);


var SplatterParticle = exports.SplatterParticle = function(options){
    utils.process_options(this, options, {
        'color':'#FF0000',
        'blip_count':10,
        'position':utils.required,
        'duration':500,
        'min_size':1,
        'max_size':2,
        'min_velocity':0.5,
        'max_velocity':1,
        'velocity':1 //tiles per second
    });
    SplatterParticle.superConstructor.apply(this, [options]);
    this.blips = [];
    for(var i=0;i<this.blip_count;i++){
        var size = random.generator.int(this.min_size, this.max_size);
        this.blips.push({
            'position':this.position.slice(),
            'angle':random.generator.int(0, 359),
            'velocity':random.generator.float(this.min_velocity, this.max_velocity),
            'size':[size, size]
        })
    }
};

gamejs.utils.objects.extend(SplatterParticle, Particle);

SplatterParticle.prototype.draw = function(view){
    var pos_px;
    this.blips.forEach(function(blip){
        pos_px = utils.pos_px(blip.position);
        view.draw_rect(
            new gamejs.Rect(pos_px, blip.size),
            this.color
            )
    }, this);
};

SplatterParticle.prototype.update = function(deltams){
    var blip;
    for(var i=0;i<this.blips.length;i++){
        blip = this.blips[i];
        blip.position = vec.add(blip.position, vec.rotate(vec.multiply([0, -1], blip.velocity * (deltams/1000)), gamejs.utils.math.radians(blip.angle)));
    }
    Particle.prototype.update.apply(this, [deltams]);
};

exports.register_particle('splatter', SplatterParticle);


