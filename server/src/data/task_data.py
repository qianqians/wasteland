# -*- coding: UTF-8 -*-
from __future__ import annotations
from ..engine.common_svr import *

class task_data:
    def __init__(self, info:dict):
        self.taskes:dict[int, task_info] = {}
        for id, task in info.items():
            self.taskes[id] = protcol_to_task_info(task)

    def create() -> task_data:
        return task_data({})