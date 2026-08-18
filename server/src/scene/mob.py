# -*- coding: UTF-8 -*-
from __future__ import annotations
from ..engine.engine import *
from .player_data import player_data

class mob(entity):
    def __init__(self, service_name:str, mob_id:int, entity_id:str):
        super().__init__(service_name, "mob", entity_id, False)
        
        self.mob_id = mob_id
        

    def battle_info(self) -> dict:
        return {}