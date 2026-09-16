# -*- coding: UTF-8 -*-
from __future__ import annotations
from ..engine.common_svr import *

def CreateSkill(skill_id:int, _type:skill_type, target_enemy:bool, value0:float, value1:float, ratio:float, range:int, cast_mp:int, cd_round:int) -> skill_info:
    s = skill_info()
    s.skill_id = skill_id
    s._type = _type
    s.target_enemy = target_enemy
    s.value0 = value0
    s.value1 = value1
    s.ratio = ratio
    s.range = range
    s.cast_mp = cast_mp
    s.cd_round = cd_round

NoneAction = 0

SkillAttack = 1
Attack = CreateSkill(SkillAttack, skill_type.skill_change_abonus, True, 1.0, 0, 1.0, 1, 0, 0)

SkillDefend = 2
Defend = CreateSkill(SkillDefend, skill_type.skill_add_buffer, False, 1, 0, 0, 1, 0, 0)

Skills:dict[int, skill_info] = {
    NoneAction: None,
    SkillAttack: Attack,
    SkillDefend: Defend,
}
