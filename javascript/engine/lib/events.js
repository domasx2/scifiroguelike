exports.eventify = function(obj){
    obj._callbacks = {};
    obj.on = function(events, callback, context){
        if( Object.prototype.toString.call( events ) != '[object Array]' ){
            events = [events];
        }
        events.forEach(function(event){
            if(!this._callbacks[event]) this._callbacks[event] = [];
            this._callbacks[event].push([callback, context]);
        }, this)
    };
    
    obj.fire = function(event, args){
        if(!args) args = [this];
        else args.splice(0, 0, this);
        if(this._callbacks[event]){
            this._callbacks[event].forEach(function(cb){
                cb[0].apply(cb[1], args);
            }, this);
        }
    }
}
