# -*- coding: UTF-8 -*-
from __future__ import annotations
from typing import cast
from ..engine.engine import *
from ..engine.player_ntf_client_svr import *
from ..engine.scene_ntf_client_svr import *
from ..engine.battle_ntf_client_svr import *
from ..engine.battle_svr import *
from ..engine.player_svr import *
from ..engine.scene_svr import *
from ..engine.common_svr import *
from .data.attribute_data import *
from .data.equip_data import *
from .data.scene_data import *
from .data.bag_data import *

@SaveDBDescribe("wasteland", "player_data")
class player_data(save, player):
    def __init__(self, service_name:str, player_gate_name:str, player_conn_id:str, player_id:str, info:dict):
        save.__init__(self)
        player.__init__(self, service_name, "player_data", player_id, player_gate_name, player_conn_id, False)

        self.user_id = player_id

        self.player_caller = player_ntf_client_caller(self)
        self.scene_caller = scene_ntf_client_caller(self)
        self.battle_caller = battle_ntf_client_caller(self)
        
        self.player_module = player_module(self)
        self.player_module.on_into_scene.append(
            lambda rsp, scene_name, scene_line : 
                app().run_coroutine_async(self.into_scene(rsp, scene_name, scene_line)))
                
        self.scene_module = scene_module(self)
        self.scene_module.on_move.append(lambda _, vertical_dir, pos: self.begin_move(vertical_dir, pos))

        self.battle_module = battle_module(self)
        self.battle_module.on_start_battle.append(lambda _, enemy_id : self.start_battle(enemy_id))
        self.battle_module.on_auto_battle.append(lambda rsp, entity_id, skill_id: self.on_auto_battle(rsp, entity_id, skill_id))
        self.battle_module.on_use_skill.append(lambda rsp, entity_id, skill_id, target: self.on_use_skill(rsp, entity_id, skill_id, target))

        self.account_id = info["account_id"]
        self.player_nick_name = info["player_nick_name"]
        self.gender = info["gender"]
        self.appearance = info["appearance"]

        self.attribute_data = attribute_data(self.user_id, info["attribute_data"])
        self.bag_data = bag_data(self.user_id, info["bag_data"], self.player_caller)
        
        from .data.task_data import task_data
        self.task_data = task_data(self.user_id, info["task_data"], 
                                   self.player_module, self.player_caller, 
                                   self.skill_data, self.bag_data, self)

        from .data.gf_data import gf_data
        self.gf_data = gf_data(self.user_id, info["gf_data"])

        from .data.bb_data import bb_data
        self.bb_data = bb_data(self.user_id, info["bb_data"])

        from .data.partner_data import partner_data
        self.partner_data = partner_data(self.user_id, info["partner_data"])
        
        self.equip_data = equip_data(self.user_id, info["equip_data"])
        self.scene_data = scene_data(self.user_id, self.scene_caller, info["scene_data"])

    def full_info(self) -> dict:
        return self.store()
    
    def hub_info(self) -> dict:
        return self.store()

    def client_info(self) -> dict:
        return self.store()

    def battle_info(self) -> battle_info:
        entity = battle_entity()
        entity.entity_id = self.user_id
        entity.nick_name = self.player_nick_name
        entity.appearance = self.appearance
        entity.speed = self.attribute_data.speed
        entity.abonus = self.attribute_data.info()
        entity.skills = self.skill_data.skills.values()
        entity.level = self.gf_data.curr_gf.gongfa_level

        partner0 = self.partner_data.curr_partner[0]
        battle_team0 = battle_entity()
        battle_team0.entity_id = partner0.entity_id
        battle_team0.nick_name = partner0.partner_table_id
        battle_team0.appearance = partner0.partner_table_id
        battle_team0.speed = partner0.abonus.speed
        battle_team0.abonus = partner0.abonus
        battle_team0.skills = partner0.curr_gf.skills
        battle_team0.level = partner0.curr_gf.gongfa_level

        partner1 = self.partner_data.curr_partner[1]
        battle_team1 = battle_entity()
        battle_team1.entity_id = partner1.entity_id
        battle_team1.nick_name = partner1.partner_table_id
        battle_team1.appearance = partner1.partner_table_id
        battle_team1.speed = partner1.abonus.speed
        battle_team1.abonus = partner1.abonus
        battle_team1.skills = partner1.curr_gf.skills
        battle_team1.level = partner1.curr_gf.gongfa_level
        
        info = battle_info()
        info.battle_team0 = battle_team0
        info.battle_team1 = battle_team1
        info.curr_bbs0 = self.bb_data.curr_bb[0]
        info.curr_bbs1 = self.bb_data.curr_bb[1]
        info.player = entity
        info.items = self.bag_data.bag.values()
        info.scene = self.scene.scene_name
        return info
    
    def entry_scene(self, _scene:any):
        from .scene import scene
        self.scene:scene = cast(scene, _scene)

    def start_battle(self, enemy_id:int):
        from .battle import battle
        enemy = self.scene.players.get(enemy_id)
        if enemy: 
            self.battle_handle = battle(self.scene, self, enemy, self.battle_info(), enemy.battle_info(), self.battle_module)
        else: 
            enemy = self.scene.mobs.get(enemy_id)
            if enemy:
                self.battle_handle = battle(self.scene, self, None, self.battle_info(), enemy.battle_info(), self.battle_module)

    def on_auto_battle(self, rsp:battle_auto_battle_rsp, entity_id:str, skill_id:int):
        self.battle_handle.on_auto_battle(entity_id, skill_id)
        rsp.rsp()

    def on_use_skill(self, rsp:battle_use_skill_rsp, entity_id:str, skill_id: int, target:str):
        self.battle_handle.on_use_skill(entity_id, skill_id, target)
        rsp.rsp(self.battle_info())
        
    def begin_move(self, vertical_dir:direction, pos:position_info):
        (is_spawn, spawn_scene_name) = self.scene_data.begin_move(vertical_dir)
        if is_spawn:
            app().run_coroutine_async(self.__into_scene__(spawn_scene_name, self.scene_data.scene_line))
        
    async def __into_scene__(self, scene_name:str, scene_line:int):
        self.scene.leave_scene(self)
        from .scene_service import scene_service
        for _s in app().service_mgr.services.values():
            _scene_service:scene_service = _s
            for _scene in _scene_service.scenes.values():
                if _scene.scene_name == scene_name and _scene.scene_line == scene_line:
                    _scene.entry_scene(self)
                    self.scene = _scene
                    return 
        
        migrate_hub = await app().ctx.entry_hub_service(f"{scene_name}_{scene_line}")
        await self.start_migrate_entity_initiative(migrate_hub)
        
    async def into_scene(self, rsp:player_into_scene_rsp, scene_name:str, scene_line:int):
        scene_spawn_point = get_scene_spawn_point(self.scene_data.scene_name, self.scene_data.postion)
        if scene_spawn_point == None:
            rsp.err(error_code.not_in_spawn_point)
            return
        
        self.scene_data.scene_name = scene_name
        self.scene_data.scene_line = scene_line
        self.scene_data.postion = scene_spawn_point["out_position"]
        
        await self.__into_scene__(rsp, scene_name, scene_line)
        rsp.rsp()

    def refresh(self):
        self.scene_caller.entity_refresh(dumps(self.client_info()))

    @abstractmethod
    def store(self) -> dict:
        return { 
            "player_id": self.user_id, 
            "account_id": self.account_id,
            "player_nick_name": self.player_nick_name,
            "gender": self.gender,
            "attribute_data": self.attribute_data.info(),
            "equip_data": self.equip_data.info(), 
            "scene_data": self.scene_data.info(),
            "task_data": self.task_data.info(), 
            "bag_data": self.bag_data.info(),
            "bb_data": self.bb_data.info(),
            "partner_data": self.partner_data.info(),
            "gf_data": self.gf_data.info(),
        }
    
    @staticmethod
    @abstractmethod
    def create() -> dict:
        _attribute_data = attribute_create()
        _bag_data = bag_create()

        return { 
            "player_id":str(uuid.uuid4()),
            "level": 1,
            "attribute_data": _attribute_data.info(), 
            "bag_data": _bag_data.info(),
        }

def migrate_player(player_gate_name:str, player_conn_id:str, player_id:str, gates:list[str], hubs:list[str], info:dict) -> player_data:
    app().trace(f"migrate_player info:{info}")
    service_name = f"{info['scene_data']['scene_name']}_{info['scene_data']['scene_line']}"
    p = player_data(service_name, player_gate_name, player_conn_id, player_id, info)
    p.conn_client_gate = gates
    p.conn_hub_server = hubs
    return p
