from ..engine.engine import *
from ..data.attribute_data import *
from..data.equip_data import *
from..data.scene_data import *

class player_data:
    def __init__(self, player_gate_name:str, player_conn_id:str, player_id:str, device:dict, info:dict):
        self.player_gate_name = player_gate_name
        self.player_conn_id = player_conn_id
        self.player_id = player_id
        self.device = device

        self.attribute_data = attribute_data(info["attribute_data"])
        self.equip_data = equip_data(info["equip_data"])
        self.scene_data = scene_data(info["scene_data"])

    def entry_scene(self):
        gate_host = app().ctx.gate_host(self.player_gate_name)
        forward_client_query_service(
            "wasteland_scene_hub_{}_{}".format(self.scene_data.scene_name, self.scene_data.scene_line), 
            self.player_gate_name, gate_host, self.player_conn_id, self.player_id)