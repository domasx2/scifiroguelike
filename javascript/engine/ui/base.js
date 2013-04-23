var utils = require('../utils');
var eventify = require('../lib/events').eventify;
var game = require('../game').game;

game.uimanager.c('base',{
    'init':function(scene){
          this.scene = scene;
          eventify(this);
          this.create_dom();
          this.call_all('init', [scene]);
     },
     
     'position':[0, 0],
     
     'title':'Ui component',
     
     'create_dom':function(scene){
          this.dom = $('<div>'+this.title+'</div>');
          this.fire('create_dom');
          this.attach_dom();
          this.position_dom();
     },
     
     'position_dom':function(){
        this.dom.css({
            top:this.position[1]-3,
            left: this.position[0]-3,
            position: 'absolute'
        });
     },
     
     'attach_dom':function(){
         $('body').append(this.dom);
     },
     
     'show':function(){
         this.dom.show();
     },
     
     'hide':function(){
         this.dom.hide();
     },
     
     'destroy':function(){
         this.dom.remove();
         this.call_all('destroy');
         this.fire('destroy');
     }
});

game.uimanager.c('dialog', {
    '_requires':'base',
    
    'close_button':false,
    
    'create_dom':function(){
        var dialog_options = {
            width: 200,
            height: 120,
            position: this.position
        }
        this.fire('dialog_options', [dialog_options]);
        this.dialog = $('<div class="item-container" id="ui_'+this.id+'" title="'+this.title+'"></div>').dialog(dialog_options);
        this.dom = this.dialog.parent();
    
        this.dom.find('.ui-dialog-titlebar-close').remove();
        this.dom.find('.ui-dialog-buttonpane').remove();
        if(this.close_button){
            this.close_btn = $('<a class="ui-dialog-close-link">x</a>');
            this.dom.find('.ui-dialog-titlebar').append(this.close_btn);
            this.close_btn.click($.proxy(this.close, this));
        }
        this.fire('create_dom');
    },
    
    'close':function(){
        this.hide();
        this.fire('close');
    }
});



game.uimanager.c('context_menu', {
    '_requires':'base',
    'create_dom':function(scene){
        this.dom = $('<div class="context-menu"><ul></ul></div>');
        this.attach_dom();
        this.position_dom();
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
     
    }  
     
});