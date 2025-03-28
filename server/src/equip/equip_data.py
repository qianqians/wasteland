from ..engine.common_svr import *

class equip:
    def __init__(self, data:dict):
        self.id = data["id"]
        self.name = data["name"]
        self.icon = data["icon"]
        self.desc = data["desc"]
        self.type = data["type"]
        self.add_hp = data["add_hp"]
        self.add_mp = data["add_mp"]
        self.add_defense = data["add_defense"]

    def info(self) -> dict:
        return {
            "id": self.id,
            "name": self.name,
            "icon": self.icon,
            "desc": self.desc,
            "type": self.type,
            "add_hp": self.add_hp,
            "add_mp": self.add_mp,
            "add_defense": self.add_defense,
        }
    
    def create(data:dict):
        return equip(data)
    
class weapon:
    def __init__(self, data:dict):
        self.id = data["id"]
        self.name = data["name"]
        self.icon = data["icon"]
        self.desc = data["desc"]
        self.type = data["type"]
        self.attack = data["attack"]

    def info(self) -> dict:
        return {
            "id": self.id,
            "name": self.name,
            "icon": self.icon,
            "desc": self.desc,
            "type": self.type,
            "attack": self.attack,
        }
    
    def create(data:dict):
        return weapon(data)

class bullet:
    def __init__(self, data:dict):
        self.id = data["id"]
        self.name = data["name"]
        self.icon = data["icon"]
        self.desc = data["desc"]
        self.type = data["type"]
        self.attack = data["attack"]
        self.speed = data["speed"]

    def info(self) -> dict:
        return {
            "id": self.id,
            "name": self.name,
            "icon": self.icon,
            "desc": self.desc,
            "type": self.type,
            "attack": self.attack,
            "speed": self.speed,
        }
    
    def create(data:dict):
        return bullet(data)

class shooting:
    def __init__(self, data:dict):
        self.id = data["id"]
        self.name = data["name"]
        self.icon = data["icon"]
        self.desc = data["desc"]
        self.type = data["type"]
        self.bullet = bullet.create(data["bullet"])

    def info(self) -> dict:
        return {
            "id": self.id,
            "name": self.name,
            "icon": self.icon,
            "desc": self.desc,
            "type": self.type,
            "bullet": self.bullet,
    }

    def create(data:dict):
        return shooting(data)

class equip_data:
    def __init__(self, data:dict[str, dict]):
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