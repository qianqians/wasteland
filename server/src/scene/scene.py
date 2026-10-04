# -*- coding: UTF-8 -*-
from __future__ import annotations
import uuid
from ..engine.engine import *
from ..engine.common_svr import *
from ..config.scene_config import *
from .scene_map_data import scene_map, get_scene_map
from .player_data import player_data
from .npc import npc
from .mob import mob

class scene:
    def __init__(self, area:str, scene_name:str, scene_line:int):
        self.area = area
        self.scene_name = scene_name
        self.scene_line = scene_line

        self.scene_map_data:scene_map = get_scene_map(scene_name)

        self.group = group()
        self.players:dict[str, player_data] = {}

        self.novice_village:list[scene_novice_village] = []
        self.spawn_point:postion = None

        self.npcs:dict[str, npc] = {}
        '''
        with open('../../excel/NPC.json') as f:
            data = json.load(f)
            for s in data.value():
                if s["scene"] != self.scene_name:
                    continue
                self.npcs[s["id"]] = npc(f"{self.scene_name}_{scene_line}", s["id"], str(uuid.uuid4()))
        '''

        self.mobs:dict[str, mob] = {}

        self.__updates__:list[Callable[[], None]] = []
        self.__add_update__(lambda : [p.scene_data.update(self.scene_map_data) for p in self.players.values()])

        self.__try_set_online()

    def __try_set_online(self):
        timeout_player = []
        for player in self.players.values():
            if time.time() - player.last_access_time > 10:
                timeout_player.append(player)
            else:
                player.set_online()

        for player in timeout_player:
            self.leave_scene(player)

        __t__ = Timer(2.0, self.__try_set_online)
        __t__.daemon = True
        __t__.start()

    def __add_update__(self, update:Callable[[], None]):
        self.__updates__.append(update)

    def update(self):
        if len(self.players) <= 0:
            return

        for call in self.__updates__:
            call()

    def entry_scene(self, player:player_data):
        self.group.join(player.entity_id, (player.client_gate_name, player.client_conn_id))
        self.group.create_remote_player(player)
        self.players[player.user_id] = player

    def leave_scene(self, player:player_data):
        del self.players[player.user_id]

        self.group.remove_player(player)
        self.group.leave((player.client_gate_name, player.client_conn_id))

    def have_npc(self, npc_id:int):
        return npc_id in self.npcs
