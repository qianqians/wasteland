# -*- coding: UTF-8 -*-
from __future__ import annotations
from .action import *
from .buff_data import *

def damage(attack:int, target:ActionEntity) -> int:
    target.abonus.hp -= attack
    return target.abonus.hp

def heal(heal:int, target:ActionEntity) -> int:
    target.abonus.hp += heal
    return target.abonus.hp

def apply_buffer(b:buffer, target:buff_data):
    target.add_buff(b)