# -*- coding: UTF-8 -*-
from ...engine.common_svr import *
from .attribute_data import *

class bb:
    def __init__(self, info:dict):
        self.nick_name = info["nick_name"]
        self.appearance = info["appearance"]

        attribute_info:dict = info["attribute"]
        self.attribute = attribute_data(info["bb_id"], attribute_info)

        skills_info:dict = info["skills"]
        self.skills:dict[int, skill_info] = {}
        for id, skill in skills_info.items():
            self.skills[id] = protcol_to_skill_info(skill)

    def change_nick_name(self, nick_name:str):
        self.nick_name = nick_name

    def change_appearance(self, appearance:str):
        self.appearance = appearance

    def info(self) -> dict:
        return {
            "nick_name": self.nick_name,
            "appearance": self.appearance,
            "abonus": self.attribute.info()
        }
    
class bb_data:
    def __init__(self, wait_bbs:list[dict], curr_bb:list[str]):
        self.wait_bbs:list[bb] = []
        for info in wait_bbs:
            self.wait_bbs.append(bb(info))

        self.curr_bb:list[bb] = []
        for id in curr_bb:
            for b in self.curr_bb:
                if b.attribute.entity_id == id: self.curr_bb.append(b)

    def battle_bb(self) -> list[dict]:
        curr_bb = []
        for b in self.curr_bb:
            curr_bb.append(b.info())
        return curr_bb

    def wait_info(self) -> list[dict]:
        wait_bbs = []
        for b in self.wait_bbs:
            wait_bbs.append(b.info())
        return wait_bbs