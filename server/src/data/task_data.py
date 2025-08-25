# -*- coding: UTF-8 -*-
from __future__ import annotations
from datetime import datetime, timedelta
import time
from ..engine.common_svr import *

def is_cross_day_simple(timestamp):
    date1 = datetime.fromtimestamp(timestamp).date()
    date2 = datetime.now().date()
    
    return date1 != date2

class task_data:
    def __init__(self, info:dict):
        self.taskes:dict[int, task_info] = {}
        for id, task in info.items():
            self.taskes[id] = protcol_to_task_info(task)

    def info(self) -> dict:
        return { id: task_info_to_protcol(task) for id, task in self.taskes.items() }
    
    def refresh_task(self):
        tasks = self.taskes
        self.taskes = {}
        for id, task in tasks.items():
            if task.refresh_time == 0 or task.refresh_time < time.time():
                self.taskes[id] = task

    def enter_task(self, task: task_info):
        if task.task_id not in self.taskes:
            self.taskes[task.task_id] = task

def task_create() -> task_data:
    return task_data({})