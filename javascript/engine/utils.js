var gamejs = require('gamejs');
var vec = gamejs.utils.vectors;
var constants = require('./constants');
var eventify = require('./lib/events').eventify;
var game = require('./game').game;

var required = exports.required = '_PROPERTY_REQUIRED';
var i = parseInt;


exports.pos_px = function(world_pos){
    //world tile position into pixel position
    return vec.multiply(world_pos, game.tw);
}

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

exports.direction = function(from, to){
    //going from tile 'from' to tile 'to' returns angle at which actor would be facing, in degrees
    var angle = (360+gamejs.utils.math.degrees(vec.angle([0, -1], vec.subtract(to, from)))) % 360;
    var retv= parseInt(angle / 90) * 90;
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
}

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

exports.draw = function(dst_surface, src_surface, dst_offset, src_offset, zoom, size){
    //wow this is a cryptic mess
    var dst_size = dst_surface.getSize();
    var dst_available = [dst_size[0]-dst_offset[0], dst_size[1]-dst_offset[1]];
    
    if(size){
        var src_size = size;
        var src_available = [size[0] * zoom, size[1] * zoom];
    } else {
        var src_size = src_surface.getSize();
        var src_available = [(src_size[0] - src_offset[0]) * zoom, (src_size[1] - src_offset[1]) * zoom];
    }
    
    var w = Math.max(Math.min(dst_available[0], src_available[0]), 0);
    var h = Math.max(Math.min(dst_available[1], src_available[1]), 0);
    
    if(!i(w/zoom) || !i(h/zoom)) return;

    var dst_rect = new gamejs.Rect([i(dst_offset[0]), i(dst_offset[1])], [i(w), i(h)]);
    var src_rect = new gamejs.Rect([i(src_offset[0]), i(src_offset[1])], 
                                   [i(w/zoom),      i(h/zoom)]);
                             
    dst_surface.blit(src_surface, dst_rect, src_rect); 

    
                     
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


//collection of game Objects
var Collection = exports.Collection = function(objects){
    this.objects = [];  
    this.objects_by_id = {};
    eventify(this);
    if(objects){
        objects.forEach(function(obj){
            this.add(obj); 
        }, this);
    }
};

Collection.prototype.get_by_type = function(type){
    for(var i=0;i<this.objects.length;i++){
        if(this.objects[i].is_type(type)) return this.objects[i];
    }
    return null;
};

Collection.prototype.add = function(obj){
    this.objects.push(obj);
    this.objects_by_id[obj.id] = obj;
    this.fire('add', [obj]);
    obj.on('destroy', this.remove, this);
};

Collection.prototype.remove = function(obj){
    for(var i=0;i<this.objects.length;i++){
        if(this.objects[i].id == obj.id){
            this.objects.splice(i, 1);
            break;
        }
    }
    delete this.objects_by_id[obj.id];
    this.fire('remove', [obj]);
    obj.off('destroy', this.remove, this);
};


Collection.prototype.by_id = function(id){
    return this.objects_by_id[id];
};

Collection.prototype.has = function(obj){
   return this.objects_by_id[obj.id] ? true : false;  
};

Collection.prototype.iter = function(cb, context){
    this.objects.forEach(cb, context);  
};

Collection.prototype.clone = function(){
    var retv = new Collection();
    retv.objects = this.objects.slice(0);
    retv.objects_by_id = clonedict(this.objects_by_id);
    return retv;
};

Collection.prototype.pop = function(){
    var obj = this.objects[0];
    this.remove(obj);
    return obj; 
};

Collection.prototype.len = function(){
    return this.objects.length;  
};

Collection.prototype.by_pos = function(pos, type){
    var retv=[];
    this.iter(function(obj){
        if((obj.position[0] == pos[0]) && (obj.position[1]==pos[1])
        && (!type || obj.is_type(type))) retv.push(obj);
    });
    return retv;
};


Collection.prototype.serialize = function(){
    var retv = [];
    this.iter(function(obj){
        retv.push(obj.id);
    }); 
    return retv;
};

//mod js objects
Array.prototype.remove = function(from, to) {
  var rest = this.slice((to || from) + 1 || this.length);
  this.length = from < 0 ? this.length + from : from;
  return this.push.apply(this, rest);
};

