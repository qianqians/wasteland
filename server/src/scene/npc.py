# -*- coding: UTF-8 -*-
from ..engine.engine import *
from .player_data import player_data

class npc(entity):
    def __init__(self, service_name:str, npc_id:int, entity_id:str):
        super().__init__(service_name, "npc", entity_id, False)
        
        self.npc_id = npc_id
        

    def check_task(self, player:player_data) -> int:
        return 0