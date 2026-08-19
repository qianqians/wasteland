# -*- coding: UTF-8 -*-
from __future__ import annotations
from ..engine.engine import *
from ..engine.battle_ntf_client_svr import *
from .player_data import *
from .scene import *

class em_victory_team(Enum):
    em_victory_battle_keep_going = 0
    em_victory_team_self = 1
    em_victory_team_enemy = -1

class battle:
    def __init__(self, _scene:scene, self_handle:player_data, enemy_handle:player_data, self_info:battle_info, enemy_info:battle_info):
        self.scene = _scene

        if self_handle is not None: self.self_caller = battle_ntf_client_caller(self_handle)
        if enemy_handle is not None: self.enemy_caller = battle_ntf_client_caller(enemy_handle)

        self.self_info = self_info
        self.enemy_info = enemy_info
        self.__ntf_battle_info__()

        #self.battle_module = battle_module
        #self.battle_module.on_auto_battle.append(lambda rsp, skill_id: self.on_auto_battle(rsp, skill_id))
        #self.battle_module.on_use_skill.append(lambda rsp, skill_id, target: self.on_use_skill(rsp, skill_id, target))

        self.auto_battle_info:dict[str, int] = {}

    def __ntf_battle_info__(self):
        if self.self_caller is not None: self.self_caller.start_battle(self.self_info, self.enemy_info)
        if self.enemy_caller is not None: self.enemy_caller.start_battle(self.enemy_info, self.self_info)

    #
    # 一个队伍的所有角色倒下即战斗结束
    # self  胜利返回 1
    # enemy 胜利返回 -1
    # 战斗未结束返回 0
    #
    def __check_battle_end__(self) -> int:
        is_failed = True
        for d in self.self_info.battle_team:
            if d.abonus.hp > 0:
                is_failed = False
                break
        if is_failed:
            return em_victory_team.em_victory_team_enemy

        is_failed = True
        for d in self.enemy_info.battle_team:
            if d.abonus.hp > 0:
                is_failed = False
                break
        if is_failed:
            return em_victory_team.em_victory_team_self
        return em_victory_team.em_victory_battle_keep_going

    def on_auto_battle(self, entity_id:str, skill_id:int):
        self.auto_battle_info[entity_id] = skill_id

    def on_use_skill(self, rsp:battle_use_skill_rsp, skill_id: int, target:str):
        pass