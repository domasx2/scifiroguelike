var gamejs = require('gamejs');
var engine = require('./engine');
var creatures = require('./creatures');
    
var GameScene = exports.GameScene = function(options){
    //var map = engine.maps.from_tmx('./public/maps/testmap.tmx');
    
    var gen = this.gen = new engine.mapgen.generators.Dungeon({
       size: [100, 100],
       max_corridor_length:4,
       min_corridor_length:2,
       corridor_density: 0.4,
       max_exits_per_room:3
    });
    gen.generate(15);

    var world  = new engine.World({
        'map': gen.get_map()
    });
    
    options.world = world;
    
    this.protagonist = new engine.Creature({
        sprite: 'protagonist',
        position:gen.start_pos,
        angle: 90,
        controller: new engine.controllers.PlayerController()
    });
    
    world.spawn(this.protagonist);
    
   // world.spawn(creatures.new('engineer', [5, 3], 0));
    
    GameScene.superConstructor.apply(this, [options]);
    
    this.view.follow = this.protagonist;
};

gamejs.utils.objects.extend(GameScene, engine.scene.WorldScene);

GameScene.prototype.handle_events = function(events){
    events.forEach(function(event){
        if((event.type === gamejs.event.KEY_DOWN)&&(event.key == gamejs.event.K_SPACE)){
            this.gen.reset();
            this.gen.generate(15);
            this.world.map = this.gen.get_map();
            this.protagonist.teleport(this.gen.start_pos);
        }
    }, this);
};