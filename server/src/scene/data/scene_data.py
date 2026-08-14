# -*- coding: UTF-8 -*-
from __future__ import annotations
from typing import TypedDict
from ...engine.common_svr import *
from ...engine.scene_ntf_client_svr import *
from ...engine.scene_svr import *
from ..scene_map_data import *
from ...helper import const
from ..scene_map_data import scene_map as scene_map_data

class postion_data(TypedDict):
    x:int = 0
    y:int = 0
    
class scene_postion(TypedDict):
    scene_name:str
    scene_line:int
    pos:postion_data

class scene_data:
    def __init__(self, user_id:str, scene_caller:scene_ntf_client_caller, info:dict):
        self.user_id = user_id
        self.speed = 24
        self.climbing_speed = 16
        self.jump_speed = 32
        self.vertical_dir = direction.none
        self.up_time = 0
        
        self.scene_name:str = info["scene_name"]
        self.scene_line:int = info["scene_line"]
        self.postion:position = protcol_to_position(info["postion"])

        self.scene_caller:scene_ntf_client_caller = scene_caller
        self.update_timestamp:float = time.time()

    def check_blocking_move(self, _scene_map_data:scene_map_data) -> bool:
        y_box = self.postion.y/64
        if self.__check_direction__(direction.right):
            blocking_element_forward = _scene_map_data.blockingLayer[y_box*_scene_map_data.map_width_box + self.postion.x/64 + 1]
        elif self.__check_direction__(direction.left):
            blocking_element_forward = _scene_map_data.blockingLayer[y_box*_scene_map_data.map_width_box + self.postion.x/64 - 1]
        return blocking_element_forward == em_map_element_property.em_map_map

    def check_fall_off(self, _scene_map_data:scene_map_data) -> bool:
        y_box = self.postion.y/64 - 1
        element = _scene_map_data.moveLayer[y_box*_scene_map_data.map_width_box + self.postion.x/64]
        return element == em_map_element_property.em_map_empty

    def check_stairs(self, _scene_map_data:scene_map_data) -> int:
        y_box = self.postion.y/64
        x_box = self.__check_direction__(direction.right) and 1 or self.__check_direction__(direction.left) and -1 or 0
        element = _scene_map_data.stairsLayer[(y_box+1)*_scene_map_data.map_width_box + self.postion.x/64 + x_box]
        if element == em_map_element_property.em_map_map:
            return y_box+1
        element = _scene_map_data.stairsLayer[(y_box-1)*_scene_map_data.map_width_box + self.postion.x/64 + x_box]
        if element == em_map_element_property.em_map_map:
            return y_box-1
        return 0

    def check_move_climbing(self, _scene_map_data:scene_map_data, timeDetail:float):
        dir_y = self.__check_direction__(direction.up) and 1 or self.__check_direction__(direction.down) and -1 or 0
        if dir_y == 0:
            return
        y_box = self.postion.y/64
        element = _scene_map_data.climbingLayer[y_box*_scene_map_data.map_width_box + self.postion.x/64]
        if element == em_map_element_property.em_map_map:
            self.postion.dir |= direction.up if dir_y > 0 else direction.down
            self.postion.y += self.climbing_speed * timeDetail * dir_y

    def check_move_up(self, timeDetail:float):
        self.postion.y += self.jump_speed * timeDetail
        self.up_time += timeDetail
        if self.up_time >= const.up_time:
            self.up_time = 0
            self.postion.dir |= direction.down
        else:
            self.postion.dir |= direction.up

    def check_move_down(self, _scene_map_data:scene_map_data, timeDetail:float):
        y_box = self.postion.y/64 - 1
        if y_box < 0:
            self.postion.y = 0
            self.postion.dir &= ~direction.down
        element = _scene_map_data.moveLayer[y_box*_scene_map_data.map_width_box + self.postion.x/64]
        if element == em_map_element_property.em_map_map:
            self.postion.y = y_box*64
            self.postion.dir &= ~direction.down
        else:
            can_down = False
            for y in range(y_box):
                element = _scene_map_data.moveLayer[y*_scene_map_data.map_width_box + self.postion.x/64]
                can_down = element == em_map_element_property.em_map_map
                if can_down: break
            if can_down:
                self.postion.y -= self.jump_speed * timeDetail

    def update(self, _scene_map_data:scene_map_data):
        timestamp = time.time()
        timeDetail = timestamp - self.update_timestamp

        dir_c = 0
        if self.__check_direction__(direction.right):
            dir_c = 1
        elif self.__check_direction__(direction.left):
            dir_c = -1
        if dir_c != 0:
            self.postion.x += self.speed * timeDetail * dir_c
            if self.check_blocking_move(_scene_map_data):
                self.postion.dir = direction.none
                self.postion.x_speed = 0
            elif self.check_fall_off(_scene_map_data):
                self.postion.dir |= direction.down
                self.postion.y_speed = -self.jump_speed
            else:
                stairs = self.check_stairs(_scene_map_data, dir_c)
                if stairs != 0:
                    self.postion.y += stairs*64
                self.postion.x_speed = self.speed
                if self.__check_direction__(direction.right):
                    self.postion.dir |= direction.right
                elif self.__check_direction__(direction.left):
                    self.postion.dir |= direction.left
        self.check_move_climbing(_scene_map_data, timeDetail)

        if self.__check_direction__(direction.up):
            self.check_move_up(_scene_map_data, timeDetail)
        elif self.__check_direction__(direction.down):
            self.check_move_down(_scene_map_data, timeDetail)

        self.__ntf_move__()
        self.update_timestamp = timestamp

    def __check_direction__(self, dir:direction):
        if (dir & self.vertical_dir) == dir:
            return True
        return False

    def __ntf_move__(self):
        self.scene_caller.move(self.postion)

    def __clear_postion__(self):
        self.postion.dir = 0
        self.postion.x_speed = 0
        self.postion.y_speed = 0

    def __check_spawn_point__(self):
        scene_map = get_scene_map(self.scene_name)
        if scene_map == None:
            raise RuntimeError(f"scene_map not found for scene_name={self.scene_name}")
        for p in scene_map.spawn_point:
            if abs(p.in_position.x - self.postion.x) <= 64 and abs(p.in_position.y - self.postion.y) <= 64:
                self.scene_name = p.out_scene_name
                self.postion = p.out_position
                return (True, p.out_scene_name)
        return (False, None)

    def begin_move(self, dir:direction) -> tuple[bool, str]:
        self.vertical_dir = dir
        if self.__check_direction__(direction.up):
            [is_spawn, spawn_scene_name] = self.__check_spawn_point__()
            if is_spawn:
                return (True, spawn_scene_name)
            
        self.__clear_postion__()    
        return (False, None)

    def info(self) -> dict:
        return { "scene_name": self.scene_name, "scene_line": self.scene_line, 
            "postion": position_to_protcol(self.postion) }
