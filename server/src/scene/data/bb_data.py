# -*- coding: UTF-8 -*-
from .attribute_data import *

class bb:
    def __init__(self, info:dict):
        self.attribute = attribute_data(info["bb_id"], info)

    def info(self) -> dict:
        return self.attribute.info

class bb_data:
    def __init__(self, bbs:list[dict], curr_bb:list[str]):
        self.bbs:list[bb] = []
        for info in bbs:
            self.bbs.append(bb(info))

        self.curr_bb:list[bb] = []
        for id in curr_bb:
            for b in self.bbs:
                if b.attribute.user_id == id: self.curr_bb.append(b)

    def battle_bb(self) -> list[dict]:
        bb = []
        for b in self.curr_bb:
            bb.append(b.info())
        return bb

    def info(self) -> list[dict]:
        bb = []
        for b in self.bbs:
            bb.append(b.info())
        return bb