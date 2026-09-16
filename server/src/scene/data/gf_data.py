# -*- coding: UTF-8 -*-
from ...engine.common_svr import *

class gf_data:
    def __init__(self, user_id:str, data:dict):
        self.user_id = user_id

        self.gfs:list[gongfa] = []
        for gf in data["gfs"]:
            _gongfa = gongfa()
            _gongfa.gongfa_id = gf["gongfa_id"]
            _gongfa.gongfa_level = gf["gongfa_level"]
            _gongfa.rarity = gf["rarity"]
            _gongfa.abonus = protcol_to_attribute(gf["abonus"])
            _gongfa.skills = []
            for s in gf["skills"]:
                _gongfa.skills.append(protcol_to_skill_info(s))
            self.gfs.append(_gongfa)
            if data["curr_gf"] == _gongfa.gongfa_id:
                self.curr_gf = _gongfa

    def curr_gf_info(self) -> dict:
        skills = []
        for s in self.curr_gf.skills:
            skills.append(skill_info_to_protcol(s))
        abonus = attribute_to_protcol(self.curr_gf.abonus)
        return {
            "gongfa_id": self.curr_gf.gongfa_id,
            "gongfa_level": self.curr_gf.gongfa_level,
            "rarity": self.curr_gf.rarity,
            "abonus": abonus,
            "skills": skills,
        }

    def info(self) -> list[dict]:
        data:list[dict] = []
        for d in self.gfs:
            skills = []
            for s in d.skills:
                skills.append(skill_info_to_protcol(s))
            abonus = attribute_to_protcol(d.abonus)
            _d = {
                "gongfa_id": d.gongfa_id,
                "gongfa_level": d.gongfa_level,
                "rarity": d.rarity,
                "abonus": abonus,
                "skills": skills,
            }
            data.append(_d)
        return data