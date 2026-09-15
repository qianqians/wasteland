# -*- coding: UTF-8 -*-
from __future__ import annotations
from ..engine.engine import *
from .player_data import player_data

class mob(entity):
    def __init__(self, service_name:str, mob_id:int, entity_id:str):
        super().__init__(service_name, "mob", entity_id, False)
        self.mob_id = mob_id
        self.battle_info = {}
        #for c in configs.monster_list:
        #    if c.id == self.mob_id:
        #        self.battle_info = {
        #            "id": self.entity_id,
        #            "hp": c.hp,
        #            "mp": c.mp,
        #            "max_hp": c.hp,
        #            "max_mp": c.mp,
        #            "attack": c.attack,
        #            "defense": c.defense,
        #        }

    def battle_info(self) -> dict:
        return self.battle_info