# -*- coding: UTF-8 -*-
from __future__ import annotations
from ..engine.engine import *
from ..helper import const
from .data.attribute_data import *
from .data.equip_data import *
from .data.scene_data import *
from .data.bag_data import *
from .data.task_data import *
from .scene_map_data import *
from .scene import *

async def load_or_create_player(_service:scene_service, gate_name:str, conn_id:str, client_info:dict):
    player_id = client_info.get("player_id", str(uuid.uuid4()))
    await player_data.load_or_create_entity({"player_id":player_id}, 
        lambda data: app().run_coroutine_async(create_player(_service, gate_name, conn_id, player_id, client_info, data)))
    await app().redis_proxy.set(const.PlayerGateInfoKey.format(player_id), 
        json.dumps({"gate_name":gate_name, "conn_id":conn_id}))

async def create_player(_service:scene_service, gate_name:str, conn_id:str, player_id:str, client_info:dict, info:dict):
    if "account_id" in client_info:
        info["account_id"] = client_info["account_id"]
        info["player_nick_name"] = client_info["player_nick_name"]
        info["gender"] = client_info["gender"]
           
    if "scene_data" not in info:
        novice_village = _service.get_novice_village()
        if novice_village == None:
            app().error(f"Novice village not found for player={player_id} client_info={client_info}")
            return
        info["scene_data"] = novice_village
    if "equip_data" not in info:
        info["equip_data"] = equip_create(client_info["gender"])

    player = player_data(_service.service_name, gate_name, conn_id, player_id, info)
    app().player_mgr.add_player(player)
    player.create_main_remote_entity()
    
    scene_name = player.scene_data.scene_name
    scene_line = _service.line
    _scene = _service.scenes.get(f"{scene_name}", None)
    if _scene != None:
        _scene.entry_scene(player)
        player.entry_scene(_scene)
        await app().redis_proxy.set(const.PlayerZoneLineInfoKey.format(player_id), 
            json.dumps({"zone":_service.area, "line":scene_line}))
    else:
        app().error(f"scene:{scene_name}_{scene_line} not found!")

class novice_village_postion(TypedDict):
    x_1: int
    x_2: int
    y: int

class scene_novice_village(TypedDict):
    scene_name:str
    pos:novice_village_postion

class scene_service(service):
    def __init__(self, area:str, scene_line:int):
        super().__init__(f"{area}_{scene_line}")
        self.area = area
        self.line = scene_line

        self.scenes:dict[str, scene] = {}

        
        '''with open('../../excel/Area.json') as f:
            data = json.load(f)
            for s in data.value():
                if s["area"] != area: continue    
                load_scene_map(s["scene"])
                self.scenes[s["scene"]] = scene(area, s["scene"], scene_line)
        '''

        '''
        self.novice_village:scene_novice_village = None
        with open('../../excel/NoviceVillage.json') as f:
            data = json.load(f)
            if area in data:
                novice_village = data[area]
                pos_x = json.loads(novice_village["postion_x"])
                pos_y = int(novice_village["postion_y"])
                pos:novice_village_postion = {
                    "x_1": pos_x[0],
                    "x_2": pos_x[1],
                    "y": pos_y
                }
                self.novice_village = {
                    "scene_name": novice_village["novice_village"],
                    "pos": pos
                }
        '''

    def update(self):
        for _scene in self.scenes.values():
            _scene.update()

    def get_novice_village(self) -> dict:
        x_1 = self.novice_village["pos"]["x_1"]
        x_2 = self.novice_village["pos"]["x_2"]
        random_x = random.random() * (x_2 - x_1) + x_1
        pos:postion_data = {
            "x": random_x,
            "y": self.novice_village["pos"]["y"],
        }
        novice_village:scene_postion = {
            "scene_name": self.novice_village["scene_name"],
            "scene_line": self.line,
            "pos": pos,
        }
        return novice_village

    def on_migrate(self, _entity:entity|player):
        if _entity.entity_type == "player_data":
            _player_data:player_data = _entity
            _scene = self.scenes[_player_data.scene_data.scene_name]
            _scene.entry_scene(_player_data)
            _player_data.entry_scene(_scene)

    def hub_query_service_entity(self, queryer_hub_name:str):
        pass
    
    def client_query_service_entity(self, queryer_gate_name:str, queryer_client_conn_id:str, queryer_client_info:dict):
        app().run_coroutine_async(load_or_create_player(self, queryer_gate_name, queryer_client_conn_id, queryer_client_info))

    def client_query_service_entity_ext(self, info:list[(str, str, dict)]):
        pass