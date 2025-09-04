# -*- coding: UTF-8 -*-
from __future__ import annotations
from ..engine.engine import *
from ..scene_map.scene_map_data import scene_map, get_scene_map
from .player_data import player_data
from .npc import npc
from .monster import monster

class scene:
    def __init__(self, scene_name:str, scene_line:int):
        self.scene_name = scene_name
        self.scene_line = scene_line
        
        self.scene_map_data = get_scene_map(scene_name)
        
        self.group = group()
        self.npcs:dict[int, npc] = {}
        self.players:dict[str, player_data] = {}
        self.mobs:dict[str, monster] = {}

    def update(self):
        for mob in self.mobs.values():
            mob.update(self)

    def entry_scene(self, player:player_data):
        self.group.join((player.client_gate_name, player.client_conn_id))
        self.group.create_remote_player(player)

        self.players[player.player_id] = player
        
    def leave_scene(self, player:player_data):
        self.players.pop(player.player_id)

        self.group.remove_player(player)
        self.group.leave((player.client_gate_name, player.client_conn_id))

    def have_npc(self, npc_id:int):
        return npc_id in self.npcs