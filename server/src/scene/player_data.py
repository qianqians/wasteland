# -*- coding: UTF-8 -*-
from __future__ import annotations
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

        self.player_id = player_id

        self.player_caller = player_ntf_client_caller(self)
        self.scene_caller = scene_ntf_client_caller(self)
        self.battle_caller = battle_ntf_client_caller(self)
        
        self.player_module = player_module(self)
        self.player_module.on_into_scene.append(
            lambda rsp, scene_name, scene_line : 
                app().run_coroutine_async(self.into_scene(rsp, scene_name, scene_line)))
                
        self.scene_module = scene_module(self)
        self.scene_module.on_move.append(lambda s, vertical_dir, pos: self.begin_move(vertical_dir, pos))

        self.battle_module = battle_module(self)
        self.battle_module.on_use_skill.append(lambda rsp, skill_id : self.use_skill(rsp, skill_id))

        self.account_id = info["account_id"]
        self.player_nick_name = info["player_nick_name"]
        self.level = info["level"]
        self.gender = info["gender"]

        self.attribute_data = attribute_data(self.player_id, info["attribute_data"])
        self.bag_data = bag_data(self.player_id, info["bag_data"], self.player_caller)
        
        from .data.skill_data import skill_data
        self.skill_data = skill_data(self.player_id, self.battle_module, info["skill_data"])

        from .data.task_data import task_data
        self.task_data = task_data(self.player_id, info["task_data"], 
                                   self.player_module, self.player_caller, 
                                   self.skill_data, self.bag_data, self)
        
        self.equip_data = equip_data(self.player_id, info["equip_data"])
        self.scene_data = scene_data(self.player_id, info["scene_data"])

    def full_info(self) -> dict:
        return self.store()
    
    def hub_info(self) -> dict:
        return self.store()

    def client_info(self) -> dict:
        return self.store()
    
    def entry_scene(self, _scene:any):
        from .scene import scene
        self.scene:scene = _scene
        
    def begin_move(self, vertical_dir:direction, pos:position):
        (is_spawn, spawn_scene_name) = self.scene_data.begin_move(vertical_dir, pos)
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
                    self.entry_scene(_scene)
                    return 
        
        migrate_hub = await app().ctx.entry_hub_service(f"{scene_name}_{scene_line}")
        await self.start_migrate_entity_initiative(migrate_hub)
        
    async def into_scene(self, rsp:player_into_scene_rsp, scene_name:str, scene_line:int):
        scene_spawn_point = get_scene_spawn_point(scene_name, self.scene_data.postion)
        if scene_spawn_point == None:
            rsp.err(error_code.not_in_spawn_point)
            return
        
        self.scene_data.scene_name = scene_name
        self.scene_data.scene_line = scene_line
        self.scene_data.postion = scene_spawn_point.out_position
        
        await self.__into_scene__(rsp, scene_name, scene_line)
        rsp.rsp()

    def refresh(self):
        self.scene_caller.entity_refresh(dumps(self.client_info()))

    @abstractmethod
    def store(self) -> dict:
        return { 
            "player_id": self.player_id, 
            "account_id": self.account_id,
            "player_nick_name": self.player_nick_name,
            "gender": self.gender,
            "level": self.level,
            "attribute_data": self.attribute_data.info(),
            "equip_data": self.equip_data.info(), 
            "scene_data": self.scene_data.info(),
            "task_data": self.task_data.info(), 
            "bag_data": self.bag_data.info(),
        }
    
    @staticmethod
    @abstractmethod
    def create() -> dict:
        _attribute_data = attribute_create()
        _bag_data = bag_create()
        
        from .data.skill_data import skill_create
        _skill_date = skill_create()
        
        from .data.task_data import task_create
        _task_data = task_create()

        return { 
            "player_id":str(uuid.uuid4()),
            "level": 1,
            "attribute_data": _attribute_data.info(), 
            "bag_data": _bag_data.info(),
            "task_data": _task_data.info(),
            "skill_date": _skill_date.info(),
        }

def migrate_player(player_gate_name:str, player_conn_id:str, player_id:str, gates:list[str], hubs:list[str], info:dict) -> player_data:
    app().trace(f"migrate_player info:{info}")
    service_name = f"{info["scene_data"]["scene_name"]}_{info["scene_data"]["scene_line"]}"
    p = player_data(service_name, player_gate_name, player_conn_id, player_id, info)
    p.conn_client_gate = gates
    p.conn_hub_server = hubs
    return p
