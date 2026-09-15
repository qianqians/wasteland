# -*- coding: UTF-8 -*-
from __future__ import annotations
from typing import TypedDict, cast
from ..engine.common_svr import *

def CreateSkill(skill_id:int, value:float, range:int, cast_mp:int, cd_round:int) -> skill_info:
    s = skill_info()
    s.skill_id = skill_id
    s.value = value
    s.range = range
    s.cast_mp = cast_mp
    s.cd_round = cd_round


NoneAction = 0

SkillAttack = 1
Attack = CreateSkill(SkillAttack, 1, 1, 0, 0)

SkillDefend = 2
Defend = CreateSkill(SkillDefend, 1.5, 1, 0, 0)

Skills = {
    NoneAction: None,
    SkillAttack: Attack,
    SkillDefend: Defend,
}
