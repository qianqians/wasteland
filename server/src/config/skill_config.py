# -*- coding: UTF-8 -*-
from typing import TypedDict
from enum import Enum

class em_skill_type(Enum):
    em_skill_attack = 1
    em_skill_revive = 2

AutoAttackSkillId = 10001

class skill_config(TypedDict):
    id:int
    skill_type:em_skill_type
    attack:int
    attack_range:int
    