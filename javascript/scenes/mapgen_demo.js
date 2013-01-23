var gamejs = require('gamejs');
var engine = require('../engine');

var MapGenDemoScene = exports.MapGenDemoScene = function(options){
    //var map = engine.maps.from_tmx('./public/maps/testmap.tmx');

    var world  = new engine.World({
        'map': this.map_from_form()
    });
    
    options.world = world;
    
    MapGenDemoScene.superConstructor.apply(this, [options]);
    this.view.center_of_map();
};

gamejs.utils.objects.extend(MapGenDemoScene, engine.scene.WorldScene);

MapGenDemoScene.prototype.handle_events = function(events){
    events.forEach(function(event){
        if((event.type === gamejs.event.KEY_DOWN)){
            if(event.key==gamejs.event.K_UP) this.view.move_offset_y(-16);
            else if(event.key==gamejs.event.K_DOWN) this.view.move_offset_y(16);
            else if(event.key==gamejs.event.K_LEFT) this.view.move_offset_x(-16);
            else if(event.key==gamejs.event.K_RIGHT) this.view.move_offset_x(16);
        }
    }, this);
};

MapGenDemoScene.prototype.load_form = function(){
    this.world.map = this.map_from_form(); 
    this.view.center_of_map(); 
};

MapGenDemoScene.prototype.map_from_form = function(){
    function g(name){
        return parseInt(document.getElementById(name).value);   
    }
    function f(name){
        return parseFloat(document.getElementById(name).value); 
    }
    var opts = {
        size:[g('map_size_x'), g('map_size_y')],
        min_room_size:[g('min_room_size_x'), g('min_room_size_y')],
        max_room_size:[g('max_room_size_x'), g('max_room_size_y')],
        max_corridor_length:g('max_corridor_length'),
        min_corridor_length:g('min_corridor_length'),
        max_exits_per_room:g('max_exits_per_room'),
        corridor_density:f('corridor_density'),
        symmetric_rooms:document.getElementById('symmetric_rooms').checked,
        interconnects:g('interconnects'),
        max_interconnect_length:g('max_interconnect_length')       
    };
    console.log(opts);
    var gen = new engine.mapgen.generators.Dungeon(opts);
    gen.generate(g('rooms'));
    return gen.get_map();     
}
