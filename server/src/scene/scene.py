# -*- coding: UTF-8 -*-
from __future__ import annotations
from ..engine.engine import *
from ..engine.common_svr import *
from ..scene_map.scene_map_data import scene_map, get_scene_map
from .player_data import player_data
from .npc import npc
from .monster import monster

class mob_group:
    def __init__(self, area:str, scene_name:str, scene_line:int, _scene:scene, pos:position, max_mobs_num:int):
        self.area = area
        self.scene_name = scene_name
        self.scene_line = scene_line
        self.scene = _scene

        self.mobs:dict[str, monster] = {}
        self.scene.add_update(lambda : [mob.update(self.scene) for mob in self.mobs.values()])
        self.scene.add_update(self.__update_battle__)

        self.spawn_point = pos
        self.max_mobs_num = max_mobs_num

    def __spawn__(self, mob:monster):
        self.scene.group.create_remote_entity(mob)

    def __dead__(self, mob:monster):
        self.scene.group.remove_entity(mob)

    def __update_battle__(self):
        while len(self.mobs) < self.max_mobs_num:
            mob = monster()

class scene:
    def __init__(self, area:str, scene_name:str, scene_line:int):
        self.scene_name = scene_name
        self.scene_line = scene_line
        
        self.scene_map_data:scene_map = get_scene_map(scene_name)
        
        self.group = group()
        self.npcs:dict[int, npc] = {}
        self.players:dict[str, player_data] = {}

        with open('../../excel/NPC.json') as f:
            data = json.load(f)
            for s in data.value():
                if s["scene"] != self.scene_name:
                    continue
                self.npcs[s["id"]] = npc(f"{area}_{scene_line}", s["id"], str(uuid.uuid4()))

        self.updates:list[Callable[[], None]] = []

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