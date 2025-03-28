from ..engine.common_svr import *

class equip:
    def __init__(self, data:dict):
        self.equip = equip_info()
        self.equip.id = data["id"]
        self.equip.name = data["name"]
        self.equip.icon = data["icon"]
        self.equip.desc = data["desc"]
        self.equip.equip_type = data["type"]
        self.equip.add_hp = data["add_hp"]
        self.equip.add_mp = data["add_mp"]
        self.equip.add_defense = data["add_defense"]

    def info(self) -> equip_info:
        return self.equip
    
    def create(data:dict):
        return equip(data)
    
class weapon:
    def __init__(self, data:dict):
        self.weapon = weapon_info()
        self.weapon.id = data["id"]
        self.weapon.name = data["name"]
        self.weapon.icon = data["icon"]
        self.weapon.desc = data["desc"]
        self.weapon.equip_type = data["type"]
        self.weapon.attack = data["attack"]

    def info(self) -> weapon_info:
        return self.weapon
    
    def create(data:dict):
        return weapon(data)

class bullet:
    def __init__(self, data:dict):
        self.bullet = bullet_info()
        self.bullet.id = data["id"]
        self.bullet.name = data["name"]
        self.bullet.icon = data["icon"]
        self.bullet.desc = data["desc"]
        self.bullet.type = data["type"]
        self.bullet.attack = data["attack"]
        self.bullet.speed = data["speed"]

    def info(self) -> bullet_info:
        return self.bullet
    
    def create(data:dict):
        return bullet(data)

class shooting:
    def __init__(self, data:dict):
        self.shooting = shooting_info()
        self.shooting.id = data["id"]
        self.shooting.name = data["name"]
        self.shooting.icon = data["icon"]
        self.shooting.desc = data["desc"]
        self.shooting.equip_type = data["type"]
        self.shooting._bullet_info = bullet.create(data["bullet"])

    def info(self) -> shooting_info:
        return self.shooting

    def create(data:dict):
        return shooting(data)

class equip_data:
    def __init__(self, data:dict[str, any]):
        self.equips = {}
        for type, info in data.items():
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
    
    def wear(self,equip:equip|weapon|shooting):
        old = None
        if equip.type not in self.equips:
            old = self.equips[equip.type]
        self.equips[equip.type] = equip
        return old