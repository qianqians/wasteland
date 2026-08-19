# -*- coding: UTF-8 -*-
from __future__ import annotations

class attribute_data:
    def __init__(self, entity_id:str, data:dict):
        self.entity_id = entity_id
        
        self.hp = data["hp"]
        self.mp = data["mp"]
        self.max_hp = data["max_hp"]
        self.max_mp = data["max_mp"]
        self.speed = data["speed"]
        self.attack = data["attack"]
        self.defense = data["defense"]

    def info(self) -> dict:
        return {
            "id": self.entity_id,
            "hp": self.hp,
            "mp": self.mp,
            "max_hp": self.max_hp,
            "max_mp": self.max_mp,
            "attack": self.attack,
            "defense": self.defense,
        }
    
def attribute_create() -> attribute_data:
    return attribute_data({
        "hp": 100,
        "mp": 100,
        "max_hp": 100,
        "max_mp": 100,
        "speed": 32,
        "attack": 20,
        "defense": 10,
    })