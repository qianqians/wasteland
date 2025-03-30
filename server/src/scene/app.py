import sys
from __future__ import annotations
from ..engine.engine import *
from .player_data import *
from .scene import *

async def load_or_create_player(_service:SceneService, gate_name:str, conn_id:str, player_id:str):
    device_str = await app().redis_proxy.get(f"wasteland:player_gate_info:{player_id}")
    device = json.loads(device_str)
    device = device["device"]
    data_str = await app().redis_proxy.get(f"wasteland:player_info:{player_id}")
    if data_str == None or data_str == "": 
        save.load_or_create_entity({"player_id":player_id}, lambda data: app().run_coroutine_async(create_player(_service, gate_name, conn_id, player_id, device, data)))
    else:
        data = json.loads(data_str)
        await create_player(gate_name, conn_id, player_id, device, data)

async def create_player(_service:SceneService, gate_name:str, conn_id:str, player_id:str, device:dict, info:dict):
    player = player_data(gate_name, conn_id, player_id, device, info, _service.scene)
    await app().redis_proxy.set("wasteland:player_info:{}".format(player_id), json.dumps(player.full_info()))
    app().player_mgr.add_player(player)
    player.create_main_remote_entity()
    _service.scene.entry_scene(player)

class SceneService(service):
    def __init__(self, scene_name:str, scene_line:int, _app:app):
        super().__init__(f"{scene_name}_{scene_line}")
        self._app = _app
        self.scene = scene(scene_name, scene_line)

    def on_migrate(self, _entity:entity|player):
        pass

    def hub_query_service_entity(self, queryer_hub_name:str):
        pass
    
    def client_query_service_entity(self, queryer_gate_name:str, queryer_client_conn_id:str, queryer_client_info:dict):
        app().run_coroutine_async(load_or_create_player(self, queryer_gate_name, queryer_client_conn_id, queryer_client_info["player_id"]))

    @abstractmethod
    def client_query_service_entity_ext(self, info:list[(str, str, dict)]):
        pass

class PlayerEventHandle(player_event_handle):
    def player_offline(self, _player:player) -> dict:
        return _player.full_info()
    
def main(cfg_file:str):
    _app = app()
    _app.build(cfg_file)
    _app.build_player_service(PlayerEventHandle())
    _app.service_mgr.reg_service(SceneService("wasteland_novice_village", 1, _app))
    _app.run()
    
if __name__ == '__main__':
    main(sys.argv[1])
