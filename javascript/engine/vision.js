var utils = require('./utils');
var gamejs = require('gamejs');
var game = require('./game').game;
var constants = require('./constants');
var mvec = gamejs.utils.vectors.multiply;
var eventify = require('./lib/events').eventify;

var ASMap = function(vision){

    this.adjacent = function(origin) {
        var retv = [];
        constants.ADJACENT.forEach(function(mod){
            var p =utils.mod(origin, mod);
            if(vision.explored.get(p) && vision.object.world.is_tile_threadable(p)) retv.push(p);
        }, this);
        return retv;
    };
    
    this.estimatedDistance = function(pointA, pointB) {
        return gamejs.utils.vectors.distance(pointA, pointB);
    };

    this.actualDistance = function(pointA, pointB) {
        return gamejs.utils.vectors.distance(pointA, pointB);
    };
};

var Vision = exports.Vision = function(world, object){
    eventify(this);
    this.world = world;
    this.object = object;
    this.explored = new utils.Array2D(world.map.size);
    this.visible = null;
    this.init_fov();
    this.surface = null;
    this.redraw = false;
    this.objects = new utils.Collection(); //objects that are visible
    this.made_visible = [];
    this.prev_visible = [];
    this.world.on(['teleport', 'spawn'], this.object_came_into_view, this);
    this.world.on(['spawn', 'object_set_transparent'], this.object_transparency_changed, this);
};

Vision.prototype.object_transparency_changed = function(world, object){
    if(this.visible && this.visible.get(object.position)){
        this.update();
    } 
};

Vision.prototype.object_came_into_view = function(world, obj){
    if(this.visible.get(obj.position) && !this.objects.has(obj)) this.objects.add(obj);
};

Vision.prototype.get_path = function(from, to){
    return gamejs.pathfinding.astar.findRoute(new ASMap(this), from, to, 100);
};

Vision.prototype.init_fov = function(){
    this.visible = new utils.Array2D(this.world.map.size);
    this.prev_visible = this.made_visible;
    this.made_visible = new Array();
    this.redraw = true;
};

Vision.prototype.can_see = function(pos){
    var v = this.visible.get(pos)
    if(!v  && !(v===null)){
        this.visible.set(pos, true);
        this.explored.set(pos, true);  
        this.made_visible.push(pos);
        
        //add objects that came into view
        this.world.objects.by_pos(pos).forEach(function(obj){
            if(!this.objects.has(obj)) this.objects.add(obj);
        }, this);
    }
};

Vision.prototype.postprocess = function(){
    
    //remove objects that are no longer visible
    this.objects.objects.slice(0).forEach(function(obj){
        if(!this.visible.get(obj.position)) this.objects.remove(obj); 
    }, this);
};

    
Vision.prototype.compute_quadrant = function(position, maxRadius, dx, dy){
    /**
     *  This is a javascript port of https://github.com/initrl/MRPAS-Python
     *  I suspect this code could be a lot shorter..
     */
    
    var startAngle = new Array();
    startAngle[99]=undefined;
    var endAngle = startAngle.slice(0);
    //octant: vertical edge:
    var iteration = 1;
    var done = false;
    var totalObstacles = 0;
    var obstaclesInLastLine = 0;
    var minAngle = 0.0;
    var x = 0.0;
    var y = position[1] + dy;
    var c;
    var wsize = this.world.map.size;
    
    var slopesPerCell, halfSlopes, processedCell, minx, maxx, pos, visible, 
        startSlope, centerSlope, endSlope, idx;
    //do while there are unblocked slopes left and the algo is within
    // the map's boundaries
    //scan progressive lines/columns from the PC outwards
    if( (y < 0) || (y >= wsize[1]))  done = true;
    while(!done){
        //process cells in the line
        slopesPerCell = 1.0 / (iteration + 1);
        halfSlopes = slopesPerCell * 0.5;
        processedCell = parseInt(minAngle / slopesPerCell);
        minx = Math.max(0, position[0] - iteration);
        maxx = Math.min(wsize[0] - 1, position[0] + iteration);
        done = true;
        x = position[0] + (processedCell * dx);
        while((x >= minx) && (x <= maxx)){
            pos = [x, y];
            visible = true;
            startSlope = processedCell * slopesPerCell;
            centreSlope = startSlope + halfSlopes;
            endSlope = startSlope + slopesPerCell;
            if((obstaclesInLastLine > 0) && (!this.visible.get(pos))){
                idx = 0;
                while(visible && (idx < obstaclesInLastLine)){
                    if(this.world.is_tile_transparent(pos)){
                        if((centreSlope > startAngle[idx]) && (centreSlope < endAngle[idx]))
                            visible = false;
                    }
                    else if ((startSlope >= startAngle[idx]) && (endSlope <= endAngle[idx]))
                            visible = false;
                    if(visible && ( (!this.visible.get([x, y-dy])) ||
                              (!this.world.is_tile_transparent([x, y-dy])))
                              && ((x - dx >= 0) && (x - dx < wsize[0]) &&
                              ((!this.visible.get([x-dx, y-dy]))
                               || (!this.world.is_tile_transparent([x-dx, y-dy])))))
                        visible = false;
                    idx += 1;
               }
            }
            if(visible){
                this.can_see(pos);
                done = false;
                //if the cell is opaque, block the adjacent slopes
                if(!this.world.is_tile_transparent(pos)){
                    if(minAngle >= startSlope) minAngle = endSlope;
                    else{
                        startAngle[totalObstacles] = startSlope;
                        endAngle[totalObstacles] = endSlope;
                        totalObstacles += 1;
                    }
                }
            }
            processedCell += 1;
            x += dx;
        }
        if(iteration == maxRadius) done = true;
        iteration += 1
        obstaclesInLastLine = totalObstacles;
        y += dy;
        if((y < 0) || (y >= wsize[1])) done = true;
        if(minAngle == 1.0) done = true;
    }
    
    //octant: horizontal edge
    iteration = 1; //iteration of the algo for this octant
    done = false;
    totalObstacles = 0;
    obstaclesInLastLine = 0;
    minAngle = 0.0;
    x = (position[0] + dx); //the outer slope's coordinates (first processed line)
    y = 0;
    //do while there are unblocked slopes left and the algo is within the map's boundaries
    //scan progressive lines/columns from the PC outwards
    if((x < 0) || (x >= wsize[0])) done = true;
    while(!done){
        //process cells in the line
        slopesPerCell = 1.0 / (iteration + 1);
        halfSlopes = slopesPerCell * 0.5;
        processedCell = parseInt(minAngle / slopesPerCell);
        miny = Math.max(0, position[1] - iteration);
        maxy = Math.min(wsize[1] - 1, position[1] + iteration);
        done = true;
        y = position[1] + (processedCell * dy);
        while((y >= miny) && (y <= maxy)){
            //calculate slopes per cell
            pos = [x, y];
            visible = true;
            startSlope = (processedCell * slopesPerCell);
            centreSlope = startSlope + halfSlopes;
            endSlope = startSlope + slopesPerCell;
            if((obstaclesInLastLine > 0) && (!this.visible.get(pos))){
                idx = 0;
                while(visible && (idx < obstaclesInLastLine)){
                    if(this.world.is_tile_transparent(pos)){
                        if((centreSlope > startAngle[idx]) && (centreSlope < endAngle[idx])) visible = false;
                    }
                    else if((startSlope >= startAngle[idx]) && (endSlope <= endAngle[idx])) visible = false;
                           
                    if(visible && (!this.visible.get([x-dx, y]) ||
                            (!this.world.is_tile_transparent([x-dx, y]))) &&
                            ((y - dy >= 0) && (y - dy < wsize[1]) &&
                             ((!this.visible.get([x-dx, y-dy])) ||
                              (!this.world.is_tile_transparent([x-dx, y-dy]))))) visible = false;
                    idx += 1;
               }
            }
            if(visible){
                this.can_see(pos);
                done = false;
                //if the cell is opaque, block the adjacent slopes
                if(!this.world.is_tile_transparent(pos)){
                    if(minAngle >= startSlope) minAngle = endSlope;
                    else{
                        startAngle[totalObstacles] = startSlope;
                        endAngle[totalObstacles] = endSlope;
                        totalObstacles += 1;
                    }
                }
            }
            processedCell += 1;
            y += dy;
        }
        if(iteration == maxRadius) done = true;
        iteration += 1;
        obstaclesInLastLine = totalObstacles;
        x += dx;
        if((x < 0) || (x >= wsize[0])) done = true;
        if(minAngle == 1.0) done = true;
    }
}        

Vision.prototype.load_explored = function(explored){
    var z = game.settings.ZOOM;
    this.explored = explored;
    var spritesheet = game.cache.spritesheets[game.sprite_defs['fogofwar_dark'].spritesheet_url];
    if(!this.surface){
       this.surface = new gamejs.Surface(mvec(this.world.map.size_px,z));
       this.surface.fill('#000');
    } 
    var drect = null;
    this.explored.iter2d(function(pos, val){
        if(val){
            drect = new gamejs.Rect(mvec(pos,game.tw*z), mvec(game.ts, z));
            this.surface.clear(drect); 
            if(!this.visible.get(pos)){
                this.surface.blit(spritesheet.get_surface(0), 
                    drect,
                    new gamejs.Rect([game.tw, 0], game.ts));
            }
        } 
    }, this);
}

Vision.prototype.draw = function(view){
    if(this.redraw){
      var z = game.settings.ZOOM;
      if(!this.surface){
           this.surface = new gamejs.Surface(mvec(this.world.map.size_px,z));
           this.surface.fill('#000');
      } 
      var spritesheet = game.cache.spritesheets[game.sprite_defs['fogofwar_dark'].spritesheet_url];
      
      this.prev_visible.forEach(function(pos){
          if(!this.visible.get(pos)){
              this.surface.blit(spritesheet.get_surface(0), 
                    new gamejs.Rect(mvec(pos, game.tw*z), mvec(game.ts, z)),
                    new gamejs.Rect([game.tw, 0], game.ts));
          }
      }, this);
      
      this.made_visible.forEach(function(pos){
           this.surface.clear(new gamejs.Rect(mvec(pos, game.tw*z), mvec(game.ts, z))); 
      }, this);

      this.redraw = false;
   }
   view.draw_map_layer_surface(this.surface);
};

Vision.prototype.update = function(){
        this.init_fov();
        this.can_see(this.object.position);
        //compute the 4 quadrants of the map
        this.compute_quadrant(this.object.position, this.object.vision_range, 1, 1);
        this.compute_quadrant(this.object.position, this.object.vision_range, 1, -1);
        this.compute_quadrant(this.object.position, this.object.vision_range, -1, 1);
        this.compute_quadrant(this.object.position, this.object.vision_range, -1, -1);
        this.postprocess();
}
