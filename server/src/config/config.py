# -*- coding: UTF-8 -*-
from __future__ import annotations
import json
from .task_config import *
from .cond_config import *
from .pkg_config import *
from .item_config import *
from .talk_config import *
from .monster_config import *
from .skill_config import *

class configs:
    task_list:list[task_config] = []
    cond_list:list[cond_config] = []
    pkg_list:list[pkg_config] = []
    item_list:list[item_config] = []
    talk_list:list[talk_config] = []
    monster_list:list[monster_config] = []
    skill_list:list[skill_config] = []

def load_task_config():
    with open('../../excel/Task.json', 'r', encoding='utf-8') as f:
        data = json.load(f)
        configs.task_list = [t for t in data.values()]

def get_all_task_config() -> list[task_config]:
    return configs.task_list

def get_task_config(id:int) -> task_config | None:
    for task in configs.task_list:
        if task["id"] == id:
            return task
    return None
    
def load_cond_config():
    with open('../../excel/Cond.json', 'r', encoding='utf-8') as f:
        data = json.load(f)
        configs.cond_list = [c for c in data.values()]

def get_cond_config(id:int) -> cond_config | None:
    for cond in configs.cond_list:
        if cond["id"] == id:
            return cond
    return None

def load_pkg_config():
    with open('../../excel/Package.json', 'r', encoding='utf-8') as f:
        data = json.load(f)
        configs.pkg_list = [p for p in data.values()]

def get_pkg_config(id:int) -> pkg_config | None:
    for pkg in configs.pkg_list:
        if pkg["id"] == id:
            return pkg
    return None

def load_item_config():
    with open('../../excel/Item.json', 'r', encoding='utf-8') as f:
        data = json.load(f)
        configs.item_list = [item for item in data.values()]

def get_item_config(id:int) -> item_config | None:
    for item in configs.item_list:
        if item["id"] == id:
            return item
    return None

def load_talk_config():
    with open('../../excel/Talk.json', 'r', encoding='utf-8') as f:
        data = json.load(f)
        configs.talk_list = [t for t in data.values()]
        
def get_talk_config(id:int) -> talk_config | None:
    for talk in configs.talk_list:
        if talk["id"] == id:
            return talk
    return None

def load_monster_config():
    with open('../../excel/Monster.json') as f:
        data = json.load(f)
        configs.monster_list = [t for t in data.values()]
        
def get_monster_config(id:int) -> monster_config | None:
    for monster in configs.monster_list:
        if monster["id"] == id:
            return monster
    return None

def load_skill_config():
    with open('../../excel/Skill.json') as f:
        data = json.load(f)
        configs.skill_list = [t for t in data.values()]
        
def get_skill_config(id:int) -> skill_config | None:
    for skill in configs.skill_list:
        if skill["id"] == id:
            return skill
    return None