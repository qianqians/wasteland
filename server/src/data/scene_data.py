# -*- coding: UTF-8 -*-
from __future__ import annotations
from ..engine.common_svr import *

class scene_data:
    def __init__(self, info:dict):
        self.write_back(info)

    def write_back(self, info:dict):
        self.scene_name = info["scene_name"]
        self.scene_line = info["scene_line"]
        self.postion = protcol_to_position(info["postion"])

    def info(self) -> dict:
        return { "scene_name": self.scene_name, "scene_line": self.scene_line, "postion": position_to_protcol(self.postion) }
    
    def create() -> scene_data:
        return scene_data({ "scene_name": "wasteland_novice_village", "scene_line": 1, "postion": {"x":1, "y":1} })