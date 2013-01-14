var gamejs = require('gamejs');
var WorldScene = require('./engine/scene').WorldScene;
var Map = require('./engine/map').Map;
var World = require('./engine/world').World;
var Creature = require('./engine/object').Creature;
var sprites = require('./engine/sprite');
var controller = require('./engine/controller');
    
var GameScene = exports.GameScene = function(options){
    var map = new Map('./public/maps/testmap.tmx');

    var world = new World({
        'map': map
    });
    
    options.world = world;
    
    this.protagonist = new Creature({
        sprite: 'protagonist',
        position:[2, 2],
        angle: 90,
        controller: new controller.PlayerController()
    });
    
    world.spawn(this.protagonist);
    
    GameScene.superConstructor.apply(this, [options]);
};

gamejs.utils.objects.extend(GameScene, WorldScene);

GameScene.prototype.handle_events = function(events){
    events.forEach(function(event){
      
    });
};