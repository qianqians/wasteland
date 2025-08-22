# -*- coding: UTF-8 -*-
from ..engine.engine import *
from .player_data import player_data

class npc(entity):
    def __init__(self, service_name, entity_id):
        super().__init__(service_name, "npc", entity_id, False)


    def check_task(self, player:player_data) -> int:
        return 0