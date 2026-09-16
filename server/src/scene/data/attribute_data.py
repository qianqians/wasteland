# -*- coding: UTF-8 -*-
from __future__ import annotations
from ...engine.common_svr import *

class attribute_data:
    def __init__(self, user_id:str, data:dict):
        self.entity_id = user_id

        self.abonus = protcol_to_attribute(data)
        self.abonus.tmp_defense = 0

    def info(self) -> dict:
        return {
            "id": self.entity_id,
            "hp": self.abonus.hp,
            "mp": self.abonus.mp,
            "max_hp": self.abonus.max_hp,
            "max_mp": self.abonus.max_mp,
            "speed": self.abonus.speed,
            "attack": self.abonus.attack,
            "defense": self.abonus.defense,
            "matk": self.abonus.matk,
            "resist": self.abonus.resist,
        }
    
def attribute_create(user_id:str) -> attribute_data:
    return attribute_data(user_id, {
        "hp": 100,
        "mp": 100,
        "max_hp": 100,
        "max_mp": 100,
        "speed": 32,
        "attack": 20,
        "defense": 10,
        "matk": 20,
        "resist": 10,
    })