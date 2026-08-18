# -*- coding: UTF-8 -*-
from __future__ import annotations
from datetime import datetime, timedelta
import time
from ...engine.common_svr import *
from ...engine.player_svr import *
from ...engine.player_ntf_client_svr import *
from ...config.config import *
from .skill_data import *
from .bag_data import *
from ..player_data import *

def is_cross_day_simple(timestamp):
    date1 = datetime.fromtimestamp(timestamp).date()
    date2 = datetime.now().date()
    
    return date1 != date2

class task_data:
    def __init__(self, user_id:str, info:dict, 
                 module:player_module, caller:player_ntf_client_caller, 
                 skill_data:skill_data, bag_data:bag_data, player_data:player_data):
        self.user_id = user_id
        
        self.talk:list[int] = []
        
        self.taskes:dict[int, task_info] = {}
        for id, task in info["task"].items():
            self.taskes[id] = protcol_to_task_info(task)
            
        self.progress:dict[int, task_progress_info] = {}
        for id, progress in info["progress"].items():
            self.progress[id] = protcol_to_task_progress_info(progress)
            
        self.caller = caller
        self.module = module
        self.skill_data = skill_data
        self.bag_data = bag_data
        self.player_data = player_data
        
        self.module.on_talk_npc.append(lambda rsp, talk_id: self.on_talk_npc(rsp, talk_id))
        self.module.on_get_task_info.append(lambda s: self.on_get_task_info(s))
        self.module.on_completed_task.append(lambda s, task_id: self.on_complete_task(s, task_id))

    def info(self) -> dict:
        tasks = { id: task_info_to_protcol(task) for id, task in self.taskes.items() }
        progress = { id: progress for id, progress in self.progress.items() }
        return {"task": tasks, "progress": progress }
    
    def on_talk_npc(self, rsp: player_talk_npc_rsp, talk_id: int):
        app().trace(f"player_id:{self.user_id} on_talk_npc:{talk_id} session:{rsp.source}")
        tconf = get_talk_config(talk_id)
        if tconf == None:
            app().error(f"player_id:{self.user_id} talk config not found, id={talk_id}")
            rsp.err(error_code.unconfig_talk_task)
            return
        
        if self.player_data.level < tconf["unlock_level"]:
            app().error(f"player_id:{self.user_id} {self.player_data.level} unlock_level{tconf["unlock_level"]} id={talk_id}")
            rsp.err(error_code.unlock_level_not_completed)
            return
        
        if tconf["need_talk"] not in self.talk:
            app().error(f"player_id:{self.user_id} need_talk={tconf["need_talk"]}, talk_list={self.talk}, id={talk_id}")
            rsp.err(error_code.unlock_talk_task)
            return
        
        if not self.player_data.scene.have_npc(tconf["talk_npc"]):
            app().error(f"player_id:{self.user_id} talk_npc={tconf["talk_npc"]} not in scene, id={talk_id}")
            rsp.err(error_code.talk_npc_not_scene)
            return
        
        rsp.rsp()
        if talk_id not in self.talk:
            self.talk.append(talk_id)
        self.check_task()
    
    def on_get_task_info(self, s: session):
        app().trace(f"player_id:{self.user_id} on_get_task_info session:{s.source}")
        self.check_task()
        
    def on_complete_task(self, s: session, task_id: int):
        app().trace(f"player_id:{self.user_id} on_complete_task:{task_id} session:{s.source}")
        self.check_task()

        task_info = self.taskes[task_id]
        if task_info == None:
            app().error(f"player_id:{self.user_id} task_info not found, task={task_id}")
            return
        if task_info.status != em_task_state.can_completed:
            app().error(f"player_id:{self.user_id} task_info status error, task={task_id}, status={task_info.status}")
            return
        
        tconf = get_task_config(task_id)
        if tconf == None:
            app().error(f"player_id:{self.user_id} task config not found, id={task_id}")
            return
        if tconf["complete_type"] == 2 and tconf["complete_talk"] not in self.talk:
            app().error(f"player_id:{self.user_id} task not completed talk:{tconf["complete_talk"]}, id={task_id}")
            return
        
        task_info.status = em_task_state.completed
        self.bag_data.drop(task_info.task_id, tconf["task_reward"])
        self.__complete_task__(task_info)

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

    def __enter_task__(self, task: task_info, progress: list[task_progress_info]):
        if task.task_id not in self.taskes:
            self.taskes[task.task_id] = task
            
        for p in progress:
            if p.id not in self.progress:
                self.progress[p.id] = p
            if task.task_id not in self.progress[p.id].watch_task:
                self.progress[p.id].watch_task.append(task.task_id)

    def __complete_task__(self, task: task_info):
        remove_progress = []
        for p in self.progress.values():
            if task.task_id in p.watch_task:
                p.watch_task.remove(task.task_id)
                if len(p.watch_task) == 0:
                    remove_progress.append(p.id)

        for id in remove_progress:
            self.progress.pop(id)
            
    def __check_cond_value__(self, cond: int, cond_type: int, value: int) -> bool:
        if cond == 1:
            return self.skill_data.has_learned_skill()
        if cond == 2:
            progress = self.get_progress(cond_type)
            return progress >= value
        return False

    def check_cond(self, cond: cond_config) -> bool:
        return self.__check_cond_value__(cond["condition1"], cond["condition1_type"], cond["condition1_value"]) and \
               self.__check_cond_value__(cond["condition2"], cond["condition2_type"], cond["condition2_value"]) and \
               self.__check_cond_value__(cond["condition3"], cond["condition3_type"], cond["condition3_value"]) and \
               self.__check_cond_value__(cond["condition4"], cond["condition4_type"], cond["condition4_value"])

    def __get_cond_progress__(self, cond: int, cond_type: int, value: int) -> task_progress_info | None:
        if cond == 2:
            info = task_progress_info()
            info.id = cond_type
            info.progress = 0
            info.watch_task = []
            return info
        return None
    
    def __get_cond_progress_total__(self, cond: int, cond_type: int, value: int) -> task_progress_total | None:
        if cond == 2:
            info = task_progress_total()
            info.id = cond_type
            info.total = value
            return info
        return None
    
    def get_cond_progress(self, cond: cond_config) -> list[task_progress_info]:
        task_progress_info_list = []
        task_progress_info_list.append(self.__get_cond_progress__(
            cond["condition1"], cond["condition1_type"], cond["condition1_value"]))
        task_progress_info_list.append(self.__get_cond_progress__(
            cond["condition2"], cond["condition2_type"], cond["condition2_value"]))
        task_progress_info_list.append(self.__get_cond_progress__(
            cond["condition3"], cond["condition3_type"], cond["condition3_value"]))
        task_progress_info_list.append(self.__get_cond_progress__(
            cond["condition4"], cond["condition4_type"], cond["condition4_value"]))
        return task_progress_info_list
    
    def get_cond_progress_total(self, cond: cond_config) -> list[task_progress_info]:
        task_progress_total_list = []
        task_progress_total_list.append(self.__get_cond_progress_total__(
            cond["condition1"], cond["condition1_type"], cond["condition1_value"]))
        task_progress_total_list.append(self.__get_cond_progress_total__(
            cond["condition2"], cond["condition2_type"], cond["condition2_value"]))
        task_progress_total_list.append(self.__get_cond_progress_total__(
            cond["condition3"], cond["condition3_type"], cond["condition3_value"]))
        task_progress_total_list.append(self.__get_cond_progress_total__(
            cond["condition4"], cond["condition4_type"], cond["condition4_value"]))
        return task_progress_total_list

    def check_accept_task(self):
        task_list = get_all_task_config()
        for task in task_list:
            if self.check_cond(get_cond_config(task["accept_condition"])):
                info = task_info()
                info.task_id = task["id"]
                
                if task["accept_type"] == 1:
                    info.status = em_task_state.in_progress
                elif task["accept_type"] == 2:
                    info.status = em_task_state.can_claimed
                    if task["accept_talk"] in self.talk:
                        info.status = em_task_state.in_progress
                    
                if task["refresh_type"] == 1:
                    now = datetime.now()
                    end_of_day = datetime(now.year, now.month, now.day, 23, 59, 59)
                    info.refresh_time = end_of_day.timestamp()
                elif task["refresh_type"] == 2:
                    now = datetime.now()
                    days_to_sunday = 7 - now.isoweekday()
                    end_of_week = datetime(now.year, now.month, now.day) + timedelta(days=days_to_sunday, hours=23, minutes=59, seconds=59)
                    info.refresh_time = end_of_week.timestamp()
                    
                info.progress = self.get_cond_progress_total(get_cond_config(task["complete_condition"]))
                self.__enter_task__(info, self.get_cond_progress(get_cond_config(task["accept_condition"])))

    def check_complete_task(self):
        tasks = self.taskes
        self.taskes = {}
        for id, task in tasks.items():
            tconf = get_task_config(task.task_id)
            if tconf == None:
                app().error(f"player:{self.user_id} task config not found, id={task.task_id}")
                continue
            if self.check_cond(get_cond_config(tconf["complete_condition"])):
                if tconf["complete_type"] == 2:
                    task.status = em_task_state.can_completed
                    if tconf["complete_talk"] in self.talk:
                        task.status = em_task_state.completed
                        self.bag_data.drop(task.task_id, tconf["task_reward"])
                        self.__complete_task__(task)
                elif tconf["complete_type"] == 1:
                    task.status = em_task_state.completed
                    self.bag_data.drop(task.task_id, tconf["task_reward"])
                    self.__complete_task__(task)
            self.taskes[id] = task
    
    def check_task(self):
        self.check_complete_task()
        self.refresh_task()
        self.check_accept_task()
        self.caller.task(
            [t for t in self.taskes.values() if t.status != em_task_state.completed],
            [p for p in self.progress.values()])
    

def task_create() -> task_data:
    return task_data({})