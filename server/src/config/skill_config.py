# -*- coding: UTF-8 -*-
from __future__ import annotations
from typing import TypedDict, cast
from ..engine.common_svr import *

NoneAction = 0

SkillAttack = 1
Attack = skill_info()
Attack.skill_id = SkillAttack
Attack.value = 1
Attack.range = 1
Attack.cast_mp = 0
Attack.cd_round = 0

SkillDefend = 2
Defend = skill_info()
Defend.skill_id = SkillDefend
Defend.value = 1.5
Defend.range = 1
Defend.cast_mp = 0
Defend.cd_round = 0

Skills = {
    NoneAction: None,
    SkillAttack: Attack,
    SkillDefend: Defend,
}
