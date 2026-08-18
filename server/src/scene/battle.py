# -*- coding: UTF-8 -*-
from __future__ import annotations
from ..engine.engine import *
from ..engine.battle_ntf_client_svr import *
from .player_data import *
from .scene import *

class battle:
    def __init__(self, _scene:scene, self_handle:player_data, enemy_handle:player_data, self_info:battle_info, enemy_info:battle_info, battle_module:battle_module):
        self.scene = _scene

        if self_handle is not None: self.self_caller = battle_ntf_client_caller(self_handle)
        if enemy_handle is not None: self.enemy_caller = battle_ntf_client_caller(enemy_handle)

        self.self_info = self_info
        self.enemy_info = enemy_info
        self.__ntf_battle_info__()

        self.battle_module = battle_module
        self.battle_module.on_auto_battle.append(lambda rsp, skill_id: self.on_auto_battle(rsp, skill_id))
        self.battle_module.on_use_skill.append(lambda rsp, skill_id, target: self.on_use_skill(rsp, skill_id, target))

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
        pass

    def on_auto_battle(self, rsp:battle_auto_battle_rsp, skill_id:int):
        pass

    def on_use_skill(self, rsp:battle_use_skill_rsp, skill_id: int, target:str):
        pass