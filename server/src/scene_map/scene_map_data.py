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
    
class scene_spawn_point(TypedDict):
    spawn_point:position = position()

class scene_map_collection:
    scene_maps: dict[str, scene_map] = {}
    scene_spawn_points: dict[str, scene_spawn_point] = {}

def __load_portals__(scene_name:str, _map:scene_map) -> scene_map:
    with open('../../excel/Portal.json') as f:
        data = json.load(f)
        for _v in data.value():
            if _v["scene1"] == scene_name:
                p = Portal()
                curr_p = json.loads(_v["pos1"])
                curr_pos = position()
                curr_pos.x = curr_p[0]
                curr_pos.y = curr_p[1]
                p.curr_pos = curr_pos
                p.area = _v["area2"]
                p.scene_name = _v["scene2"]
                new_p = json.loads(_v["pos2"])
                new_pos = position()
                new_pos.x = new_p[0]
                new_pos.y = new_p[1]
                p.new_pos = new_pos
                _map.portals.append(p)
            elif _v["scene2"] == scene_name:
                p = Portal()
                curr_p = json.loads(_v["pos2"])
                curr_pos = position()
                curr_pos.x = curr_p[0]
                curr_pos.y = curr_p[1]
                p.curr_pos = curr_pos
                p.area = _v["area1"]
                p.scene_name = _v["scene1"]
                new_p = json.loads(_v["pos1"])
                new_pos = position()
                new_pos.x = new_p[0]
                new_pos.y = new_p[1]
                p.new_pos = new_pos
                _map.portals.append(p)
    return _map

def __map_primitive_data__(scene_name:str, _map:scene_map) -> scene_map:
    map_data_list:list[int] = []
    _property:set[int] = set()
    with open(f"../../map/{scene_name}/Chicken.world") as f:
        data = json.load(f)
        chicken_world = data["maps"]
        minx = 0xffffffff, miny = 0xffffffff, maxx = 0, maxy = 0
        for i in range(len(chicken_world)):
            map_data = chicken_world[i]
            x = map_data["x"]
            y = map_data["y"]

            if x < minx:
                minx = x

            if y < miny:
                miny = y

            if x > maxx:
                maxx = x

            if y > maxy:
                maxy = y
        
        maxx += 1024
        maxy += 512
        _map.map_width = maxx - minx
        _map.map_height = maxy - miny
        _map.map_width_box = _map.map_width / 16
        _map.map_height_box = _map.map_height / 16
        
        for i in range(len(chicken_world)):
            map_data = chicken_world[i]
            x = map_data["x"]
            y = map_data["y"]

            file_name = map_data["fileName"]
            real_file_name = file_name.split('.')
            json_file_name = real_file_name[0] + ".json"
            offset_x = x / 16
            offset_y = (0 - y) / 16

            with open(f"../../map/{scene_name}/{json_file_name}") as fjson:
                map_info_table = json.load(fjson)
    
                map_info_tilesets = map_info_table["tilesets"]
                for i in range(len(map_info_tilesets)):
                    tile_info = map_info_tilesets[i]

                    if "source" not in tile_info:
                        continue

                    property_file_name:str = tile_info["source"]
                    begin = property_file_name.rfind("/")
                    if begin <= -1:
                        begin = 0
                    else:   
                        begin += 1
                    end = property_file_name.rfind('.')
                    real_property_file_name = property_file_name[begin:(end - begin)]
                    if real_property_file_name == "empty":
                        continue
                    json_property_file_name = real_property_file_name + ".json"
                    firstgid:int = tile_info["firstgid"]

                    with open(f"../../map/{scene_name}/{json_property_file_name}") as f_prop:
                        property_info_table = json.load(f_prop)
                        if "tiles" not in property_info_table:
                            continue
                        
                        property_info_tiles = property_info_table["tiles"]
                        for tile_property in range(len(property_info_tiles)):
                            tile_property_info = property_info_tiles[tile_property]
                            id = tile_property_info["id"]
                            if "terrain" in tile_property_info:
                                terrain_list = tile_property_info["terrain"]
                                terrain = -1
                                for i in range(4):
                                    terrain = terrain_list[i]
                                    if (terrain >= 0):
                                        break
                                terrains = property_info_table["terrains"]
                                terrain_info = terrains[terrain]
                                if "properties" in terrain_info:
                                    terrain_property = terrain_info["properties"]

                                for sub_p in range(len(terrain_property)):
                                    sub_p_table = terrain_property[sub_p]
                                    sub_p_name = sub_p_table["name"]

                                    if sub_p_name == "collision":
                                        _id = (int)(id + firstgid)
                                        _property.add(_id)
                            elif "properties" in tile_property_info:
                                terrain_property = tile_property_info["properties"]

                                for sub_p in range(len(terrain_property)):
                                    sub_p_table = terrain_property[sub_p]
                                    sub_p_name = sub_p_table["name"]

                                if sub_p_name == "collision":
                                    _id = (int)(id + firstgid)
                                    _property.add(_id)
    
            layers = map_info_table.get_value_list("layers")
            for layer in range(len(layers)):
                layer_info = layers[layer]
                layer_name = layer_info["name"]
                print(f"layer_name:{layer_name}")

                if layer_name == "groundLayer":
                    data = layer_info["data"]
        
                    for x in range(64):
                        for y in range(32):
                            id = data[y * 64 + x]
                            map_data_list[(offset_y + (32 - y - 1)) * _map.map_width_box + (offset_x + x)] = id
                            print(f"map_data_list id:{id} x:{x} y{y}")
                elif layer_name == "ladderLayer":
                    data = layer_info["objects"]

                    for object in range(len(data)):
                        object_info = data[object]

                        ladder_x:int = object_info["x"]
                        ladder_width = object_info["width"]
                        ladder_y = object_info["y"]
                        ladder_height = object_info["height"]

                        _ladder = ladder() 
                        _ladder.x_min = ladder_x + x
                        _ladder.x_max = ladder_x + x + ladder_width
                        _ladder.y_min = (512 - ladder_y - ladder_height) + y
                        _ladder.y_max = (512 - ladder_y) + y
                        _map.ladder_date.append(_ladder)

    for i in range(len(map_data_list)):
        p = map_data_list[i]
        elm = element()
        while True:
            if p == 0:
                elm._property = em_map_element_property.em_map_empty
                print(f"create_map p == 0 property:{p}, x:{i % _map.map_width_box}, y{i / _map.map_width_box}!")
                break
        
            if p not in _property:
                elm._property = em_map_element_property.em_map_empty
                print(f"create_map invaild property:{p}, x:{i % _map.map_width_box}, y{ i / _map.map_width_box}!")
                break

            elm._property = em_map_element_property.em_map_map
            break
        _map.map_data.append(elm)

    return _map

def load_scene_map(scene_name:str):
    _map = scene_map()
    _map = __load_portals__(scene_name, _map)
    _map = __map_primitive_data__(scene_name, _map)
    scene_map_collection.scene_maps[scene_name] = _map

def load_scene_spawn_point():
    with open('../../excel/Area.json') as f:
        data = json.load(f)
        for s in data.value():
            point = scene_spawn_point()
            point.spawn_point = position()
            pos = json.loads(s["postion"])
            point.spawn_point.x = pos[0]
            point.spawn_point.y = pos[1]
            scene_map_collection.scene_spawn_points[s["scene"]] = point

def get_scene_map(scene_name:str) -> scene_map | None:
    return scene_map_collection.scene_maps.get(scene_name)

def get_scene_spawn_point(scene_name:str) -> scene_spawn_point:
    return scene_map_collection.scene_spawn_points.get(scene_name)