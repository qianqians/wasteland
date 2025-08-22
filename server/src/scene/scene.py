# -*- coding: UTF-8 -*-
from __future__ import annotations
from ..engine.engine import *
from ..data import const
from ..data.attribute_data import *
from ..data.equip_data import *
from ..data.scene_data import *
from ..data.bag_data import *
from ..data.task_data import *
from .player_data import player_data
from .npc import npc
from ..data.scene_map_data import scene_map, get_scene_map

class scene:
    def __init__(self, scene_name:str, scene_line:int):
        self.scene_name = scene_name
        self.scene_line = scene_line
        
        self.scene_map_data = get_scene_map(scene_name)
        
        self.group = group()
        self.players:dict[str, player_data] = {}
        self.npcs:dict[str, npc] = {}

    def entry_scene(self, player:player_data):
        self.group.join((player.client_gate_name, player.client_conn_id))
        self.group.create_remote_player(player)
        

async def load_or_create_player(_service:SceneService, gate_name:str, conn_id:str, client_info:dict):
    player_id = client_info.get("player_id", str(uuid.uuid4()))
    await player_data.load_or_create_entity({"player_id":player_id}, 
        lambda data: app().run_coroutine_async(create_player(_service, gate_name, conn_id, player_id, client_info, data)))
    await app().redis_proxy.set(const.PlayerGateInfoKey.format(player_id), 
        json.dumps({"gate_name":gate_name, "conn_id":conn_id}))

async def create_player(_service:SceneService, gate_name:str, conn_id:str, player_id:str, client_info:dict, info:dict):
    if "account_id" in client_info:
        info["account_id"] = client_info["account_id"]
        info["player_nick_name"] = client_info["player_nick_name"]
        info["player_appearance"] = client_info["player_appearance"]
        info["gender"] = client_info["gender"]
           
    if "scene_data" not in info:
        if _service.novice_village() == None:
            app().error(f"Novice village not found for player={player_id} client_info={client_info}")
            return
        info["scene_data"] = _service.novice_village()
    if "equip_data" not in info:
        info["equip_data"] = equip_data.create(client_info["gender"])

    player = player_data(gate_name, conn_id, player_id, info)
    player.create_main_remote_entity()

    app().player_mgr.add_player(player)
    
    scene_name = player.scene_data.scene_name
    scene_line = _service.line
    _scene = _service.scenes.get(f"{scene_name}_{scene_line}", None)
    if _scene != None:
        _scene.entry_scene(player)
        await app().redis_proxy.set(const.PlayerZoneLineInfoKey.format(player_id), 
            json.dumps({"zone":scene_name, "line":scene_line}))
    else:
        app().error(f"scene:{scene_name}_{scene_line} not found!")

class SceneService(service):
    def __init__(self, area:str, scene_line:int):
        super().__init__(f"{area}_{scene_line}")
        self.area = area
        self.line = scene_line

        self.scenes:dict[str, scene] = {}
        with open('../../Area.json') as f:
            data = json.load(f)
            for s in data.value():
                if s["area"] != area:
                    continue
                self.scenes[s["scene"]] = scene(s["scene"], scene_line)
        
        self.novice_village:scene_postion = None
        with open('../../NoviceVillage.json') as f:
            data = json.load(f)
            if area in data:
                novice_village = data[area]
                pos = json.loads(novice_village["postion"])
                pos:postion_data = {
                    "x": pos[0],
                    "y": pos[1]
                }
                self.novice_village = {
                    "scene_name": novice_village["novice_village"],
                    "scene_line": scene_line,
                    "pos": pos
                }

    def novice_village(self) -> dict:
        return self.novice_village

    def on_migrate(self, _entity:entity|player):
        pass

    def hub_query_service_entity(self, queryer_hub_name:str):
        pass
    
    def client_query_service_entity(self, queryer_gate_name:str, queryer_client_conn_id:str, queryer_client_info:dict):
        app().run_coroutine_async(load_or_create_player(self, queryer_gate_name, queryer_client_conn_id, queryer_client_info))

    @abstractmethod
    def client_query_service_entity_ext(self, info:list[(str, str, dict)]):
        pass