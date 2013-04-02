var gamejs = require('gamejs');
var vec = gamejs.utils.vectors;
var game = require('./game').game;
var random = require('./random');
var utils = require('./utils');
var sprite = require('./sprite');
var eventify = require('./lib/events').eventify;

exports.particles = {};

exports.register_particle = function(name, cls){
    exports.particles[name] = cls;
}

var Particle = exports.Particle = function(options){
    eventify(this);
    utils.process_options(this, options, {
        z:100,
        duration:null,
        'static':false
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
    /*
    publishes 'enter_tile' event for each new tile it enters


    */
    utils.process_options(this, options, {
        'pos_from':utils.required,
        'pos_to':utils.required,
        'velocity':10, //tiles per second,
        'update_chunks_ms':20 

    });
    this.finished = false;
    this.tiles_hit = {};
    this.position = options.position = options.pos_from;
    this.d = 0;
    ProjectileParticle.superConstructor.apply(this, [options]);
    
    this.length = vec.distance(this.pos_from, this.pos_to);
};

gamejs.utils.objects.extend(ProjectileParticle, SpriteParticle);

ProjectileParticle.prototype.update = function(deltams){
    var chunk;
    while(deltams){
        chunk = Math.min(deltams, this.update_chunks_ms);
        deltams -= chunk;
        this._update(chunk);
    }

};

ProjectileParticle.prototype.finish = function(){
    while(!this.is_finished()) this._update(this.update_chunks_ms);
};

ProjectileParticle.prototype.stop = function(){
    this.d=1;
    this.pos_to = this.position;
};

ProjectileParticle.prototype._update = function(deltams){
    SpriteParticle.prototype.update.apply(this, [deltams]);
    if(this.d<1){
        this.d = this.age / ((this.length / this.velocity) * 1000);
    
        this.position = vec.add(this.pos_from, vec.multiply(vec.subtract(this.pos_to, this.pos_from), this.d));
        this.sprite.position = utils.pos_px(this.position);

        var ptile = utils.round_vec(this.position);
        var h = utils.hash_vec(ptile);
        if(!this.tiles_hit[h]){
            this.tiles_hit[h] = true;
            this.fire('enter_tile', [this.position]);
        }
    }
};

ProjectileParticle.prototype.is_finished = function(){
    return this.finished || this.d >=1;
};

exports.register_particle('projectile', ProjectileParticle);


var SplatterParticle = exports.SplatterParticle = function(options){
    utils.process_options(this, options, {
        'color':'#FF0000',
        'blip_count':10,
        'position':utils.required,
        'duration':500,
        'min_size':1, //blip size in pixels pre-zoom
        'max_size':2,
        'min_velocity':0.5, //tiles per second
        'max_velocity':1
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

TextBlipParticle = exports.TextBlipParticle = function(options){
    utils.process_options(this, options, {
        'font': utils.required,
        'text': utils.required,
        'position': utils.required,
        'duration': 1000,
        'draw_always': true,
        'z': 1000,
        'velocity': 0.5 //tiles per second
    });
    this.position = this.position.slice(0);
    TextBlipParticle.superConstructor.apply(this, [options]);
};

gamejs.utils.objects.extend(TextBlipParticle, Particle);

TextBlipParticle.prototype.update = function(deltams){
    this.position[1] -= this.velocity * (deltams /1000);
    Particle.prototype.update.apply(this, [deltams]);
};

TextBlipParticle.prototype.draw = function(view){
    view.draw_text(this.text, utils.pos_px_noround(this.position), this.font);
};

exports.register_particle('textblip', TextBlipParticle);

