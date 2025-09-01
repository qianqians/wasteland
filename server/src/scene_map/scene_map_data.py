# -*- coding: UTF-8 -*-
from __future__ import annotations
from typing import TypedDict
from enum import Enum

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

class scene_map(TypedDict):
    map_width:int = 0
    map_height:int = 0
    map_width_box:int = 0
    map_height_box:int = 0

    map_data:list[element] = []
    ladder_date:list[ladder] = []

class scene_map_collection:
    scene_maps: dict[str, scene_map] = {}

def load_scene_map(scene_name:str):
    pass

def get_scene_map(scene_name:str) -> scene_map | None:
    return scene_map_collection.scene_maps.get(scene_name)