var utils = require('./utils');
var gamejs = require('gamejs');
var game = require('./game').game;


var Vision = exports.Vision = function(world, object){
    this.world = world;
    this.object = object;
    this.explored = new utils.Array2D(world.map.size);
    this.visible = null;
    this.init_fov();
};

Vision.prototype.init_fov = function(){
    this.visible = new utils.Array2D(this.world.map.size);
};

Vision.prototype.can_see = function(pos){
    this.explored.set(pos, true);
    this.visible.set(pos, true);  
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
                             ((!this.world.is_tile_transparent([x-dx, y-dy])) ||
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

Vision.prototype.draw = function(view){
      var spritesheet = game.cache.spritesheets[game.sprite_defs['fogofwar_dark'].spritesheet_url];
      var sz = view.get_visible_tiles();
      var ofst, pos;
      for(var x = sz.pos[0];x<=sz.pos[0]+sz.size[0];x++){
          for(var y =sz.pos[1];y<sz.pos[1]+sz.size[1];y++){
              pos = [x, y];
              if(!this.visible.get(pos)){
                  if(this.explored.get(pos)) ofst = 16;
                  else ofst = 0;
                  view.draw_surface(spritesheet.get_surface(0), [pos[0]*game.tw, pos[1]*game.tw], [ofst, 0], [16, 16]);
              }
          }
      }
};

Vision.prototype.update = function(){
        this.init_fov();
        this.can_see(this.object.position);
        //compute the 4 quadrants of the map
        this.compute_quadrant(this.object.position, this.object.vision_range, 1, 1);
        this.compute_quadrant(this.object.position, this.object.vision_range, 1, -1);
        this.compute_quadrant(this.object.position, this.object.vision_range, -1, 1);
        this.compute_quadrant(this.object.position, this.object.vision_range, -1, -1);
}
