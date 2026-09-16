# -*- coding: UTF-8 -*-
from ...engine.common_svr import *

class gf_data:
    def __init__(self, entity_id:str, data:dict):
        self.entity_id = entity_id

        self.curr_gf = gongfa()

    def curr_gf_info(self) -> dict:
        return self.curr_gf.info

    def info(self) -> list[dict]:
        data = []
        for d in self.gfs:
            data.append(d.info())
        return data