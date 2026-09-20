# -*- coding: UTF-8 -*-
from __future__ import annotations
from .action import *
from .buff_data import *

def damage(attack:int, target:ActionEntity) -> int:
    a = attack*attack/target.abonus.defense
    target.abonus.hp -= a
    if target.abonus.hp < 0:
        target.abonus.hp = 0
    return target.abonus.hp

def damage_matk(matk:int, target:ActionEntity) -> int:
    a = matk*matk/target.abonus.resist
    target.abonus.hp -= a
    if target.abonus.hp < 0:
        target.abonus.hp = 0
    return target.abonus.hp

def damage_mp(mp:int, target:ActionEntity) -> int:
    target.abonus.mp -= mp
    if target.abonus.mp < 0:
        target.abonus.mp = 0
    return target.abonus.mp

def heal(heal:int, target:ActionEntity) -> int:
    target.abonus.hp += heal
    return target.abonus.hp

def apply_buffer(b:buffer, target:buff_data):
    target.add_buff(b)
