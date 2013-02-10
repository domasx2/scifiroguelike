var gamejs = require('gamejs');
var engine = require('../engine');
var creatures = require('../creatures');

var GameScene = exports.GameScene = function(options){
    engine.utils.process_options(this, options, {
        protagonist: null 
    });
    GameScene.superConstructor.apply(this, [options]);
};

GameScene.initial = function (display){
    var gen = new engine.mapgen.generators.Dungeon({
       size: [100, 100],
       max_corridor_length:4,
       min_corridor_length:2,
       corridor_density: 0.5,
       max_exits_per_room:3,
       symmetric_rooms: true,
       interconnects: 8
    });
    gen.generate(30);

    var world  = new engine.World({
        'map': gen.get_map()
    });
    
    var protagonist = world.spawn('protagonist', {
        position:gen.start_pos,
        angle: 90,
        'health': 80
    });
    
    world.spawn('engineer', {
        position:engine.utils.mod(gen.start_pos, [1, 0]),
        angle:0
    });
    
    world.spawn('pistol', {
        position:engine.utils.mod(gen.start_pos, [0, 1]),
    });
    
    world.spawn('pistol_clip', {
        position:engine.utils.mod(gen.start_pos, [0, 2]),
    });
    
    return new GameScene({
        display: display,
        world: world,
        protagonist: protagonist
    });
    
};

GameScene.load = function(data){
    return engine.scene.WorldScene.load(data, GameScene); 
};
    
gamejs.utils.objects.extend(GameScene, engine.scene.WorldScene);



GameScene.prototype.handle_events = function(events){}
