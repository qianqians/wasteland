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

class task_info(object):
    def __init__(self):
        self.task_id:int = 0
        self.status:em_task_state = 0


def task_info_to_protcol(_struct:task_info):
    _protocol = {}
    _protocol["task_id"] = _struct.task_id
    _protocol["status"] = _struct.status
    return _protocol

def protcol_to_task_info(_protocol:dict):
    _struct = task_info()
    for (key, val) in _protocol.items():
        if key == "task_id":
            _struct.task_id = val
        elif key == "status":
            _struct.status = val
    return _struct

class item(object):
    def __init__(self):
        self.item_id:int = 0
        self.item_type:int = 0
        self.item_count:int = 0


def item_to_protcol(_struct:item):
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

