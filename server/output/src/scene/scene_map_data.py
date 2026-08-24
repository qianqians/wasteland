# -*- coding: UTF-8 -*-
from __future__ import annotations
from typing import TypedDict, cast
from enum import Enum
from ..engine.common_svr import *

class scene_map_spawn_point(TypedDict):
    in_scene_name:str
    in_position:position
    out_scene_name:str
    out_position:position

class em_map_element_property(Enum):
    em_map_empty = 0
    em_map_map = 1

class scene_map(TypedDict):
    map_width:int = 0
    map_height:int = 0
    map_width_box:int = 0
    map_height_box:int = 0

    moveLayer:list[em_map_element_property] = []
    blockingLayer:list[em_map_element_property] = []
    stairsLayer:list[em_map_element_property] = []
    climbingLayer:list[em_map_element_property] = []

    spawn_point:list[scene_map_spawn_point] = []
    
class scene_map_collection:
    scene_maps: dict[str, scene_map] = {}

def __map_primitive_data__(scene_name:str) -> scene_map:
    _map:scene_map = scene_map()
    _map["spawn_point"] = []

    with open(f"../map/{scene_name}.tmj") as fjson:
        map_info_table = json.load(fjson)

        _map_size = map_info_table["width"] * map_info_table["height"]
        _map["moveLayer"] = [em_map_element_property.em_map_empty] * _map_size
        _map["blockingLayer"] = [em_map_element_property.em_map_empty] * _map_size
        _map["stairsLayer"] = [em_map_element_property.em_map_empty] * _map_size
        _map["climbingLayer"] = [em_map_element_property.em_map_empty] * _map_size

        layers = map_info_table["layers"]
        for layer in range(len(layers)):
            layer_info = layers[layer]
            layer_name = layer_info["name"]
            
            if layer_name == "moveLayer":
                data = layer_info["data"]
                h = layer_info["height"]
                w = layer_info["width"]
                _map["map_width_box"] = w
                _map["map_height_box"] = h

                for x in range(w):
                    for y in range(h):
                        id = data[y*w + x]
                        element_property = em_map_element_property.em_map_map if id != 0 else em_map_element_property.em_map_empty
                        _map["moveLayer"][y*w + x] = element_property
                        print(f"_map.moveLayer id:{id} x:{x} y{y}")
            elif layer_name == "blockingLayer":
                data = layer_info["data"]
                h = layer_info["height"]
                w = layer_info["width"]
                _map["map_width_box"] = w
                _map["map_height_box"] = h

                for x in range(w):
                    for y in range(h):
                        id = data[y*w + x]
                        element_property = em_map_element_property.em_map_map if id != 0 else em_map_element_property.em_map_empty
                        _map["blockingLayer"][y*w + x] = element_property
                        print(f"_map.blockingLayer id:{id} x:{x} y{y}")
            elif layer_name == "stairsLayer":
                data = layer_info["data"]
                h = layer_info["height"]
                w = layer_info["width"]
                _map["map_width_box"] = w
                _map["map_height_box"] = h

                for x in range(w):
                    for y in range(h):
                        id = data[y*w + x]
                        element_property = em_map_element_property.em_map_map if id != 0 else em_map_element_property.em_map_empty
                        _map["stairsLayer"][y*w + x] = element_property
                        print(f"_map.stairsLayer id:{id} x:{x} y{y}")
            elif layer_name == "climbingLayer":
                data = layer_info["data"]
                h = layer_info["height"]
                w = layer_info["width"]
                _map["map_width_box"] = w
                _map["map_height_box"] = h

                for x in range(w):
                    for y in range(h):
                        id = data[y*w + x]
                        element_property = em_map_element_property.em_map_map if id != 0 else em_map_element_property.em_map_empty
                        _map["climbingLayer"][y*w + x] = element_property
                        print(f"_map.climbingLayer id:{id} x:{x} y{y}")

    return _map

def load_scene_map(scene_name:str):
    _map = __map_primitive_data__(scene_name)
    scene_map_collection.scene_maps[scene_name] = _map

def get_scene_map(scene_name:str) -> scene_map | None:
    return scene_map_collection.scene_maps.get(scene_name)

def get_scene_spawn_point(scene_name:str, in_:position) -> scene_map_spawn_point | None:
    _map = get_scene_map(scene_name)
    if _map == None:
        return None
    _map = cast(scene_map, _map)
    if len(_map["spawn_point"]) <= 0:
        return None
    for _spawn_point in _map["spawn_point"]:
        if abs(_spawn_point["in_position"].x - in_.x) < 32 and abs(_spawn_point["in_position"].y - in_.y) < 32:
            return _spawn_point
    return None