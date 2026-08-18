# -*- coding: UTF-8 -*-

class bb:
    def __init__(self):
        pass

    def info(self) -> dict:
        return {}

class bb_data:
    def __init__(self):
        self.curr_bb:list[bb] = []
        self.bbs:list[bb] = []

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