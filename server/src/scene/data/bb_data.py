# -*- coding: UTF-8 -*-
from ...engine.common_svr import *
from .attribute_data import *

class bb_data:
    def __init__(self, user_id:str, data:dict):
        self.user_id = user_id

        self.wait_bbs:list[bb] = []
        for info in data["wait_bbs"]:
            self.wait_bbs.append(protcol_to_bb(info))

        self.curr_bb:list[bb] = []
        for id in data["curr_bb"]:
            for b in self.wait_bbs:
                if b.entity_id == id: self.curr_bb.append(b)

    def curr_bb(self) -> list[str]:
        curr_bb = []
        for b in self.curr_bb:
            curr_bb.append(b.entity_id)
        return curr_bb

    def wait_info(self) -> list[dict]:
        wait_bbs = []
        for b in self.wait_bbs:
            wait_bbs.append(bb_to_protcol(b))
        return wait_bbs