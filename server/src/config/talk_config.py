# -*- coding: UTF-8 -*-
from typing import TypedDict

class talk_config(TypedDict):
    id: int
    unlock_level: int
    need_talk: int
    next_talk: list[int]
    talk_npc: int
    talk: str