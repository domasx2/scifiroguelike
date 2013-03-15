exports.images = ['./public/img/tiles/default.png',
                  './public/img/characters/protagonist.png',
                  './public/img/characters/engineer.png',
                  './public/img/characters/crawler.png',
                  './public/img/tiles/fogofwar.png',
                  
                  './public/img/items/pistol.png',
                  './public/img/items/pistol_clip.png',
                  './public/img/items/pistol_clip_lov.png',
                  './public/img/items/pistol_clip_incendiary.png',
                  './public/img/items/medkit.png',
                  
                   './public/img/items/wrench.png',
                  
                  './public/img/misc/action_move.png',
                  './public/img/misc/bloodstain.png',
                  './public/img/misc/blood_hit.png',
                  './public/img/misc/bullet.png',
                  
                  './public/img/objects/chest.png',
                  './public/img/objects/door.png'];
                  
      
      
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

var bloodstain = {
    'spritesheet_url':'./public/img/misc/bloodstain.png',
    'angle_step':90,
    'type':'static'
}    
 
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
    
    'protagonist_dead':bloodstain,
    
    'protagonist_attack_melee':{
        'type':'animated',
        'angle_step':90,
        'spritesheet_url':'./public/img/characters/protagonist.png',
        'frame_sequence':[4, 5, 4],
        'duration': 200,
        'loop': true
    },
    
    'protagonist_attack_ranged':{
        'type':'animated',
        'angle_step':90,
        'spritesheet_url':'./public/img/characters/protagonist.png',
        'frame_sequence':[3],
        'duration': 200,
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
        'duration': 400,
        'loop': true
    },
    
    //CRAWLER
    'crawler_static':{
        'type':'static',
        'angle_step':90,
        'spritesheet_url':'./public/img/characters/crawler.png'
    },
    
    'crawler_move':{
        'spritesheet_url':'./public/img/characters/crawler.png',
        'type':'animated',
        'angle_step':90,
        'duration':400,
        'loop':true,
        'frame_sequence':[0, 1, 2, 1, 0, 3, 4, 3, 0]
    },
    
    'crawler_attack_melee':{
        'spritesheet_url':'./public/img/characters/crawler.png',
        'type':'animated',
        'angle_step':90,
        'duration':300,
        'loop':true,
        'frame_sequence':[0, 5, 6, 0]
    },
    
    'crawler_dead':bloodstain,
    
    //ITEMS
    'wrench_static':{
        'type':'static',
        'offset':[16, 0],
        'spritesheet_url':'./public/img/items/wrench.png'
    },
    
    'wrench_inventory':{
        'type':'static',
        'spritesheet_url':'./public/img/items/wrench.png'
    },
    
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
    
    'pistol_clip_lov_static':{
        'type':'static',
        'offset':[16, 0],
        'spritesheet_url':'./public/img/items/pistol_clip_lov.png'
    },
    
    'pistol_clip_lov_inventory':{
        'type':'static',
        'spritesheet_url':'./public/img/items/pistol_clip_lov.png'
    },
    
    'pistol_clip_incendiary_static':{
        'type':'static',
        'offset':[16, 0],
        'spritesheet_url':'./public/img/items/pistol_clip_incendiary.png'
    },
    
    'pistol_clip_incendiary_inventory':{
        'type':'static',
        'spritesheet_url':'./public/img/items/pistol_clip_incendiary.png'
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
    },
    
    'blood_hit':{
        'type':'animated',
        'spritesheet_url':'./public/img/misc/blood_hit.png',
        'duration':300
    },
    
    'bullet':{
        'type':'static',
        'spritesheet_url':'./public/img/misc/bullet.png',
        'angle_step':10,
        'cell_size':[3, 3]  
    },
    
    //OBJECTS
    //chest
    'chest_full':{
        'type':'static',
        'spritesheet_url':'./public/img/objects/chest.png',
        'angle_step':90      
    },
    
    'chest_empty':{
        'type':'static',
        'spritesheet_url':'./public/img/objects/chest.png',
        'angle_step':90,
        'offset':[64, 0]
    },
    
    'chest_open':{
        'type':'static',
        'spritesheet_url':'./public/img/objects/chest.png',
        'angle_step':90,
        'offset':[48, 0]
    },
    
    'chest_open_anim':{
        'type':'animated',
        'spritesheet_url':'./public/img/objects/chest.png',
        'angle_step':90,
        'frame_sequence':[1, 2, 3],
        'duration':300
    },
    
    'chest_close_anim':{
        'type':'animated',
        'spritesheet_url':'./public/img/objects/chest.png',
        'angle_step':90,
        'frame_sequence':[3, 2, 1],
        'duration':300
    },
    
    //door
    'door_closed':{
        'type':'static',
        'spritesheet_url':'./public/img/objects/door.png',
        'angle_step':90,
    },
    
    'door_open':{
        'type':'static',
        'spritesheet_url':'./public/img/objects/door.png',
        'offset':[112, 0],
        'angle_step':90,
    },
        
    'door_open_anim':{
        'type':'animated',
        'spritesheet_url':'./public/img/objects/door.png',
        'frame_sequence':[1, 2, 3, 4, 5, 6, 7],
        'angle_step':90,
        'duration':200
    },
    
    'door_close_anim':{
        'type':'animated',
        'spritesheet_url':'./public/img/objects/door.png',
        'frame_sequence':[6, 5, 4, 3, 2, 1, 0],
        'angle_step':90,
        'duration':200
    },   
}
