exports.penitentiary={
    generator:{
        type:'dungeon',
        options:{
           size: [100, 100],
           max_corridor_length:4,
           min_corridor_length:2,
           corridor_density: 0.5,
           symmetric_rooms: true,
           interconnects: 8,
           rooms:{
               initial:{
                   min_size:[3, 3],
                   max_size:[3, 3],
                   max_exits:1
               },
               any:{
                   min_size:[2, 2],
                   max_size:[5, 5],
                   max_exits:4
               }
           }
        },
        rooms:30
    },
    populator:{
        type:'base',
        options:{
            single_exit_door_density:1,
            multi_exit_door_density:0.4,
            door_type:'rdoor',
            rooms:{
                initial:{
                    objects:[
                        {
                            type:'rchest',
                            content:[
                                {type:'pistol'},
                                {type:'pistol_clip_lov'},
                                {type:'pistol_clip_incendiary'}
                            ]
                        }
                    ],
                },
                any: {
                    objects:[
                        {
                            type:'rchest',
                            filter:{
                                max_exits:1,
                                min_exits:1
                            },
                            content:[
                                  {
                                      type:'pistol_clip_lov',
                                      prob:1
                                  },
                                  {
                                      type:'pistol_clip_lov',
                                      prob:0.3
                                  }
                            ]
                        },
                        {
                            type:'rchest',
                            prob: 0.2,
                            filter:{
                                min_exits:2
                            },
                            content:[
                                  {
                                      type:'pistol_clip_lov',
                                      prob:0.8
                                  }
                            ]
                        },
                        {
                            type:'crawler',
                            prob:0.5
                        }
                        
                    ]
                }
            }
        }
    }
}