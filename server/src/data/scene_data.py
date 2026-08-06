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
        
        self.scene_name:str = info["scene_name"]
        self.scene_line:int = info["scene_line"]
        self.postion:position = protcol_to_position(info["postion"])

        self.scene_caller:scene_ntf_client_caller = scene_caller
        self.update_timestamp:float = time.time()

    def check_blocking_move(self, _scene:scene, dir_c:int) -> bool:
        y_box = self.postion.y/16
        if dir_c == 1:
            blocking_element_forward = _scene.scene_map_data.blockingLayer[y_box*_scene.scene_map_data.map_width_box + self.postion.x/16 + 1]
        elif dir_c == -1:
            blocking_element_forward = _scene.scene_map_data.blockingLayer[y_box*_scene.scene_map_data.map_width_box + self.postion.x/16 - 1]
        return blocking_element_forward == em_map_element_property.em_map_map

    def check_fall_off(self, _scene:scene) -> bool:
        y_box = self.postion.y/16
        element = _scene.scene_map_data.moveLayer[y_box*_scene.scene_map_data.map_width_box + self.postion.x/16]
        return element == em_map_element_property.em_map_empty

    def check_stairs(self, _scene:scene, dir_c:int) -> bool:
        y_box = self.postion.y/16
        element = _scene.scene_map_data.stairsLayer[(y_box+1)*_scene.scene_map_data.map_width_box + self.postion.x/16 + dir_c]
        return element == em_map_element_property.em_map_map

    def update(self, _scene:scene):
        timestamp = time.time()
        timeDetail = timestamp - self.update_timestamp

        dir_c = 0
        if (self.postion.dir & direction.right) == direction.right:
            dir_c = 1
        elif (self.postion.dir & direction.left) == direction.left:
            dir_c = -1
        if dir_c != 0:
            self.postion.x += self.speed * timeDetail * dir_c
            y_box = self.postion.y/16
            element = _scene.scene_map_data.moveLayer[y_box*_scene.scene_map_data.map_width_box + self.postion.x/16]
            if element == em_map_element_property.em_map_empty:
                self.vertical_dir = direction.down
            else:
                if self.check_blocking_move(_scene, dir_c):
                    self.postion.dir = direction.none
                elif self.check_fall_off(_scene):
                    self.vertical_dir = direction.down
                elif self.check_stairs(_scene, dir_c):
                    self.postion.y += (y_box + 1)*16
        else:
            dic_y = 0
            if (self.postion.dir & direction.up) == direction.up:
                dic_y = 1
            elif (self.postion.dir & direction.down) == direction.down:
                dic_y = -1
            if dic_y != 0:
                self.postion.y += self.speed * timeDetail * dic_y
                y_box = self.postion.y/16
                element = _scene.scene_map_data.climbingLayer[y_box*_scene.scene_map_data.map_width_box + self.postion.x/16]
                if element == em_map_element_property.em_map_empty:
                    self.postion.dir = direction.none
                    self.vertical_dir = direction.down

        if self.vertical_dir == direction.up:
            self.postion.y += self.vertical_speed * timeDetail
            self.up_time += timeDetail
            if self.up_time >= const.up_time:
                self.up_time = 0
                self.vertical_dir = direction.down
        elif self.vertical_dir == direction.down:
            y_box = self.postion.y/16
            element = _scene.scene_map_data.moveLayer[y_box*_scene.scene_map_data.map_width_box + self.postion.x/16]
            if element == em_map_element_property.em_map_map:
                self.postion.y = y_box*16
                self.vertical_dir = direction.none
            else:
                self.postion.y -= self.vertical_speed * timeDetail
                
        self.__ntf_move__()
        self.update_timestamp = timestamp

    def __ntf_move__(self):
        self.scene_caller.move(self.vertical_dir, self.postion)

    def begin_move(self, vertical_dir:direction, pos:position) -> tuple[bool, str]:
        self.postion.dir = pos.dir
        self.vertical_dir = vertical_dir
        
        if vertical_dir == direction.up:
            scene_map = get_scene_map(self.scene_name)
            if scene_map == None:
                raise RuntimeError(f"scene_map not found for scene_name={self.scene_name}")
            for p in scene_map.spawn_point:
                if abs(p.in_position.x - self.postion.x) <= 0.5 and abs(p.in_position.y - self.postion.y) <= 0.5:
                    self.scene_name = p.out_scene_name
                    self.postion = p.out_position
                    return (False, p.out_scene_name)
        return (True, None)


    def info(self) -> dict:
        return { "scene_name": self.scene_name, "scene_line": self.scene_line, 
            "postion": position_to_protcol(self.postion) }
