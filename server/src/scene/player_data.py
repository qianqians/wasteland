from ..engine.engine import *
from ..data.attribute_data import *
from ..data.equip_data import *
from ..data.scene_data import *
from .scene import *

@SaveDBDescribe("wasteland", "player_data")
class player_data(save, player):
    def __init__(self, player_gate_name:str, player_conn_id:str, player_id:str, device:dict, info:dict, _scene:scene):
        save.__init__(self)
        player.__init__(self, "player_service", "player_data", player_id, player_gate_name, player_conn_id, False)

        self.player_gate_name = player_gate_name
        self.player_conn_id = player_conn_id
        self.player_id = player_id
        self.device = device

        self.attribute_data = attribute_data(info["attribute_data"])
        self.equip_data = equip_data(info["equip_data"])
        self.scene_data = scene_data(info["scene_data"])

        self._scene = _scene

    def full_info(self) -> dict:
        return self.store()
    
    def hub_info(self) -> dict:
        return self.store()

    def client_info(self) -> dict:
        return self.store()
        
    def store(self) -> dict:
        return { "attribute_data": self.attribute_data.info(), "equip_data": self.equip_data.info(), "scene_data": self.scene_data.info() }
    
    def create() -> dict:
        return { "attribute_data": attribute_data.create().info(), "equip_data": equip_data.create().info(), "scene_data": scene_data.create().info() }