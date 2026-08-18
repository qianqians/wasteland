# -*- coding: UTF-8 -*-
from __future__ import annotations
import uuid
from ..engine.engine import *
from ..engine.common_svr import *
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

        self.npcs:dict[str, npc] = {}
        with open('../../excel/NPC.json') as f:
            data = json.load(f)
            for s in data.value():
                if s["scene"] != self.scene_name:
                    continue
                self.npcs[s["id"]] = npc(f"{self.scene_name}_{scene_line}", s["id"], str(uuid.uuid4()))

        self.mobs:dict[str, mob] = {}
                
        self.updates:list[Callable[[], None]] = []
        self.add_update(lambda : [p.scene_data.update(self.scene_map_data) for p in self.players.values()])

    def add_update(self, update:Callable[[], None]):
        self.updates.append(update)

    def update(self):
        if len(self.players) <= 0:
            return

        for call in self.updates:
            call()

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