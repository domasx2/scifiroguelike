var gamejs = require('gamejs');
var engine = require('../engine');
var creatures = require('../creatures');

var GameScene = exports.GameScene = function(options){
    engine.utils.process_options(this, options, {
        protagonist: null 
    });
    GameScene.superConstructor.apply(this, [options]);
};

GameScene.initial = function (){
    var gen = new engine.mapgen.generators.Dungeon({
       size: [100, 100],
       max_corridor_length:4,
       min_corridor_length:2,
       corridor_density: 0.5,
       max_exits_per_room:3,
       symmetric_rooms: true,
       interconnects: 5
    });
    gen.generate(15);

    var world  = new engine.World({
        'map': gen.get_map()
    });
    
    var protagonist = world.spawn('protagonist', {
        position:gen.start_pos,
        angle: 90
    });
    
    world.spawn('engineer', {
        position:engine.utils.mod(gen.start_pos, [1, 0]),
        angle:0
    });
    
    return new GameScene({
        world: world,
        protagonist: protagonist
    });
    
};

GameScene.load = function(data){
      var world = engine.World.load(data.world);
      
      return new GameScene({
            'world': world,
            'protagonist': data.protagonist ? world.objects.by_id(data.protagonist) : null 
      });
};
    
gamejs.utils.objects.extend(GameScene, engine.scene.WorldScene);

GameScene.prototype.serialize = function(){
      return {
          'protagonist': this.protagonist.id,
          'world':this.world.serialize()
      }
};

GameScene.prototype.handle_events = function(events){}
