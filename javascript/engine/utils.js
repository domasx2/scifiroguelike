var gamejs = require('gamejs');
var vec = gamejs.utils.vectors;
var constants = require('./constants');
var eventify = require('./lib/events').eventify;
var game = require('./game').game;

var required = exports.required = '_PROPERTY_REQUIRED';
var i = parseInt;
var normalise_degrees = gamejs.utils.math.normaliseDegrees;
var round_vec = exports.round_vec = function(vec){
    return [parseInt(vec[0]), parseInt(vec[1])];
};

exports.hash_vec = function(vec){
    return vec[0]+'_'+vec[1];
}

exports.cmp = function(vec1, vec2){
    return vec1[0]==vec2[0] && vec1[1]==vec2[1];  
};


exports.pos_px_noround = function(world_pos){
    return vec.multiply(world_pos, game.tw);
};

exports.pos_px = function(world_pos){
    //world tile position into pixel position
    return round_vec(vec.multiply(world_pos, game.tw));
};

exports.mod = function(position, mod){
    //i don't know why i have this
    return vec.add(position, mod);  
};

var shift = exports.shift = function(position, direction){
    //direction is degress (0, 90, 180 or 270). move tile position by 1 in this direction
    return vec.add(position, constants.MOVE_MOD[direction]);
};

exports.shift_back = function(position, direction){
    return vec.add(position, constants.MOVE_MOD_BACK[direction]);
};

exports.shift_left = function(position, direction){
    return vec.add(position, constants.MOVE_MOD_LEFT[direction]);
};

exports.shift_right = function(position, direction){
    return vec.add(position, constants.MOVE_MOD_RIGHT[direction]);
};

var direction_raw = exports.direction_raw = function(from, to){
    return (360+gamejs.utils.math.degrees(vec.angle([0, -1], vec.subtract(to, from)))) % 360;
}


var direction = exports.direction = function(from, to){
    //going from tile 'from' to tile 'to' returns angle at which actor would be facing, in degrees 
   return normalise_degrees(Math.round(direction_raw(from, to) /90) * 90);
};

exports.all_directions = function(from, to){
    //going from tile 'from' to tile 'to' returns array of possible angles to face
    //of which there might be two
    var directions = [];
    var raw_angle = direction_raw(from, to) / 90;
    if((raw_angle % 1) == 0){
        directions.push(normalise_degrees(raw_angle*90));
    }else {
        directions.push(normalise_degrees(Math.floor(raw_angle)*90));
        directions.push(normalise_degrees(Math.ceil(raw_angle)*90));
    }
    var pref_direction = direction(from, to);
    if(directions[0]!=pref_direction) directions.reverse();
    return directions;
};

exports.get_adjacent_positions = function(pos){
    var retv = [];
    constants.ANGLES.forEach(function(angle){
         retv.push(shift(pos, angle));
    });
    return retv;
};

exports.iter_adjacent = function(pos, callback, context){
    constants.ANGLES.forEach(function(angle){
         callback.apply(context, [shift(pos, angle)]);
    });
};

exports.process_options = function(object, options, default_options){
    if(!options) options = {};
    gamejs.utils.objects.keys(default_options).forEach(function(key){
       if(!(options[key] == undefined)){
           object[key] = options[key];
       } else {
           var def = default_options[key];
           if(def == required) throw 'option ' + key + ' required!';
           object[key] = def;
           options[key] = def;
       }        
    });
    
    object.options = options;
    
};

exports.extend = function (target){
    if(target){
        var source;
        for(var i=1;i<arguments.length;i++){
            source = arguments[i];
            if(source){
                for(var property in source){
                    target[property] = source[property];
                }
            }
        }
    }
    return target;
};

exports.instance_of = function(V, F) {
  var O = F.prototype;
  V = V.__proto__;
  while (true) {
    if (V === null)
      return false;
    if (O === V)
      return true;
    V = V.__proto__;
  }
};

exports.get_path_next_step = function(path){
    var npos = null;
    while(path.from){
        npos = path.point;
        path = path.from;
    }
    return npos;
};

var iter2d = exports.iter2d = function(size, callback, context){
    for(var x=0;x<size[0];x++){
        for(var y=0;y<size[1];y++){
           callback.apply(context, [[x, y]]);
        }
    }
};

var iter2drange = exports.iter2drange = function(from, to, callback, context){
    var fx, fy, tx, ty;
    if(from[0]<to[0]){
        fx = from[0]; 
        tx = to[0];      
    } else {
        fx = to[0];
        tx = from[0];
    };
    if(from[1]<to[1]){
        fy = from[1]; 
        ty = to[1];      
    } else {
        fy = to[1];
        ty = from[1];
    };
    for(var x=fx;x<=tx;x++){
        for(var y=fy;y<=ty;y++){
            callback.apply(context, [[x,y]]);
        }
    }  
};

//todo: optimize this? allow only bool values?
var Array2D = exports.Array2D = function(size, val){
    this.rows = [];
    this.size = size;
    for(var y=0;y<size[1];y++){
        var row = [];
        for(var x=0;x<size[0];x++){
            row.push(val)
        }
        this.rows.push(row);
    }
};

Array2D.load_bool = function(data){
    var retv = new Array2D(data.size, false);
    var rows = [];
    var row = [];
    for(var i=0;i<data.data.length;i++){
        if(data.data[i] == '|'){
            rows.push(row);
            row = [];
        } else {
            row.push(data.data[i]=='1' ? true : false);
        }
    };
    retv.rows = rows;
    return retv;
};

Array2D.prototype.serialize_bool = function(){
    var data='';
    var row;
    for(var y=0;y<this.rows.length;y++){
        row = this.rows[y];
        for(var x=0;x<row.length;x++){
            data += row[x] ? '1':'0';
        }
        if(y<this.rows.length)data +='|';
    }
    return {
        'size': this.size,
        'data':data
    }
};

Array2D.prototype.iter2d = function(callback, context){
      iter2d(this.size, function(pos){
          callback.apply(context, [pos, this.get(pos)]);
      }, this);
};

Array2D.prototype.get = function(pos){
    if(pos[0]<0 || pos[0]>=this.size[0] ||
       pos[1]<0 || pos[1]>=this.size[1]) return null;
       
    return this.rows[pos[1]][pos[0]];
};

Array2D.prototype.set = function(pos, val){
    this.rows[pos[1]][pos[0]] = val;  
};

Array2D.prototype.line_h = function(pos, modx, val){
    var c, mod;
    if(modx<0) mod = -1;
    else mod = 1;
    c = Math.abs(modx);
    for(var x=0;x<=c;x++) this.set([pos[0]+x*mod, pos[1]], val);
};

Array2D.prototype.line_v = function(pos, mody, val){
    var c, mod;
    if(mody<0) mod = -1;
    else mod = 1;
    c = Math.abs(mody);
    for(var y=0;y<=c;y++) this.set([pos[0], pos[1]+y*mod], val);
};

Array2D.prototype.cut = function(pos, size){
    var retv = new Array2D(size);
    iter2d(size, function(p){
        retv.set(p, this.get([p[0]+pos[0], p[1]+pos[1]]));
    }, this);
    return retv;
}

Array2D.prototype.square = function(pos, size, val, fill){
    if(!fill){
        this.line_h(pos, size[0]-1, val);
        this.line_h([pos[0], pos[1]+size[1]-1], size[0]-1, val);
        this.line_v(pos, size[1]-1, val);
        this.line_v([pos[0]+size[0]-1, pos[1]], size[1]-1, val);
    }else{
        iter2d(size, function(p){
            this.set([p[0]+pos[0], p[1]+pos[1]], val);
        }, this);
    }
};

exports.hvec = function(pos){
    //hash vector
    return pos[0]+'_'+pos[1];
};

exports.t = function(){
    return (new Date()).getTime(); 
};

exports.align_obj_to_wall = function(obj){
    constants.ANGLES.some(function(angle){
        if(obj.world.map.is_wall(exports.shift_back(obj.position, angle))){
            obj.set_angle(angle);
            return true;
        } 
    });  
};

var clonedict = exports.clonedict = function(d){
    var retv = {};    
    for(var key in d){
        if(d.hasOwnProperty(key)){
            retv[key] = d[key];
        }
    }
    return retv;
};




//mod js objects
Array.prototype.remove = function(from, to) {
  var rest = this.slice((to || from) + 1 || this.length);
  this.length = from < 0 ? this.length + from : from;
  return this.push.apply(this, rest);
};


exports.objectsEqual = function(obj, x) {
  var p;
  for(p in obj) {
      if(typeof(x[p])=='undefined') {return false;}
  }

  for(p in obj) {
      if (obj[p]) {
          switch(typeof(obj[p])) {
              case 'object':
                  if (!obj[p].equals(x[p])) { return false; } break;
              case 'function':
                  if (typeof(x[p])=='undefined' ||
                      (p != 'equals' && obj[p].toString() != x[p].toString()))
                      return false;
                  break;
              default:
                  if (obj[p] != x[p]) { return false; }
          }
      } else {
          if (x[p])
              return false;
      }
  }

  for(p in x) {
      if(typeof(obj[p])=='undefined') {return false;}
  }

  return true;
}
