# -*- coding: UTF-8 -*-
from __future__ import annotations
from ..engine.common_svr import *
from ..engine.battle_svr import *
from ..scene.scene import *
from ..scene.player_data import *

class skill_data:
    def __init__(self, user_id:str, info:dict):
        self.user_id = user_id
        
        self.skills:dict[int, skill_info] = {}
        for id, skill in info.items():
            self.skills[id] = protcol_to_skill_info(skill)

        self.use_skill_cast_spells = float(0)
        self.use_skill_timer:Timer = None

    def info(self) -> dict:
        return { id: skill_info_to_protcol(skill) for id, skill in self.skills.items() }

    def learn_skill(self, skill: skill_info):
        if skill.skill_id not in self.skills:
            self.skills[skill.skill_id] = skill

    def has_learned_skill(self) -> bool:
        return len(self.skills) > 0
    
    def use_skill(self, skill_id:int, p:player_data, _scene:scene) -> bool:
        if self.use_skill_cast_spells > time.time():
            return False
        skill_info = self.skills[skill_id]
        if skill_info == None:
            return False
        
        player_x = p.scene_data.postion.x
        player_y = p.scene_data.postion.y
        dir = p.scene_data.postion.dir
        mob_list:list[monster] = []
        if dir == direction.left:
            for mob_spawn in _scene.mob_spawn:
                for mob in mob_spawn.mobs.values():
                    if mob.pos.y != player_y:
                        break
                    if mob.pos.x < player_x and (mob.pos.x + skill_info.attack_range) > player_x:
                        mob_list.append(mob)
        elif dir == direction.right:
            for mob_spawn in _scene.mob_spawn:
                for mob in mob_spawn.mobs.values():
                    if mob.pos.y != player_y:
                        break
                    if mob.pos.x > player_x and (mob.pos.x - skill_info.attack_range) < player_x:
                        mob_list.append(mob)

        for mob in mob_list:
            mob.be_harm(p.player_id, skill_id, em_harm_type.melee_attack, skill_info.attack, p.attribute_data.base_attack)

def skill_create() -> skill_data:
    return skill_data({})