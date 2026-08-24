# -*- coding: UTF-8 -*-
from typing import TypedDict

class monster_config(TypedDict):
    id:int
    hp:int
    mp:int
    speed:int
    attack:int
    defense:int
    skill:list[str]