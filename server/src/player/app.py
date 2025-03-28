import sys
from ..engine.engine import *
from .player_data import *

async def load_or_create_player(gate_name:str, conn_id:str, player_id:str):
    info_str = await app().redis_proxy.get("wasteland:player_hub_info:{}".format(player_id))
    info = json.loads(info_str)
    device = info["device"] 
    save.load_or_create_entity({"player_id":player_id}, lambda data: app().run_coroutine_async(create_player(gate_name, conn_id, player_id, device, data)))

async def create_player(gate_name:str, conn_id:str, player_id:str, device:dict, info:dict):
    player = player_data(gate_name, conn_id, player_id, device, info)
    await app().redis_proxy.set("wasteland:player_info:{}".format(player_id), json.dumps(player.full_info()))
    app().player_mgr.add_player(player)
    player.create_main_remote_entity()
    await player.entry_scene()

@ServiceDescribe("player_service")
class PlayerService(service):
    def __init__(self, _app:app):
        super().__init__("Rank")
        self._app = _app

    def on_migrate(self, _entity:entity|player):
        pass

    def hub_query_service_entity(self, queryer_hub_name:str):
        pass
    
    def client_query_service_entity(self, queryer_gate_name:str, queryer_client_conn_id:str, queryer_client_player_id:str):
        app().run_coroutine_async(load_or_create_player(queryer_gate_name, queryer_client_conn_id, queryer_client_player_id))
    
class PlayerEventHandle(player_event_handle):
    def player_offline(self, _player:player) -> dict:
        return _player.full_info()
    
def main(cfg_file:str):
    _app = app()
    _app.build(cfg_file)
    _app.build_player_service(PlayerEventHandle())
    _app.service_mgr.reg_service(PlayerService(_app))
    _app.run()
    
if __name__ == '__main__':
    main(sys.argv[1])
