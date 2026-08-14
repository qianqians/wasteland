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
    undefined_player_id = 6
    unlock_talk_task = 7
    unlock_level_not_completed = 8
    unconfig_talk_task = 9
    talk_npc_not_scene = 10
    cannot_use_skill = 11
    not_in_spawn_point = 12


class em_rarity(Enum):
    common = 1
    rare = 2
    epic = 3
    legendary = 4


class em_equip_type(Enum):
    helmet = 1
    jacket = 2
    trousers = 3
    gloves = 4
    boots = 5
    weapon = 6
    bb_attack = 11
    bb_defense = 12
    bb_resist = 13


class direction(Enum):
    none = 0
    up = 1
    down = 2
    left = 4
    right = 8


class em_task_state(Enum):
    can_claimed = 1
    in_progress = 2
    can_completed = 3
    completed = 4


#this struct code is codegen by geese codegen for python
class attribute(object):
    def __init__(self):
        self.add_hp:int = 0
        self.add_mp:int = 0
        self.attack:int = 0
        self.defense:int = 0
        self.matk:int = 0
        self.resist:int = 0


def attribute_to_protcol(_struct:attribute):
    if _struct is None:
        return None
    _protocol = {}
    _protocol["add_hp"] = _struct.add_hp
    _protocol["add_mp"] = _struct.add_mp
    _protocol["attack"] = _struct.attack
    _protocol["defense"] = _struct.defense
    _protocol["matk"] = _struct.matk
    _protocol["resist"] = _struct.resist
    return _protocol

def protcol_to_attribute(_protocol:dict):
    _struct = attribute()
    for (key, val) in _protocol.items():
        if key == "add_hp":
            _struct.add_hp = val
        elif key == "add_mp":
            _struct.add_mp = val
        elif key == "attack":
            _struct.attack = val
        elif key == "defense":
            _struct.defense = val
        elif key == "matk":
            _struct.matk = val
        elif key == "resist":
            _struct.resist = val
    return _struct

class equip_info(object):
    def __init__(self):
        self.equip_id:str = ""
        self.name:str = ""
        self.icon:str = ""
        self.desc:str = ""
        self.equip_type:em_equip_type = 0
        self.rarity:em_rarity = 0
        self.bonus:attribute = None


def equip_info_to_protcol(_struct:equip_info):
    if _struct is None:
        return None
    _protocol = {}
    _protocol["equip_id"] = _struct.equip_id
    _protocol["name"] = _struct.name
    _protocol["icon"] = _struct.icon
    _protocol["desc"] = _struct.desc
    _protocol["equip_type"] = _struct.equip_type
    _protocol["rarity"] = _struct.rarity
    _protocol["bonus"] = attribute_to_protcol(_struct.bonus)
    return _protocol

def protcol_to_equip_info(_protocol:dict):
    _struct = equip_info()
    for (key, val) in _protocol.items():
        if key == "equip_id":
            _struct.equip_id = val
        elif key == "name":
            _struct.name = val
        elif key == "icon":
            _struct.icon = val
        elif key == "desc":
            _struct.desc = val
        elif key == "equip_type":
            _struct.equip_type = val
        elif key == "rarity":
            _struct.rarity = val
        elif key == "bonus":
            _struct.bonus = protcol_to_attribute(val)
    return _struct

class position(object):
    def __init__(self):
        self.x:int = 0
        self.y:int = 0
        self.x_speed:int = 0
        self.y_speed:int = 0
        self.dir:int = 0


def position_to_protcol(_struct:position):
    if _struct is None:
        return None
    _protocol = {}
    _protocol["x"] = _struct.x
    _protocol["y"] = _struct.y
    _protocol["x_speed"] = _struct.x_speed
    _protocol["y_speed"] = _struct.y_speed
    _protocol["dir"] = _struct.dir
    return _protocol

def protcol_to_position(_protocol:dict):
    _struct = position()
    for (key, val) in _protocol.items():
        if key == "x":
            _struct.x = val
        elif key == "y":
            _struct.y = val
        elif key == "x_speed":
            _struct.x_speed = val
        elif key == "y_speed":
            _struct.y_speed = val
        elif key == "dir":
            _struct.dir = val
    return _struct

class skill_info(object):
    def __init__(self):
        self.skill_id:int = 0
        self.attack:int = 0
        self.attack_range:int = 0
        self.cd_round:int = 0
        self.cast_spells:float = 0.0


def skill_info_to_protcol(_struct:skill_info):
    if _struct is None:
        return None
    _protocol = {}
    _protocol["skill_id"] = _struct.skill_id
    _protocol["attack"] = _struct.attack
    _protocol["attack_range"] = _struct.attack_range
    _protocol["cd_round"] = _struct.cd_round
    _protocol["cast_spells"] = _struct.cast_spells
    return _protocol

def protcol_to_skill_info(_protocol:dict):
    _struct = skill_info()
    for (key, val) in _protocol.items():
        if key == "skill_id":
            _struct.skill_id = val
        elif key == "attack":
            _struct.attack = val
        elif key == "attack_range":
            _struct.attack_range = val
        elif key == "cd_round":
            _struct.cd_round = val
        elif key == "cast_spells":
            _struct.cast_spells = val
    return _struct

class gongfa_bonus(object):
    def __init__(self):
        self.abonus:attribute = None
        self.skills:list[skill_info] = []


def gongfa_bonus_to_protcol(_struct:gongfa_bonus):
    if _struct is None:
        return None
    _protocol = {}
    _protocol["abonus"] = attribute_to_protcol(_struct.abonus)
    if _struct.skills:
        _array_skills = []
        for v_ in _struct.skills:
            _array_skills.append(skill_info_to_protcol(v_))
        _protocol["skills"] = _array_skills
    return _protocol

def protcol_to_gongfa_bonus(_protocol:dict):
    _struct = gongfa_bonus()
    for (key, val) in _protocol.items():
        if key == "abonus":
            _struct.abonus = protcol_to_attribute(val)
        elif key == "skills":
            _struct.skills = []
            for v_ in val:
                _struct.skills.append(skill_info_to_protcol(v_))
    return _struct

class gongfa(object):
    def __init__(self):
        self.gongfa_table_id:int = 0
        self.rarity:em_rarity = 0
        self.gongfa_level:int = 0
        self.bonus:gongfa_bonus = None


def gongfa_to_protcol(_struct:gongfa):
    if _struct is None:
        return None
    _protocol = {}
    _protocol["gongfa_table_id"] = _struct.gongfa_table_id
    _protocol["rarity"] = _struct.rarity
    _protocol["gongfa_level"] = _struct.gongfa_level
    _protocol["bonus"] = gongfa_bonus_to_protcol(_struct.bonus)
    return _protocol

def protcol_to_gongfa(_protocol:dict):
    _struct = gongfa()
    for (key, val) in _protocol.items():
        if key == "gongfa_table_id":
            _struct.gongfa_table_id = val
        elif key == "rarity":
            _struct.rarity = val
        elif key == "gongfa_level":
            _struct.gongfa_level = val
        elif key == "bonus":
            _struct.bonus = protcol_to_gongfa_bonus(val)
    return _struct

class task_progress_info(object):
    def __init__(self):
        self.table_id:int = 0
        self.total:int = 0
        self.progress:int = 0


def task_progress_info_to_protcol(_struct:task_progress_info):
    if _struct is None:
        return None
    _protocol = {}
    _protocol["table_id"] = _struct.table_id
    _protocol["total"] = _struct.total
    _protocol["progress"] = _struct.progress
    return _protocol

def protcol_to_task_progress_info(_protocol:dict):
    _struct = task_progress_info()
    for (key, val) in _protocol.items():
        if key == "table_id":
            _struct.table_id = val
        elif key == "total":
            _struct.total = val
        elif key == "progress":
            _struct.progress = val
    return _struct

class task_info(object):
    def __init__(self):
        self.task_id:int = 0
        self.status:em_task_state = 0
        self.progress:list[task_progress_info] = []
        self.refresh_time:int = 0


def task_info_to_protcol(_struct:task_info):
    if _struct is None:
        return None
    _protocol = {}
    _protocol["task_id"] = _struct.task_id
    _protocol["status"] = _struct.status
    if _struct.progress:
        _array_progress = []
        for v_ in _struct.progress:
            _array_progress.append(task_progress_info_to_protcol(v_))
        _protocol["progress"] = _array_progress
    _protocol["refresh_time"] = _struct.refresh_time
    return _protocol

def protcol_to_task_info(_protocol:dict):
    _struct = task_info()
    for (key, val) in _protocol.items():
        if key == "task_id":
            _struct.task_id = val
        elif key == "status":
            _struct.status = val
        elif key == "progress":
            _struct.progress = []
            for v_ in val:
                _struct.progress.append(task_progress_info_to_protcol(v_))
        elif key == "refresh_time":
            _struct.refresh_time = val
    return _struct

class item(object):
    def __init__(self):
        self.item_type:int = 0
        self.item_count:int = 0


def item_to_protcol(_struct:item):
    if _struct is None:
        return None
    _protocol = {}
    _protocol["item_type"] = _struct.item_type
    _protocol["item_count"] = _struct.item_count
    return _protocol

def protcol_to_item(_protocol:dict):
    _struct = item()
    for (key, val) in _protocol.items():
        if key == "item_type":
            _struct.item_type = val
        elif key == "item_count":
            _struct.item_count = val
    return _struct

class bb(object):
    def __init__(self):
        self.bb_table_id:int = 0
        self.rarity:em_rarity = 0
        self.level:int = 0
        self.bonus:attribute = None
        self.skills:list[skill_info] = []
        self.equips:list[equip_info] = []


def bb_to_protcol(_struct:bb):
    if _struct is None:
        return None
    _protocol = {}
    _protocol["bb_table_id"] = _struct.bb_table_id
    _protocol["rarity"] = _struct.rarity
    _protocol["level"] = _struct.level
    _protocol["bonus"] = attribute_to_protcol(_struct.bonus)
    if _struct.skills:
        _array_skills = []
        for v_ in _struct.skills:
            _array_skills.append(skill_info_to_protcol(v_))
        _protocol["skills"] = _array_skills
    if _struct.equips:
        _array_equips = []
        for v_ in _struct.equips:
            _array_equips.append(equip_info_to_protcol(v_))
        _protocol["equips"] = _array_equips
    return _protocol

def protcol_to_bb(_protocol:dict):
    _struct = bb()
    for (key, val) in _protocol.items():
        if key == "bb_table_id":
            _struct.bb_table_id = val
        elif key == "rarity":
            _struct.rarity = val
        elif key == "level":
            _struct.level = val
        elif key == "bonus":
            _struct.bonus = protcol_to_attribute(val)
        elif key == "skills":
            _struct.skills = []
            for v_ in val:
                _struct.skills.append(skill_info_to_protcol(v_))
        elif key == "equips":
            _struct.equips = []
            for v_ in val:
                _struct.equips.append(equip_info_to_protcol(v_))
    return _struct

class player_info(object):
    def __init__(self):
        self.account_id:str = ""
        self.player_id:str = ""
        self.player_nick_name:str = ""
        self.player_appearance:int = 0
        self.abonus:attribute = None
        self.gfs:list[gongfa] = []
        self.curr_gf:gongfa = None
        self.equips:list[equip_info] = []
        self.bbs:list[bb] = []
        self.curr_bb:list[bb] = []
        self.items:list[item] = []
        self.tasks:list[task_info] = []
        self.gender:int = 0
        self.scene:str = ""
        self.line:int = 0
        self.pos:position = None


def player_info_to_protcol(_struct:player_info):
    if _struct is None:
        return None
    _protocol = {}
    _protocol["account_id"] = _struct.account_id
    _protocol["player_id"] = _struct.player_id
    _protocol["player_nick_name"] = _struct.player_nick_name
    _protocol["player_appearance"] = _struct.player_appearance
    _protocol["abonus"] = attribute_to_protcol(_struct.abonus)
    if _struct.gfs:
        _array_gfs = []
        for v_ in _struct.gfs:
            _array_gfs.append(gongfa_to_protcol(v_))
        _protocol["gfs"] = _array_gfs
    _protocol["curr_gf"] = gongfa_to_protcol(_struct.curr_gf)
    if _struct.equips:
        _array_equips = []
        for v_ in _struct.equips:
            _array_equips.append(equip_info_to_protcol(v_))
        _protocol["equips"] = _array_equips
    if _struct.bbs:
        _array_bbs = []
        for v_ in _struct.bbs:
            _array_bbs.append(bb_to_protcol(v_))
        _protocol["bbs"] = _array_bbs
    if _struct.curr_bb:
        _array_curr_bb = []
        for v_ in _struct.curr_bb:
            _array_curr_bb.append(bb_to_protcol(v_))
        _protocol["curr_bb"] = _array_curr_bb
    if _struct.items:
        _array_items = []
        for v_ in _struct.items:
            _array_items.append(item_to_protcol(v_))
        _protocol["items"] = _array_items
    if _struct.tasks:
        _array_tasks = []
        for v_ in _struct.tasks:
            _array_tasks.append(task_info_to_protcol(v_))
        _protocol["tasks"] = _array_tasks
    _protocol["gender"] = _struct.gender
    _protocol["scene"] = _struct.scene
    _protocol["line"] = _struct.line
    _protocol["pos"] = position_to_protcol(_struct.pos)
    return _protocol

def protcol_to_player_info(_protocol:dict):
    _struct = player_info()
    for (key, val) in _protocol.items():
        if key == "account_id":
            _struct.account_id = val
        elif key == "player_id":
            _struct.player_id = val
        elif key == "player_nick_name":
            _struct.player_nick_name = val
        elif key == "player_appearance":
            _struct.player_appearance = val
        elif key == "abonus":
            _struct.abonus = protcol_to_attribute(val)
        elif key == "gfs":
            _struct.gfs = []
            for v_ in val:
                _struct.gfs.append(gongfa_to_protcol(v_))
        elif key == "curr_gf":
            _struct.curr_gf = protcol_to_gongfa(val)
        elif key == "equips":
            _struct.equips = []
            for v_ in val:
                _struct.equips.append(equip_info_to_protcol(v_))
        elif key == "bbs":
            _struct.bbs = []
            for v_ in val:
                _struct.bbs.append(bb_to_protcol(v_))
        elif key == "curr_bb":
            _struct.curr_bb = []
            for v_ in val:
                _struct.curr_bb.append(bb_to_protcol(v_))
        elif key == "items":
            _struct.items = []
            for v_ in val:
                _struct.items.append(item_to_protcol(v_))
        elif key == "tasks":
            _struct.tasks = []
            for v_ in val:
                _struct.tasks.append(task_info_to_protcol(v_))
        elif key == "gender":
            _struct.gender = val
        elif key == "scene":
            _struct.scene = val
        elif key == "line":
            _struct.line = val
        elif key == "pos":
            _struct.pos = protcol_to_position(val)
    return _struct

class player_battle_info(object):
    def __init__(self):
        self.player_id:str = ""
        self.player_nick_name:str = ""
        self.player_appearance:int = 0
        self.abonus:attribute = None
        self.curr_gf:gongfa = None
        self.equips:list[equip_info] = []
        self.bbs:list[bb] = []
        self.curr_bb:list[bb] = []
        self.items:list[item] = []
        self.gender:int = 0
        self.scene:str = ""


def player_battle_info_to_protcol(_struct:player_battle_info):
    if _struct is None:
        return None
    _protocol = {}
    _protocol["player_id"] = _struct.player_id
    _protocol["player_nick_name"] = _struct.player_nick_name
    _protocol["player_appearance"] = _struct.player_appearance
    _protocol["abonus"] = attribute_to_protcol(_struct.abonus)
    _protocol["curr_gf"] = gongfa_to_protcol(_struct.curr_gf)
    if _struct.equips:
        _array_equips = []
        for v_ in _struct.equips:
            _array_equips.append(equip_info_to_protcol(v_))
        _protocol["equips"] = _array_equips
    if _struct.bbs:
        _array_bbs = []
        for v_ in _struct.bbs:
            _array_bbs.append(bb_to_protcol(v_))
        _protocol["bbs"] = _array_bbs
    if _struct.curr_bb:
        _array_curr_bb = []
        for v_ in _struct.curr_bb:
            _array_curr_bb.append(bb_to_protcol(v_))
        _protocol["curr_bb"] = _array_curr_bb
    if _struct.items:
        _array_items = []
        for v_ in _struct.items:
            _array_items.append(item_to_protcol(v_))
        _protocol["items"] = _array_items
    _protocol["gender"] = _struct.gender
    _protocol["scene"] = _struct.scene
    return _protocol

def protcol_to_player_battle_info(_protocol:dict):
    _struct = player_battle_info()
    for (key, val) in _protocol.items():
        if key == "player_id":
            _struct.player_id = val
        elif key == "player_nick_name":
            _struct.player_nick_name = val
        elif key == "player_appearance":
            _struct.player_appearance = val
        elif key == "abonus":
            _struct.abonus = protcol_to_attribute(val)
        elif key == "curr_gf":
            _struct.curr_gf = protcol_to_gongfa(val)
        elif key == "equips":
            _struct.equips = []
            for v_ in val:
                _struct.equips.append(equip_info_to_protcol(v_))
        elif key == "bbs":
            _struct.bbs = []
            for v_ in val:
                _struct.bbs.append(bb_to_protcol(v_))
        elif key == "curr_bb":
            _struct.curr_bb = []
            for v_ in val:
                _struct.curr_bb.append(bb_to_protcol(v_))
        elif key == "items":
            _struct.items = []
            for v_ in val:
                _struct.items.append(item_to_protcol(v_))
        elif key == "gender":
            _struct.gender = val
        elif key == "scene":
            _struct.scene = val
    return _struct

#this caller code is codegen by geese codegen for python
#this module code is codegen by geese codegen for python

