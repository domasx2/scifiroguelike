var gamejs = require('gamejs');
var constants = require('./constants');

var required = exports.required = '_PROPERTY_REQUIRED';
var i = parseInt;

exports.mod = function(position, mod){
    return [position[0]+mod[0], position[1]+mod[1]];  
};

exports.shift = function(position, direction){
    return [position[0]+constants.MOVE_MOD[direction][0], position[1]+constants.MOVE_MOD[direction][1]];
};

exports.shift_left = function(position, direction){
    return [position[0]+constants.MOVE_MOD_LEFT[direction][0], position[1]+constants.MOVE_MOD_LEFT[direction][1]];
};

exports.shift_right = function(position, direction){
    return [position[0]+constants.MOVE_MOD_RIGHT[direction][0], position[1]+constants.MOVE_MOD_RIGHT[direction][1]];
};

exports.process_options = function(object, options, default_options){
    
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
    
    if(!w || !h) return;

    var dst_rect = new gamejs.Rect([i(dst_offset[0]), i(dst_offset[1])], [i(w), i(h)]);
    var src_rect = new gamejs.Rect([i(src_offset[0]), i(src_offset[1])], 
                                   [i(w/zoom),      i(h/zoom)]);
    dst_surface.blit(src_surface, dst_rect, src_rect); 
    
                     
};

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

exports.clonedict = function(d){
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
