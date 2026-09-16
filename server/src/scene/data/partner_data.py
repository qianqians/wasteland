# -*- coding: UTF-8 -*-
from ...engine.common_svr import *
from .attribute_data import *

class partner_data:
    def __init__(self, user_id:str, data:dict):
        self.user_id = user_id

        self.wait_partners:list[partner] = []
        for info in data["wait_partners"]:
            self.wait_partners.append(protcol_to_partner(info))

        self.curr_partner:list[partner] = []
        for id in data["curr_partner"]:
            for p in self.wait_partners:
                if p.entity_id == id: self.curr_partner.append(p)

    def curr_partner(self) -> list[str]:
        curr_partner = []
        for p in self.curr_partner:
            curr_partner.append(p.entity_id)
        return curr_partner

    def wait_info(self) -> list[dict]:
        wait_partners = []
        for p in self.wait_partners:
            wait_partners.append(partner_to_protcol(p))
        return wait_partners