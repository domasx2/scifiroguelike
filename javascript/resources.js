exports.images = ['./public/img/tiles/default.png',
                  './public/img/characters/protagonist.png',
                  './public/img/characters/engineer.png',
                  './public/img/tiles/fogofwar.png',
                  
                  './public/img/items/pistol.png',
                  './public/img/items/pistol_clip.png',
                  './public/img/items/medkit.png',
                  
                  './public/img/misc/action_move.png'];
                  
      
      
exports.tilesheets = {
    'default': {'url':'./public/img/tiles/default.png',
                'floor': [1, 1],
                'wallmap': {
                    'xxx x11 x10':[0, 0],
                    'xxx 111 x0x':[1, 0],
                    'xxx 11x 01x':[2, 0],
                    'x0x 011 x1x':[3, 0],
                    'x0x 110 x1x':[4, 0],
                    
                    'x1x x10 x1x':[0, 1],
                    'x1x 01x x1x':[2, 1],
                    'x1x 011 x0x':[3, 1],
                    'x1x 110 x0x':[4, 1],
                    
                    'x10 x11 xxx':[0, 2],
                    'x0x 111 xxx':[1, 2],
                    '01x 11x xxx':[2, 2],
                    'x0x 110 x0x':[4, 2],
                    
                    'x0x 010 x1x':[1, 3],
                    'x0x 010 x0x':[2, 3],
                    'x1x 010 x0x':[3, 3],
                    'x0x 011 x0x':[4, 3]
                }
           }
};           
 
exports.sprites = {
    //FOG OF WAR
    'fogofwar_dark':{
        'spritesheet_url':'./public/img/tiles/fogofwar.png',
        'type':'static'
    },
    
    'fogofwar_explored':{
        'spritesheet_url':'./public/img/tiles/fogofwar.png' ,
        'type':'static',
        'offset':[16, 0] 
    },
    //PROTAGONIST
    'protagonist_static':{
        'type':'static',
        'angle_step': 90,
        'spritesheet_url':'./public/img/characters/protagonist.png',
    },
    'protagonist_move':{
        'type':'animated',
        'angle_step':90,
        'spritesheet_url':'./public/img/characters/protagonist.png',
        'frame_sequence':[0, 1, 0, 2],
        'duration': 400,
        'loop': true
    },
    
    //ENGINEER
    'engineer_static':{
        'type':'static',
        'angle_step': 90,
        'spritesheet_url':'./public/img/characters/engineer.png',
    },
    'engineer_move':{
        'type':'animated',
        'angle_step':90,
        'spritesheet_url':'./public/img/characters/engineer.png',
        'frame_sequence':[0, 1, 0, 2],
        'duration': 500,
        'loop': true
    },
    
    //ITEMS
    'pistol_static':{
        'type':'static',
        'offset':[16, 0],
        'spritesheet_url':'./public/img/items/pistol.png'
    },
    
    'pistol_inventory':{
        'type':'static',
        'spritesheet_url':'./public/img/items/pistol.png'
    },
    
    'pistol_clip_static':{
        'type':'static',
        'offset':[16, 0],
        'spritesheet_url':'./public/img/items/pistol_clip.png'
    },
    
    'pistol_clip_inventory':{
        'type':'static',
        'spritesheet_url':'./public/img/items/pistol_clip.png'
    },
    
    'medkit':{
        'type':'static',
        'spritesheet_url':'./public/img/items/medkit.png'
    },
    
    //PARTICLES
    
    'action_move':{
        'type':'animated',
        'spritesheet_url':'./public/img/misc/action_move.png',
        'duration':300
    }
    
    
}
