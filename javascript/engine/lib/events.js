exports.eventify = function(obj){
    obj._callbacks = {};
    obj._observed_by = [];
    
    function evlist(events){
        if( Object.prototype.toString.call( events ) != '[object Array]' ){
            events = [events];
        }
        return events;
    };
    
    obj._suppress_events = false;

    function observefn(event){
        this.fire(prefix+':'+event, args.slice(1));
    }

    obj.observe = function(prefix, target){
        if(target.hasOwnProperty('_observed_by')){
            target._observed_by.push({
                observer: this,
                prefix: prefix
            });
        } else {
            console.log('trying to observe unobservable!', target);
        }
    };

    obj.unobserve = function(target){
        var observed_by = [];
        target._observed_by.forEach(function(o){
            if(!(o.observer === this)) observed_by.push(o);
        }, this);
        target._observed_by = observed_by;
    };
    
    obj.on = function(events, callback, context, once){    
        evlist(events).forEach(function(event){
            if(!this._callbacks[event]) this._callbacks[event] = [];
            this._callbacks[event].push([callback, context, once]);
        }, this)
    };
    
    
    obj.off = function(events, callback, context){
        if(!(callback || context)){
            console.log('Off called without arguments.');
            return;
        }
        evlist(events).forEach(function(event){
            if(this._callbacks[event]){
                var nlist = [];
                this._callbacks[event].forEach(function(cb){
                    if(!((cb[0].toString()==callback.toString() || !callback) && (cb[1]==context || !context))) nlist.push(cb);
                    
                }, this);
                this._callbacks[event] = nlist;
            } 
        }, this);
    };

    obj.__trigger = function(event, args){
        if(this._callbacks[event]){
            var l = [];
            this._callbacks[event].forEach(function(cb){
                cb[0].apply(cb[1], args);
                if(!cb[2]) l.push(cb);
            }, this);
            this._callbacks[event] = l;
        }
    };
    
    obj.fire = function(event, args){
        args = (args || []).slice(0);
        //console.log(event, args);
        if(this._suppress_events) return;
        
        if(this.iter_prefixed){
            this.iter_prefixed('on_'+event, function(fn){
                fn.apply(this, args || []);
            }, this, true);
        }

        if(!args) args = [this];
        else args.splice(0, 0, this);
        this.__trigger(event, args);

        this._observed_by.forEach(function(o){
            o.observer.fire(o.prefix+':'+event, args);
        });

        args.splice(0, 0, event);
        this.__trigger('*', args);
    };
}
