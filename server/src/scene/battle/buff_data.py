# -*- coding: UTF-8 -*-
from __future__ import annotations
from typing import TypedDict, cast
from ...config.skill_config import *
from ...engine.common_svr import *
from ..player_data import *
import action

class buffer(TypedDict):
    type: em_buff_type
    value: int
    rounds: int

class buff_data:
    def __init__(self, entity_id:str):
        self.entity_id = entity_id
        self.buffers:list[buffer] = []

    def add_buff(self, buff:buffer):
        self.buffers.append(buff)

    def check_effect_buff(self, data:player_data):
        for buff in self.buffers:
            if buff["type"] == em_buff_type.em_heal_hp:
                data.attribute_data.hp += buff["value"]
            elif buff["type"] == em_buff_type.em_heal_mp:
                data.attribute_data.mp += buff["value"]
            elif buff["type"] == em_buff_type.em_damage_hp:
                data.attribute_data.hp -= buff["value"]
            elif buff["type"] == em_buff_type.em_damage_mp:
                data.attribute_data.mp -= buff["value"]

    def check_expired_buff(self):
        buffers:list[buffer] = []
        for buff in self.buffers:
            buff["rounds"] -= 1
            if buff["rounds"] > 0:
                buffers.append(buff)
        self.buffers = buffers

    def check_action(self, _action:action.action, self_info:battle_info, enemy_info:battle_info) -> action.action:
        for buff in self.buffers:
            if buff["type"] == em_buff_type.em_seal_action:
                return None
            
            elif self.buffers["type"] == em_buff_type.em_seal_skill:
                if _action["skill_id"] != SkillAttack and _action["skill_id"] != SkillDefend:
                    _action["skill_id"] = SkillAttack

            elif self.buffers["type"] == em_buff_type.em_confuse_attack_all:
                if _action["skill_id"] != SkillAttack and _action["skill_id"] != SkillDefend:
                    _action["skill_id"] = SkillAttack

                target:list[str] = []
                if self_info.battle_team0.abonus.hp > 0: target.append(self_info.battle_team0.entity_id)
                if self_info.battle_team1.abonus.hp > 0: target.append(self_info.battle_team1.entity_id)
                if self_info.curr_bbs0.bonus.hp > 0: target.append(self_info.curr_bbs0.entity_id)
                if self_info.curr_bbs1.bonus.hp > 0: target.append(self_info.curr_bbs1.entity_id)
                if self_info.battle_team0.abonus.hp > 0: target.append(self_info.battle_team0.entity_id)

                if enemy_info.battle_team0.abonus.hp > 0: target.append(enemy_info.battle_team0.entity_id)
                if enemy_info.battle_team1.abonus.hp > 0: target.append(enemy_info.battle_team1.entity_id)
                if enemy_info.curr_bbs0.bonus.hp > 0: target.append(enemy_info.curr_bbs0.entity_id)
                if enemy_info.curr_bbs1.bonus.hp > 0: target.append(enemy_info.curr_bbs1.entity_id)
                if enemy_info.battle_team0.abonus.hp > 0: target.append(enemy_info.battle_team0.entity_id)

                _action["target"] = random.choice(target)

            elif self.buffers["type"] == em_buff_type.em_confuse_attack_allies:
                if _action["skill_id"] != SkillAttack and _action["skill_id"] != SkillDefend:
                    _action["skill_id"] = SkillAttack
    
                    target:list[str] = []
                    if self_info.battle_team0.abonus.hp > 0: target.append(self_info.battle_team0.entity_id)
                    if self_info.battle_team1.abonus.hp > 0: target.append(self_info.battle_team1.entity_id)
                    if self_info.curr_bbs0.bonus.hp > 0: target.append(self_info.curr_bbs0.entity_id)
                    if self_info.curr_bbs1.bonus.hp > 0: target.append(self_info.curr_bbs1.entity_id)
                    if self_info.battle_team0.abonus.hp > 0: target.append(self_info.battle_team0.entity_id)
                    _action["target"] = random.choice(target)

        return _action
        

