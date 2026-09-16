# -*- coding: UTF-8 -*-
from __future__ import annotations
from ...engine.common_svr import *

class attribute_data:
    def __init__(self, entity_id:str, data:dict):
        self.entity_id = entity_id

        self.abonus = attribute()
        self.abonus.hp = data["hp"]
        self.abonus.mp = data["mp"]
        self.abonus.max_hp = data["max_hp"]
        self.abonus.max_mp = data["max_mp"]
        self.abonus.speed = data["speed"]
        self.abonus.attack = data["attack"]
        self.abonus.defense = data["defense"]
        self.abonus.matk = data["matk"]
        self.abonus.resist = data["resist"]
        self.abonus.tmp_defense = 0

    def info(self) -> dict:
        return {
            "id": self.entity_id,
            "hp": self.hp,
            "mp": self.mp,
            "max_hp": self.max_hp,
            "max_mp": self.max_mp,
            "speed": self.speed,
            "attack": self.attack,
            "defense": self.defense,
        }
    
def attribute_create(entity_id:str) -> attribute_data:
    return attribute_data(entity_id, {
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