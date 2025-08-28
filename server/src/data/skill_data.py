# -*- coding: UTF-8 -*-
from ..engine.common_svr import *

class skill_data:
    def __init__(self, user_id:str, info:dict):
        self.user_id = user_id
        
        self.skills:dict[int, skill_info] = {}
        for id, skill in info.items():
            self.skills[id] = protcol_to_skill_info(skill)

    def info(self) -> dict:
        return { id: skill_info_to_protcol(skill) for id, skill in self.skills.items() }

    def learn_skill(self, skill: skill_info):
        if skill.skill_id not in self.skills:
            self.skills[skill.skill_id] = skill

    def has_learned_skill(self) -> bool:
        return len(self.skills) > 0

def skill_create() -> skill_data:
    return skill_data({})