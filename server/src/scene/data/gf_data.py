# -*- coding: UTF-8 -*-

class gf:
    def __init__(self):
        pass

    def info(self) -> dict:
        pass

class gf_data:
    def __init__(self):
        self.curr_gf = gf()
        self.gfs:list[gf] = []

    def curr_gf_info(self) -> dict:
        return self.curr_gf.info

    def info(self) -> list[dict]:
        data = []
        for d in self.gfs:
            data.append(d.info())
        return data