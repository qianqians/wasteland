# -*- coding: UTF-8 -*-
from __future__ import annotations
from typing import TypedDict
import json

class configs:
    task_list:list[task_config] = []
    cond_list:list[cond_config] = []
    pkg_list:list[pkg_config] = []
    item_list:list[item_config] = []

class task_config(TypedDict):
    id: int
    task_type: str
    unlock_level: int
    accept_type: int
    accept_npc: int
    accept_condition: int
    before_accept_task_desc: str
    after_accept_task_desc: str
    complete_type: int
    complete_npc: int
    complete_condition: int
    task_reward: int

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
    
class cond_config(TypedDict):
    id: int
    condition1: int
    condition1_type: int
    condition1_desc: str
    condition1_value: int
    condition2: int
    condition2_type: int
    condition2_desc: str
    condition2_value: int
    condition3: int
    condition3_type: int
    condition3_desc: str
    condition3_value: int
    condition4: int
    condition4_type: int
    condition4_desc: str
    condition4_value: int

def load_cond_config():
    with open('../../excel/Cond.json', 'r', encoding='utf-8') as f:
        data = json.load(f)
        configs.cond_list = [c for c in data.values()]

def get_cond_config(id:int) -> cond_config | None:
    for cond in configs.cond_list:
        if cond["id"] == id:
            return cond
    return None

class pkg_config(TypedDict):
    id: int
    item1_id: int
    item1_num: int
    item2_id: int
    item2_num: int
    item3_id: int
    item3_num: int
    item4_id: int
    item4_num: int

def load_pkg_config():
    with open('../../excel/Package.json', 'r', encoding='utf-8') as f:
        data = json.load(f)
        configs.pkg_list = [p for p in data.values()]

def get_pkg_config(id:int) -> pkg_config | None:
    for pkg in configs.pkg_list:
        if pkg["id"] == id:
            return pkg
    return None

class item_config(TypedDict):
    id: int
    desc: str

def load_item_config():
    with open('../../excel/Item.json', 'r', encoding='utf-8') as f:
        data = json.load(f)
        configs.item_list = [item for item in data.values()]

def get_item_config(id:int) -> item_config | None:
    for item in configs.item_list:
        if item["id"] == id:
            return item
    return None