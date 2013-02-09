var utils = require('../utils');
var eventify = require('../lib/events').eventify;

var Dialog = exports.Dialog = function(options){
    utils.process_options(this, options, {
        'id':utils.required,
        'title':utils.required,
        'close_button':false,
        'position':[10, 10],
    });
    this.dialog = $('<div class="item-container" id="'+this.id+'" title="'+this.title+'"></div>').dialog({
        minWidth: 50,
        minHeight: 100,
        width: 200,
        height: 100,
        position: this.position
    });

    if(!this.close_button){
        this.dialog.parent().find('.ui-dialog-titlebar-close').remove();
    }
    this.dialog.parent().find('.ui-dialog-buttonpane').remove();
};

Dialog.prototype.show = function(){
    this.dialog.parent().show();  
};

Dialog.prototype.hide = function(){
    this.dialog.parent().hide();
};


var ContextMenu = exports.ContextMenu = function(options){
    eventify(this);
    utils.process_options(this, options, {
        items: utils.required,
        position: utils.required      
    });  
    this.dom = $('<div class="context-menu"><ul></ul></div>');
    this.dom.css({
        top:this.position[1]-3,
        left: this.position[0]-3 
    });
    $('body').append(this.dom);
    var ul = this.dom.find('ul');
    this.items.forEach(function(item){
        var li = $('<li>'+item.label+'</li>');
        ul.append(li);
        li.click($.proxy(function(action, event){
            this.fire('click_item', [action]);
            this.destroy();
        }, this, item.action));
    }, this);
    
    this.dom.mouseleave($.proxy(this.destroy, this));
};

ContextMenu.prototype.destroy = function(){
   this.dom.remove();
};
