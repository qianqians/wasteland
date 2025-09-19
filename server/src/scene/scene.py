# -*- coding: UTF-8 -*-
from __future__ import annotations
import uuid
from ..engine.engine import *
from ..engine.common_svr import *
from ..scene_map.scene_map_data import scene_map, get_scene_map
from .player_data import player_data
from .npc import npc
from .monster import monster

class mob_group:
    def __init__(self, _scene:scene, mob_table_id:int, pos:position, max_mobs_num:int):
        self.scene = _scene
        self.area = self.scene.area
        self.scene_name = self.scene.scene_name
        self.scene_line = self.scene.scene_line

        self.mobs:dict[str, monster] = {}
        self.scene.add_update(lambda : [mob.update(self.scene) for mob in self.mobs.values()])
        self.scene.add_update(self.__update_battle__)

        self.mob_table_id = mob_table_id
        self.spawn_point = pos
        self.max_mobs_num = max_mobs_num

    def __spawn__(self, mob:monster):
        self.scene.group.create_remote_entity(mob)
        self.mobs[mob.entity_id] = mob

    def dead(self, mob:monster):
        self.scene.group.remove_entity(mob)
        self.mobs.pop(mob.entity_id)

    def __update_battle__(self):
        while len(self.mobs) < self.max_mobs_num:
            mob = monster(f"{self.area}_{self.scene_line}", str(uuid.uuid4()), self.mob_table_id, self.spawn_point)
            self.__spawn__(mob)

class scene:
    def __init__(self, area:str, scene_name:str, scene_line:int):
        self.area = area
        self.scene_name = scene_name
        self.scene_line = scene_line
        
        self.scene_map_data:scene_map = get_scene_map(scene_name)
        
        self.group = group()
        self.players:dict[str, player_data] = {}

        self.npcs:dict[int, npc] = {}
        with open('../../excel/NPC.json') as f:
            data = json.load(f)
            for s in data.value():
                if s["scene"] != self.scene_name:
                    continue
                self.npcs[s["id"]] = npc(f"{area}_{scene_line}", s["id"], str(uuid.uuid4()))
                
        self.mob_spawn:list[mob_group] = []
        with open('../../excel/MobSpawn.json') as f:
            data = json.load(f)
            for s in data.value():
                if s["scene"] != self.scene_name:
                    continue
                self.mob_spawn.append(mob_group(self, s["mob_id"], protcol_to_position(s["postion"]), s["mobs_num"]))

        self.updates:list[Callable[[], None]] = []
        self.add_update(lambda : [p.scene_data.update(self) for p in self.players.values()])

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