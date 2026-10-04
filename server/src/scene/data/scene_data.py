# -*- coding: UTF-8 -*-
from __future__ import annotations
from typing import TypedDict
from ...engine.common_svr import *
from ...engine.scene_ntf_client_svr import *
from ...engine.scene_svr import *
from ...config.scene_config import *
from ..scene_map_data import *
from ...helper import const
from ..scene_map_data import scene_map as scene_map_data

class scene_data:
    def __init__(self, user_id:str, info:scene_postion, scene_caller:scene_ntf_client_caller):
        self.user_id = user_id

        self.speed = 24
        self.climbing_speed = 16
        self.jump_speed = 32
        self.vertical_dir = direction.none
        self.up_time = 0

        self.scene_name:str = info["scene_name"]
        self.scene_line:int = info["scene_line"]
        # 新角色走的是 get_novice_village() 的 {"pos": {...}}；老存档是 info() 里
        # 笔误写成的 "postion"，两个 key 都兼容一下，否则读档 KeyError: 'pos'
        pos = info.get("pos") or info.get("postion") or {}
        self.postion:position_info = position_info()
        self.postion.x = pos.get("x", 0)
        self.postion.y = pos.get("y", 0)

        self.scene_caller:scene_ntf_client_caller = scene_caller
        self.update_timestamp:float = time.time()

    def __get_layer_element__(self, _scene_map_data:scene_map_data, layer:str, x_box, y_box):
        """按格坐标取 layer 元素，越界当空格。

        postion 是浮点数（speed * dt 累加），直接拿 postion.x/64 当下标会
        TypeError: list indices must be integers or slices, not float；
        而这个异常会从 update() 一路冒到 app.poll() 里没有 try 的 update() 调用，
        直接把整个场景进程带崩 —— 表现就是 consul 里查不到 yunmeng_marsh_1。
        """
        x_box = int(x_box)
        y_box = int(y_box)
        if x_box < 0 or y_box < 0:
            return em_map_element_property.em_map_empty
        idx = y_box * _scene_map_data["map_width_box"] + x_box
        _layer = _scene_map_data[layer]
        if idx < 0 or idx >= len(_layer):
            return em_map_element_property.em_map_empty
        return _layer[idx]

    def __get_postion_box__(self) -> tuple[int, int]:
        return (int(self.postion.x // 64), int(self.postion.y // 64))

    def check_blocking_move(self, _scene_map_data:scene_map_data) -> bool:
        x_box, y_box = self.__get_postion_box__()
        if self.__check_direction__(direction.right):
            blocking_element_forward = self.__get_layer_element__(_scene_map_data, "blockingLayer", x_box + 1, y_box)
        elif self.__check_direction__(direction.left):
            blocking_element_forward = self.__get_layer_element__(_scene_map_data, "blockingLayer", x_box - 1, y_box)
        else:
            return False
        return blocking_element_forward == em_map_element_property.em_map_map

    def check_fall_off(self, _scene_map_data:scene_map_data) -> bool:
        x_box, y_box = self.__get_postion_box__()
        element = self.__get_layer_element__(_scene_map_data, "moveLayer", x_box, y_box - 1)
        return element == em_map_element_property.em_map_empty

    def check_stairs(self, _scene_map_data:scene_map_data) -> int:
        x_box, y_box = self.__get_postion_box__()
        step = self.__check_direction__(direction.right) and 1 or self.__check_direction__(direction.left) and -1 or 0
        element = self.__get_layer_element__(_scene_map_data, "stairsLayer", x_box + step, y_box + 1)
        if element == em_map_element_property.em_map_map:
            return y_box + 1
        element = self.__get_layer_element__(_scene_map_data, "stairsLayer", x_box + step, y_box - 1)
        if element == em_map_element_property.em_map_map:
            return y_box - 1
        return 0

    def check_move_climbing(self, _scene_map_data:scene_map_data, timeDetail:float):
        dir_y = self.__check_direction__(direction.up) and 1 or self.__check_direction__(direction.down) and -1 or 0
        if dir_y == 0:
            return
        x_box, y_box = self.__get_postion_box__()
        element = self.__get_layer_element__(_scene_map_data, "climbingLayer", x_box, y_box)
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
        x_box, y_box = self.__get_postion_box__()
        y_box -= 1
        if y_box < 0:
            self.postion.y = 0
            self.postion.dir &= ~direction.down
        element = self.__get_layer_element__(_scene_map_data, "moveLayer", x_box, y_box)
        if element == em_map_element_property.em_map_map:
            self.postion.y = y_box*64
            self.postion.dir &= ~direction.down
        else:
            can_down = False
            for y in range(max(y_box, 0)):
                element = self.__get_layer_element__(_scene_map_data, "moveLayer", x_box, y)
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
                stairs = self.check_stairs(_scene_map_data)
                if stairs != 0:
                    self.postion.y += stairs*64
                self.postion.x_speed = self.speed
                if self.__check_direction__(direction.right):
                    self.postion.dir |= direction.right
                elif self.__check_direction__(direction.left):
                    self.postion.dir |= direction.left
        self.check_move_climbing(_scene_map_data, timeDetail)

        if self.__check_direction__(direction.up):
            self.check_move_up(timeDetail)
        elif self.__check_direction__(direction.down):
            self.check_move_down(_scene_map_data, timeDetail)

        self.__ntf_move__()
        self.update_timestamp = timestamp

    def __check_direction__(self, dir:direction):
        if (dir & self.vertical_dir) == dir:
            return True
        return False

    def __ntf_move__(self):
        if self.postion.dir == direction.none:
            return
        self.scene_caller.move(self.postion)

    def __clear_postion__(self):
        self.postion.dir = 0
        self.postion.x_speed = 0
        self.postion.y_speed = 0

    def __check_spawn_point__(self):
        scene_map = get_scene_map(self.scene_name)
        if scene_map == None:
            raise RuntimeError(f"scene_map not found for scene_name={self.scene_name}")
        for p in scene_map["spawn_point"]:
            if abs(p["in_position"].x - self.postion.x) <= 64 and abs(p["in_position"].y - self.postion.y) <= 64:
                self.scene_name = p["out_scene_name"]
                self.postion = p["out_position"]
                return (True, p["out_scene_name"])
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
        return {
            "user_id": self.user_id,
            "scene_name": self.scene_name,
            "scene_line": self.scene_line,
            # 原来这里写成 "postion"，跟 __init__ 里读的 "pos" 对不上（老存档靠上面的兼容读兜住）
            "pos": position_info_to_protcol(self.postion)
        }
