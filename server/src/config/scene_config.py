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

map_skyland:SceneInfo = {
    "area": "yunmeng_marsh",
    "scene_name": "map_skyland",
    "novice_villages": [
        {
            "local_pos": {
                "x": 16,
                "y": 64
            },
            "next_scene_name": "stalactiteCave",
            "pos": {
                "x": 64,
                "y": 64
            }
        },
        {
            "local_pos": {
                "x": 512,
                "y": 64
            },
            "next_scene_name": "stalactiteCave",
            "pos": {
                "x": 512,
                "y": 64
            }
        }
    ],
    "spawn_point": {
        "x": 128,
        "y": 64
    }
}

stalactiteCave:SceneInfo = {
    "area": "yunmeng_marsh",
    "scene_name": "stalactiteCave",
    "novice_villages": [
        {
            "local_pos": {
                "x": 64,
                "y": 64
            },
            "next_scene_name": "map_skyland",
            "pos": {
                "x": 16,
                "y": 64
            }
        },
        {
            "local_pos": {
                "x": 512,
                "y": 64
            },
            "next_scene_name": "map_skyland",
            "pos": {
                "x": 512,
                "y": 64
            }
        }
    ],
    "spawn_point": None
}

SceneInfos:list[SceneInfo] = [
    map_skyland,
    stalactiteCave
]