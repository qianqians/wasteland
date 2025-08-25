# -*- coding: UTF-8 -*-
from ..engine.engine import *

class skill_data:
    def __init__(self, info:dict):
        self.skills:dict[int, skill_info] = {}
        for id, skill in info.items():
            self.skills[id] = protcol_to_skill_info(skill)

    def info(self) -> dict:
        return { id: skill_info_to_protcol(skill) for id, skill in self.skills.items() }

    def learn_skill(self, skill: skill_info):
        if skill.skill_id not in self.skills:
            self.skills[skill.skill_id] = skill

def skill_create() -> skill_data:
    return skill_data({})