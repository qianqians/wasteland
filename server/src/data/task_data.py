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
        for id, task in info["task"].items():
            self.taskes[id] = protcol_to_task_info(task)
            
        self.progress:dict[int, task_progress_info] = {}
        for id, progress in info["progress"].items():
            self.progress[id] = protcol_to_task_progress_info(progress)

    def info(self) -> dict:
        tasks = { id: task_info_to_protcol(task) for id, task in self.taskes.items() }
        progress = { id: progress for id, progress in self.progress.items() }
        return {"task": tasks, "progress": progress }
    
    def get_progress(self, progress_id: int) -> int:
        if progress_id in self.progress:
            return self.progress[progress_id].progress
        return 0
    
    def refresh_task(self):
        tasks = self.taskes
        self.taskes = {}
        for id, task in tasks.items():
            if task.refresh_time == 0 or task.refresh_time < time.time():
                self.taskes[id] = task

    def enter_task(self, task: task_info, progress: list[task_progress_info]):
        if task.task_id not in self.taskes:
            self.taskes[task.task_id] = task
            
        for p in progress:
            if p.id not in self.progress:
                self.progress[p.id] = p
            if task.task_id not in self.progress[p.id].watch_task:
                self.progress[p.id].watch_task.append(task.task_id)
            

def task_create() -> task_data:
    return task_data({})