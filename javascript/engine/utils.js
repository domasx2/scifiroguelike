var gamejs = require('gamejs');

var required = exports.required = '_PROPERTY_REQUIRED';
var i = parseInt;

exports.process_options = function(object, options, default_options){
    
    gamejs.utils.objects.keys(default_options).forEach(function(key){
       if(!(options[key] == undefined)){
           object[key] = options[key];
       } else {
           var def = default_options[key];
           if(def == required) throw 'option ' + key + ' required!';
           object[key] = def;
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
    
    var w = Math.min(dst_available[0], src_available[0]);
    var h = Math.min(dst_available[1], src_available[1]);
  

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

Array2D.prototype.square = function(pos, size, val){
    this.line_h(pos, size[0]-1, val);
    this.line_h([pos[0], pos[1]+size[1]-1], size[0]-1, val);
    this.line_v(pos, size[1]-1, val);
    this.line_v([pos[0]+size[0]-1, pos[1]], size[1]-1, val);  
};
