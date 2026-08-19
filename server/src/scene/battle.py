# -*- coding: UTF-8 -*-
from __future__ import annotations
from threading import Timer
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

        self.auto_battle_info:dict[str, int] = {}
        self.round_battle_info:dict[str, tuple[str, int]] = {}

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

    def __check_entity_complete_setting__(self, entity_id:str) -> bool:
        if entity_id in self.auto_battle_info:
            return True
        if entity_id in self.round_battle_info:
            return True
        return False

    def check_complete_round(self) -> bool:
        for d in self.self_info.battle_team:
            if not self.__check_entity_complete_setting__(d.entity_id):
                return False
        for d in self.enemy_info.battle_team:
            if not self.__check_entity_complete_setting__(d.entity_id):
                return False
        return True

    def battle_one_round(self):
        result = self.__check_battle_end__()
        if result:
            if result == em_victory_team.em_victory_team_enemy:
                if self.self_caller is not None: self.self_caller.battle_failed()
                if self.enemy_caller is not None: self.enemy_caller.battle_victory()
            elif result == em_victory_team.em_victory_team_self:
                if self.self_caller is not None: self.self_caller.battle_victory()
                if self.enemy_caller is not None: self.enemy_caller.battle_failed()
        else:
            self.round_battle_info.clear()
            if self.self_caller is not None: self.self_caller.battle_continue()
            if self.enemy_caller is not None: self.enemy_caller.battle_continue()
            if self.check_complete_round():
                Timer(3.99, self.battle_one_round).start()

    def on_auto_battle(self, entity_id:str, skill_id:int):
        self.auto_battle_info[entity_id] = skill_id

    def on_use_skill(self, entity_id:str, skill_id: int, target:str):
        self.round_battle_info[entity_id] = (target, skill_id)
        if self.check_complete_round():
            Timer(3.99, self.battle_one_round).start()