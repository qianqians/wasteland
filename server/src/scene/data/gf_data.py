# -*- coding: UTF-8 -*-
from ...engine.common_svr import *

class gf_data:
    def __init__(self, entity_id:str, gf_list:list[dict], curr_gf:str):
        self.entity_id = entity_id

        self.gfs:list[gongfa] = []
        for gf in gf_list:
            _gongfa = gongfa()
            _gongfa.gongfa_id = gf["gongfa_id"]
            _gongfa.gongfa_level = gf["gongfa_level"]
            _gongfa.rarity = gf["rarity"]
            _gongfa.abonus = attribute()
            _gongfa.abonus.hp = gf["hp"]
            _gongfa.abonus.mp = gf["mp"]
            _gongfa.abonus.speed = gf["speed"]
            _gongfa.abonus.attack = gf["attack"]
            _gongfa.abonus.defense = gf["defense"]
            _gongfa.abonus.matk = gf["matk"]
            _gongfa.abonus.resist = gf["resist"]
            _gongfa.skills = []
            for s in gf["skills"]:
                _gongfa.skills.append(protcol_to_skill_info(s))
            self.gfs.append(_gongfa)
            if curr_gf == _gongfa.gongfa_id:
                self.curr_gf = _gongfa

    def curr_gf_info(self) -> dict:
        return self.curr_gf.info

    def info(self) -> list[dict]:
        data = []
        for d in self.gfs:
            data.append(d.info())
        return data