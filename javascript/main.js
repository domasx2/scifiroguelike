var gamejs = require('gamejs');
var engine = require('./engine');
var game = engine.game;
var GameScene  = require('./scenes/game').GameScene;
var MapGenDemoScene = require('./scenes/mapgen_demo').MapGenDemoScene;
var resources = require('./resources');
var settings = require('./settings');

gamejs.preload(resources.images);

gamejs.ready(function() {
    game.init(settings, resources);
    gamejs.display.setCaption('SciFi roguelike project');
    
    var display = gamejs.display.setMode(settings.DISPLAY_SIZE, gamejs.display.DISABLE_SMOOTHING);

    if(window.mapgendemo) game.scene = new MapGenDemoScene({});
    else game.scene = GameScene.initial();

    var tick = function(deltams) {
        var events = gamejs.event.get();
        handle_events(events);
        if(game.scene){
            game.scene.update(deltams, events);
            display.fill('#000');
            game.scene.draw(display);
        }
    };
    gamejs.time.fpsCallback(tick, this, settings.FPS);
});


function save(){
    if(typeof(Storage)!=="undefined") {
        localStorage.quicksave = JSON.stringify(game.scene.serialize());
        console.log(localStorage.quicksave);
        console.log('saved');
    }
    else console.log('No storage support??');
}

function load(){
    if((typeof(Storage)!=="undefined")&&localStorage.quicksave){
        game.scene = GameScene.load(JSON.parse(localStorage.quicksave));
    }else {
        console.log('No storage support??');
    }
    
}

function handle_events(events){
    game.handle_events(events);
    events.forEach(function(event){
        if(event.type == gamejs.event.KEY_DOWN){
            if(event.key == gamejs.event.K_9){
                save();
            }  
            if(event.key == gamejs.event.K_0){
                load();
            }  
        }
    });
};
