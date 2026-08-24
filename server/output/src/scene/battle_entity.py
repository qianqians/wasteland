# -*- coding: UTF-8 -*-
from __future__ import annotations
from ..engine.common_svr import *

class battle_entity(object):
    def __init__(self, entity_id:str, nick_name:str, appearance:str, attribute_data:dict, skills:list[skill_info]):
        self.entity_id = entity_id
        self.nick_name = nick_name
        self.appearance = appearance
        self.abonus = attribute_data
        self.skills = skills

    def info(self) -> dict:
        return {
            "entity_id": self.entity_id,
            "nick_name": self.nick_name,
            "appearance": self.appearance,
            "attribute": self.abonus,
            "skills": self.skills,
        }