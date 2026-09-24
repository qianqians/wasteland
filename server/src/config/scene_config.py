# -*- coding: UTF-8 -*-
from __future__ import annotations
from typing import TypedDict
from ..engine.common_svr import *

class postion(TypedDict):
    x: int = 0.0
    y: int = 0.0

class scene_postion(TypedDict):
    scene_name:str
    scene_line:int
    pos:postion

class scene_novice_village(TypedDict):
    local_pos:postion
    next_scene_name:str
    pos:postion

class SceneInfo(TypedDict):
    area:str = ""
    scene_name:str = ""
    novice_villages:list[scene_novice_village] = []
    spawn_point:postion = None

SceneInfos:list[SceneInfo] = []