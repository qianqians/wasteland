# -*- coding: UTF-8 -*-
from __future__ import annotations
from ..engine.common_svr import *

class bag_data:
    def __init__(self, info:dict):
        self.bag:dict[int, item] = {}
        for grid, item in info:
            self.bag[grid] = protcol_to_item(item)

    def create() -> bag_data:
        return bag_data({})