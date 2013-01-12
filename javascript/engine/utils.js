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
  

    var dst_rect = new gamejs.Rect(dst_offset, [w, h]);
    var src_rect = new gamejs.Rect([src_offset[0], src_offset[1]], 
                                   [i(w/zoom),      i(h/zoom)]);                            
    dst_surface.blit(src_surface, dst_rect, src_rect);                        
}
