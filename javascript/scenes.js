var gamejs = require('gamejs');
var engine = require('./engine');
var creatures = require('./creatures');
    
var GameScene = exports.GameScene = function(options){
    var map = engine.maps.from_tmx('./public/maps/testmap.tmx');

    var world = new engine.World({
        'map': map
    });
    
    options.world = world;
    
    this.protagonist = new engine.Creature({
        sprite: 'protagonist',
        position:[2, 2],
        angle: 90,
        controller: new engine.controllers.PlayerController()
    });
    
    world.spawn(this.protagonist);
    
    world.spawn(creatures.new('engineer', [5, 3], 0));
    
    GameScene.superConstructor.apply(this, [options]);
    
    this.view.follow = this.protagonist;
};

gamejs.utils.objects.extend(GameScene, engine.scene.WorldScene);

GameScene.prototype.handle_events = function(events){
    events.forEach(function(event){
      
    });
};