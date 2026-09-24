# -*- coding: UTF-8 -*-
from __future__ import annotations
from typing import TypedDict
from ..engine.common_svr import *

class postion(TypedDict):
    x: int
    y: int

class scene_novice_village(TypedDict):
    local_pos:postion
    scene_name:str
    pos:postion

class SceneInfo(TypedDict):
    area:str = ""
    scene_name:str = ""
    novice_villages:list[scene_novice_village] = []

SceneInfos:list[SceneInfo] = []