# -*- coding: UTF-8 -*-
from __future__ import annotations
from typing import TypedDict
from enum import Enum
from ..engine.common_svr import *

class em_map_element_property(Enum):
    em_map_empty = 0
    em_map_map = 1

class element(TypedDict):
    _property:em_map_element_property = em_map_element_property.em_map_empty

class ladder(TypedDict):
    x_min:int = 0
    x_max:int = 0
    y_min:int = 0
    y_max:int = 0
    
class Portal(TypedDict):
    curr_pos:position
    area:str
    scene_name:str
    new_pos:position

class scene_map(TypedDict):
    map_width:int = 0
    map_height:int = 0
    map_width_box:int = 0
    map_height_box:int = 0

    map_data:list[element] = []
    ladder_date:list[ladder] = []
    
    portals:list[Portal] = []
    spawn_point:position = None

class scene_map_collection:
    scene_maps: dict[str, scene_map] = {}

def load_scene_map(scene_name:str):
    _map = scene_map()
    with open('../../excel/Portal.json') as f:
        data = json.load(f)
        for _v in data.value():
            if _v["scene1"] == scene_name:
                p = Portal()
                p.curr_pos = json.loads(_v["pos1"])
                p.area = _v["area2"]
                p.scene_name = _v["scene2"]
                p.new_pos = json.loads(_v["pos2"])
                _map.portals.append(p)
            elif _v["scene2"] == scene_name:
                p = Portal()
                p.curr_pos = json.loads(_v["pos2"])
                p.area = _v["area1"]
                p.scene_name = _v["scene1"]
                p.new_pos = json.loads(_v["pos1"])
                _map.portals.append(p)
    return _map
            

def get_scene_map(scene_name:str) -> scene_map | None:
    return scene_map_collection.scene_maps.get(scene_name)