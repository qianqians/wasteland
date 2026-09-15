# -*- coding: UTF-8 -*-
from __future__ import annotations
from ..player_data import *

def damage(attack:int, target:player_data) -> int:
    target.attribute_data.hp -= attack
    return target.attribute_data.hp

def heal(heal:int, target:player_data) -> int:
    target.attribute_data.hp += heal
    return target.attribute_data.hp

