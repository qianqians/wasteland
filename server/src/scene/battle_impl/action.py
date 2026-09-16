# -*- coding: UTF-8 -*-
from __future__ import annotations
from typing import Protocol
from typing import TypedDict, cast
from ..player_data import *

class ActionEntity(Protocol):
    def __init__(self):
        super().__init__()

        self.entity_id: str = ""
        self.abonus:attribute = None
        self.level:int = 1
        self.speed:int = 0

class Action(TypedDict):
    entity: ActionEntity = None
    skill_id: int = 0
    target: str = ""
