# -*- coding: UTF-8 -*-
from __future__ import annotations
from typing import TypedDict
from ..engine.common_svr import *

class postion_data(TypedDict):
    x:int = 0
    y:int = 0
    
class scene_postion(TypedDict):
    scene_name:str
    scene_line:int
    pos:postion_data

class scene_data:
    def __init__(self, user_id:str, info:dict):
        self.user_id = user_id
        
        self.write_back(info)

    def write_back(self, info:dict):
        self.scene_name:str = info["scene_name"]
        self.scene_line:int = info["scene_line"]
        self.postion = protcol_to_position(info["postion"])

    def info(self) -> dict:
        return { "scene_name": self.scene_name, "scene_line": self.scene_line, "postion": position_to_protcol(self.postion) }
