# -*- coding: UTF-8 -*-
from __future__ import annotations
from ...engine.common_svr import *
from ...scene_map.scene_map_data import *
from ..scene import scene
from ..monster import monster
from ..player_data import player_data

def __get_hurt_player__(mob:monster, _scene:scene) -> player_data:
    hurt_max = 0
    hurt_max_player = None
    for _player_id, hurt in mob.hurt_list:
        if hurt > hurt_max:
            hurt_max = hurt
            hurt_max_player = _scene.players[_player_id]
    return hurt_max_player

def Update(mob:monster, _scene:scene):
    dir:direction = direction.none
    p = __get_hurt_player__(mob, _scene)
    if p != None:
        if mob.pos.x > p.scene_data.postion.x:
            dir = direction.left
        else:
            dir = direction.right
    else:
        dir = random.randint(direction.left, direction.right)

    dir_c = -1
    if dir == direction.right:
        dir_c = 1

    begin_x = mob.pos.x
    timestamp = time.time()
    timeDetail = timestamp - mob.update_timestamp
    x = mob.pos.x + mob.speed * timeDetail * dir_c
    
    element = _scene.scene_map_data.map_data[mob.pos.y*_scene.scene_map_data.map_width_box + x/16]
    if element._property == em_map_element_property.em_map_map:
        mob.pos.x = x

    if not mob.is_use_skill():
        player_list:list[player_data] = []
        for p in _scene.players.values():
            player_x = p.scene_data.postion.x
            if player_x >= begin_x and player_x <= mob.pos.x:
                player_list.append(p)

        attack_player:list[player_data] = []
        skill_info = None
        for mob_skill in mob.skill:
            for p in player_list:
                rang = p.scene_data.postion.x - mob.pos.x
                if mob_skill.attack_range >= abs(rang) and mob_skill.cd_ready < time.time():
                    attack_player.append(p)
                    skill_info = mob_skill
            if len(attack_player) > 0:
                break
        
        for p in attack_player:
            mob.use_skill(p, skill_info)
                      
    mob.update_timestamp = timestamp
    