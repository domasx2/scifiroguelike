var gamejs = require('gamejs');
var WorldScene = require('./engine/scene').WorldScene;
var Map = require('./engine/map').Map;
var World = require('./engine/world').World;
var Creature = require('./engine/object').Creature;
var sprites = require('./engine/sprite');
var events = require('./engine/events');
    
var GameScene = exports.GameScene = function(options){
    var map = new Map('./public/maps/testmap.tmx');

    var world = new World({
        'map': map
    });
    
    options.world = world;
    
    this.protagonist = new Creature({
        position:[2, 2],
        angle: 90
    });
    
    world.spawn(this.protagonist);
    
    GameScene.superConstructor.apply(this, [options]);
};

gamejs.utils.objects.extend(GameScene, WorldScene);

GameScene.prototype.handle = function(event){
    this.handle = function(event) {
      if (event.type === gamejs.event.KEY_DOWN) {
          if(!this.events_in_progress()){
             if (event.key === gamejs.event.K_RIGHT) {
                this.move_object(this.protagonist, 90);
             } else if (event.key === gamejs.event.K_LEFT) {
                this.move_object(this.protagonist, 270);
             } else if (event.key === gamejs.event.K_UP) {
                this.move_object(this.protagonist, 0);
             } else if (event.key === gamejs.event.K_DOWN) {
                this.move_object(this.protagonist, 180);
             }
          }
      }
   };
    
};