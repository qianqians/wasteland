# -*- coding: UTF-8 -*-
from typing import TypedDict

class task_config(TypedDict):
    id: int
    task_type: str
    unlock_level: int
    accept_type: int
    accept_talk: int
    accept_condition: int
    before_accept_task_desc: str
    after_accept_task_desc: str
    complete_type: int
    complete_talk: int
    complete_condition: int
    task_reward: int
