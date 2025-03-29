from threading import Timer
from collections.abc import Callable
from enum import Enum
from .engine import *
from .engine.msgpack import *

# this enum code is codegen by geese codegen for python

class error_code(Enum):
    success = 0
    cannot_claimed = 1
    cannot_completed = 2
    not_enough_money = 3
    no_this_equip = 4
    no_this_item = 5


class em_direction(Enum):
    stationary = 0
    up = 1
    down = 2
    left = 3
    right = 4


class em_equip_type(Enum):
    helmet = 1
    jacket = 2
    trousers = 3
    gloves = 4
    boots = 5
    weapon = 6
    shooting = 7


class em_shooting_bullet(Enum):
    arrow = 1
    bullet = 2


class em_task_state(Enum):
    can_claimed = 1
    in_progress = 2
    can_completed = 3
    completed = 4


class em_harm_type(Enum):
    melee_attack = 1
    bullet_damage = 2
    bow_arrow = 3


#this struct code is codegen by geese codegen for python
class position(object):
    def __init__(self):
        self.x:int = 0
        self.y:int = 0


def position_to_protcol(_struct:position):
    if _struct is None:
        return None
    _protocol = {}
    _protocol["x"] = _struct.x
    _protocol["y"] = _struct.y
    return _protocol

def protcol_to_position(_protocol:dict):
    _struct = position()
    for (key, val) in _protocol.items():
        if key == "x":
            _struct.x = val
        elif key == "y":
            _struct.y = val
    return _struct

class equip_info(object):
    def __init__(self):
        self.id:str = ""
        self.name:str = ""
        self.icon:str = ""
        self.desc:str = ""
        self.equip_type:em_equip_type = 0
        self.add_hp:int = 0
        self.add_mp:int = 0
        self.add_defense:int = 0


def equip_info_to_protcol(_struct:equip_info):
    if _struct is None:
        return None
    _protocol = {}
    _protocol["id"] = _struct.id
    _protocol["name"] = _struct.name
    _protocol["icon"] = _struct.icon
    _protocol["desc"] = _struct.desc
    _protocol["equip_type"] = _struct.equip_type
    _protocol["add_hp"] = _struct.add_hp
    _protocol["add_mp"] = _struct.add_mp
    _protocol["add_defense"] = _struct.add_defense
    return _protocol

def protcol_to_equip_info(_protocol:dict):
    _struct = equip_info()
    for (key, val) in _protocol.items():
        if key == "id":
            _struct.id = val
        elif key == "name":
            _struct.name = val
        elif key == "icon":
            _struct.icon = val
        elif key == "desc":
            _struct.desc = val
        elif key == "equip_type":
            _struct.equip_type = val
        elif key == "add_hp":
            _struct.add_hp = val
        elif key == "add_mp":
            _struct.add_mp = val
        elif key == "add_defense":
            _struct.add_defense = val
    return _struct

class weapon_info(object):
    def __init__(self):
        self.id:str = ""
        self.name:str = ""
        self.icon:str = ""
        self.desc:str = ""
        self.equip_type:em_equip_type = 0
        self.attack:int = 0


def weapon_info_to_protcol(_struct:weapon_info):
    if _struct is None:
        return None
    _protocol = {}
    _protocol["id"] = _struct.id
    _protocol["name"] = _struct.name
    _protocol["icon"] = _struct.icon
    _protocol["desc"] = _struct.desc
    _protocol["equip_type"] = _struct.equip_type
    _protocol["attack"] = _struct.attack
    return _protocol

def protcol_to_weapon_info(_protocol:dict):
    _struct = weapon_info()
    for (key, val) in _protocol.items():
        if key == "id":
            _struct.id = val
        elif key == "name":
            _struct.name = val
        elif key == "icon":
            _struct.icon = val
        elif key == "desc":
            _struct.desc = val
        elif key == "equip_type":
            _struct.equip_type = val
        elif key == "attack":
            _struct.attack = val
    return _struct

class bullet_info(object):
    def __init__(self):
        self.id:str = ""
        self.name:str = ""
        self.icon:str = ""
        self.desc:str = ""
        self.type:em_shooting_bullet = 0
        self.attack:int = 0
        self.speed:int = 0


def bullet_info_to_protcol(_struct:bullet_info):
    if _struct is None:
        return None
    _protocol = {}
    _protocol["id"] = _struct.id
    _protocol["name"] = _struct.name
    _protocol["icon"] = _struct.icon
    _protocol["desc"] = _struct.desc
    _protocol["type"] = _struct.type
    _protocol["attack"] = _struct.attack
    _protocol["speed"] = _struct.speed
    return _protocol

def protcol_to_bullet_info(_protocol:dict):
    _struct = bullet_info()
    for (key, val) in _protocol.items():
        if key == "id":
            _struct.id = val
        elif key == "name":
            _struct.name = val
        elif key == "icon":
            _struct.icon = val
        elif key == "desc":
            _struct.desc = val
        elif key == "type":
            _struct.type = val
        elif key == "attack":
            _struct.attack = val
        elif key == "speed":
            _struct.speed = val
    return _struct

class shooting_info(object):
    def __init__(self):
        self.id:str = ""
        self.name:str = ""
        self.icon:str = ""
        self.desc:str = ""
        self.equip_type:em_equip_type = 0
        self._bullet_info:bullet_info = None


def shooting_info_to_protcol(_struct:shooting_info):
    if _struct is None:
        return None
    _protocol = {}
    _protocol["id"] = _struct.id
    _protocol["name"] = _struct.name
    _protocol["icon"] = _struct.icon
    _protocol["desc"] = _struct.desc
    _protocol["equip_type"] = _struct.equip_type
    _protocol["_bullet_info"] = bullet_info_to_protcol(_struct._bullet_info)
    return _protocol

def protcol_to_shooting_info(_protocol:dict):
    _struct = shooting_info()
    for (key, val) in _protocol.items():
        if key == "id":
            _struct.id = val
        elif key == "name":
            _struct.name = val
        elif key == "icon":
            _struct.icon = val
        elif key == "desc":
            _struct.desc = val
        elif key == "equip_type":
            _struct.equip_type = val
        elif key == "_bullet_info":
            _struct._bullet_info = protcol_to_bullet_info(val)
    return _struct

class task_info(object):
    def __init__(self):
        self.task_id:int = 0
        self.progress:int = 0
        self.status:em_task_state = 0


def task_info_to_protcol(_struct:task_info):
    if _struct is None:
        return None
    _protocol = {}
    _protocol["task_id"] = _struct.task_id
    _protocol["progress"] = _struct.progress
    _protocol["status"] = _struct.status
    return _protocol

def protcol_to_task_info(_protocol:dict):
    _struct = task_info()
    for (key, val) in _protocol.items():
        if key == "task_id":
            _struct.task_id = val
        elif key == "progress":
            _struct.progress = val
        elif key == "status":
            _struct.status = val
    return _struct

class item(object):
    def __init__(self):
        self.item_id:str = ""
        self.item_type:int = 0
        self.item_count:int = 0


def item_to_protcol(_struct:item):
    if _struct is None:
        return None
    _protocol = {}
    _protocol["item_id"] = _struct.item_id
    _protocol["item_type"] = _struct.item_type
    _protocol["item_count"] = _struct.item_count
    return _protocol

def protcol_to_item(_protocol:dict):
    _struct = item()
    for (key, val) in _protocol.items():
        if key == "item_id":
            _struct.item_id = val
        elif key == "item_type":
            _struct.item_type = val
        elif key == "item_count":
            _struct.item_count = val
    return _struct

#this caller code is codegen by geese codegen for python
#this module code is codegen by geese codegen for python

