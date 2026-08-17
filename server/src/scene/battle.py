# -*- coding: UTF-8 -*-
from __future__ import annotations
from ..engine.engine import *
from ..engine.battle_ntf_client_svr import *
from .player_data import *

class battle:
    def __init__(self, self_handle:player_data, enemy_handle:player_data):
        self.self_handle = self_handle
        self.enemy_handle = enemy_handle

        self.self_caller = battle_ntf_client_caller(self.self_handle)
        self.enemy_caller = battle_ntf_client_caller(self.enemy_handle)

        self.self_info = self.self_handle.battle_info()
        self.enemy_info = self.enemy_handle.battle_info()

    def ntf_battle_info(self):
        self.self_caller.start_battle(self.self_info, self.enemy_info)
        self.enemy_caller.start_battle(self.enemy_info, self.self_info)
