# -*- coding: UTF-8 -*-
from __future__ import annotations
from ...engine.common_svr import *

class equip:
    def __init__(self):
        self.equip:equip_info = None

    def data(self) -> equip_info:
        return self.equip
    
    def info(self) -> dict:
        return equip_info_to_protcol(self.equip)
    
    def type(self) -> em_equip_type:
        return self.equip.equip_type
    
    def create(data:dict) -> equip:
        e = equip()
        e.equip = protcol_to_equip_info(data)
        return e
    
    def load(info:equip_info):
        e = equip()
        e.equip = info
        return e

class equip_data:
    def __init__(self, user_id:str, data:dict):
        self.user_id = user_id
        
        self.equips:dict[em_equip_type, equip] = {}
        for type, info in data.items():
            type = em_equip_type(int(type))
            self.equips[type] = equip.create(info)

    def add_attribute(self):
        add_hp = 0
        add_mp = 0
        add_speed = 0
        add_attack = 0
        add_defense = 0
        add_matk = 0
        add_resist = 0

        for _, equip in self.equips.items():
            add_hp += equip.equip.abonus.hp
            add_mp += equip.equip.abonus.mp
            add_speed += equip.equip.abonus.speed
            add_attack += equip.equip.abonus.attack
            add_defense += equip.equip.abonus.defense
            add_matk += equip.equip.abonus.matk
            add_resist += equip.equip.abonus.resist

        return (add_hp, add_mp, add_speed, add_attack, add_defense, add_matk, add_resist)
    
    def wear(self, equip:equip) -> equip:
        old = None
        if equip.type() in self.equips:
            old = self.equips[equip.type()]
        self.equips[equip.type()] = equip
        return old
    
    def info(self) -> dict:
        info = {}
        for type, equip in self.equips.items():
            info[type] = equip.info()
        return info
    
def equip_create(gender:int) -> equip_data:
    return equip_data({})