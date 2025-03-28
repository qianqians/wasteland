from ..engine.common_svr import *

class equip:
    def __init__(self):
        self.equip = equip_info()

    def data(self) -> equip_info:
        return self.equip
    
    def info(self) -> dict:
        return equip_info_to_protcol(self.equip)
    
    def type(self) -> em_equip_type:
        return self.equip.equip_type
    
    def create(data:dict):
        e = equip()
        e.equip.id = data["id"]
        e.equip.name = data["name"]
        e.equip.icon = data["icon"]
        e.equip.desc = data["desc"]
        e.equip.equip_type = em_equip_type(data["type"])
        e.equip.add_hp = data["add_hp"]
        e.equip.add_mp = data["add_mp"]
        e.equip.add_defense = data["add_defense"]
        return e
    
    def load(info:equip_info):
        e = equip()
        e.equip = info
        return e

class weapon:
    def __init__(self):
        self.weapon = weapon_info()

    def data(self) -> weapon_info:
        return self.weapon
    
    def info(self) -> dict:
        return weapon_info_to_protcol(self.weapon)
    
    def type(self) -> em_equip_type:
        return self.weapon.equip_type
    
    def create(data:dict):
        w = weapon()
        w.weapon.id = data["id"]
        w.weapon.name = data["name"]
        w.weapon.icon = data["icon"]
        w.weapon.desc = data["desc"]
        w.weapon.equip_type = em_equip_type(data["type"])
        w.weapon.attack = data["attack"]
        return w

    def load(info:weapon_info):
        w = weapon()
        w.weapon = info
        return w

class shooting:
    def __init__(self):
        self.shooting = shooting_info()

    def data(self) -> shooting_info:
        return self.shooting
    
    def info(self) -> dict:
        return shooting_info_to_protcol(self.shooting)

    def type(self) -> em_equip_type:
        return self.shooting.equip_type

    def create(data:dict):
        s = shooting()
        s.shooting.id = data["id"]
        s.shooting.name = data["name"]
        s.shooting.icon = data["icon"]
        s.shooting.desc = data["desc"]
        s.shooting.equip_type = em_equip_type(data["type"])
        s.shooting._bullet_info = protcol_to_bullet_info(data["bullet"])
        return s
    
    def load(info:shooting_info):
        s = shooting()
        s.shooting = info
        return s

class equip_data:
    def __init__(self, data:dict):
        self.equips:dict[em_equip_type, equip|weapon|shooting] = {}
        for type, info in data.items():
            type = em_equip_type(int(type))
            if type == em_equip_type.weapon:
                self.equips[type] = weapon.create(info)
            elif type == em_equip_type.shooting:
                self.equips[type] = shooting.create(info)
            else:
                self.equips[type] = equip.create(info)

    def add_attribute(self):
        add_hp = 0
        add_mp = 0
        add_defense = 0

        for type, equip in self.equips.items():
            if type != em_equip_type.weapon and type!= em_equip_type.shooting:
                add_hp += equip.add_hp
                add_mp += equip.add_mp
                add_defense += equip.add_defense

        return (add_hp, add_mp, add_defense)
    
    def wear(self, equip:equip|weapon|shooting):
        old = None
        if equip.type() not in self.equips:
            old = self.equips[equip.type]
        self.equips[equip.type()] = equip
        return old
    
    def info(self) -> dict:
        info = {}
        for type, equip in self.equips.items():
            info[type] = equip.info()
        return info