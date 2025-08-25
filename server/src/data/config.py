# -*- coding: UTF-8 -*-
from __future__ import annotations
from typing import TypedDict
import json

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

def load_task_config() -> list[task_config]:
    with open('../../excel/Task.json', 'r', encoding='utf-8') as f:
        data = json.load(f)
        return [t for t in data.values()]
    
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

def load_cond_config() -> dict[int, cond_config]:
    with open('../../excel/Cond.json', 'r', encoding='utf-8') as f:
        data = json.load(f)
        return {int(cond["id"]): cond for cond in data.values()}