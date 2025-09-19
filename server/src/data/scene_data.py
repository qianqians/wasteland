# -*- coding: UTF-8 -*-
from __future__ import annotations
from typing import TypedDict
from ..engine.common_svr import *
from ..engine.scene_ntf_client_svr import *
from ..engine.scene_svr import *
from ..scene_map.scene_map_data import *
from ..scene.scene import *
from ..helper import const

class postion_data(TypedDict):
    x:int = 0
    y:int = 0
    dir:direction = direction.none
    
class scene_postion(TypedDict):
    scene_name:str
    scene_line:int
    pos:postion_data

class scene_data:
    def __init__(self, user_id:str, scene_caller:scene_ntf_client_caller, info:dict):
        self.user_id = user_id
        self.speed = 10
        self.vertical_speed = 20
        self.vertical_dir = direction.none
        self.up_time = 0
        self.write_back(info)

        self.scene_caller = scene_caller
        self.update_timestamp = time.time()

    def write_back(self, info:dict):
        self.scene_name:str = info["scene_name"]
        self.scene_line:int = info["scene_line"]
        self.postion = protcol_to_position(info["postion"])

    def update(self, _scene:scene):
        timestamp = time.time()
        timeDetail = timestamp - self.update_timestamp

        dir_c = 0
        if self.postion.dir == direction.right:
            dir_c = 1
        elif self.postion.dir == direction.left:
            dir_c = -1
        if dir_c != 0:
            self.postion.x += self.speed * timeDetail * dir_c
            y_box = self.postion.y/16
            element = _scene.scene_map_data.map_data[y_box*_scene.scene_map_data.map_width_box + self.postion.x/16]
            if element._property == em_map_element_property.em_map_empty:
                self.vertical_dir = direction.down

        if self.vertical_dir == direction.up:
            self.postion.y += self.vertical_speed * timeDetail
            self.up_time += timeDetail
            if self.up_time >= const.up_time:
                self.up_time = 0
                self.vertical_dir = direction.down
        elif self.vertical_dir == direction.down:
            y_box = self.postion.y/16
            element = _scene.scene_map_data.map_data[y_box*_scene.scene_map_data.map_width_box + self.postion.x/16]
            if element._property == em_map_element_property.em_map_map:
                self.postion.y = y_box*16
                self.vertical_dir = direction.none
            else:
                self.postion.y -= self.vertical_speed * timeDetail
                
        self.__ntf_move__()
        self.update_timestamp = timestamp

    def __ntf_move__(self):
        self.scene_caller.move(self.postion.dir, self.postion)

    def begin_move(self, dir:direction, pos:position):
        self.postion = pos
        self.postion.dir = dir

    def info(self) -> dict:
        return { "scene_name": self.scene_name, "scene_line": self.scene_line, "postion": position_to_protcol(self.postion) }
