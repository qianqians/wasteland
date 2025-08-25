# -*- coding: UTF-8 -*-
from __future__ import annotations
from ..engine.common_svr import *

class bag_data:
    def __init__(self, info:dict):
        self.bag:dict[int, item] = {}
        for grid, item in info.items():
            self.bag[grid] = protcol_to_item(item)

    def info(self) -> dict:
        return { grid: item_to_protcol(item) for grid, item in self.bag.items() }

def bag_create() -> bag_data:
    return bag_data({})