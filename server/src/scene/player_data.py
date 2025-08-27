# -*- coding: UTF-8 -*-
from ..engine.engine import *
from ..engine.player_ntf_client_svr import *
from ..engine.player_svr import *
from ..engine.common_svr import *
from ..data.attribute_data import *
from ..data.equip_data import *
from ..data.scene_data import *
from ..data.bag_data import *
from ..data.task_data import *
from ..data.skill_data import *
from ..data.config import *
from .scene import *


@SaveDBDescribe("wasteland", "player_data")
class player_data(save, player):
    def __init__(self, player_gate_name:str, player_conn_id:str, player_id:str, info:dict):
        save.__init__(self)
        player.__init__(self, "scene_service", "player_data", player_id, player_gate_name, player_conn_id, False)

        self.player_id = player_id

        self.caller = player_ntf_client_caller(self)
        self.player_module = player_module(self)
        self.player_module.on_completed_task.append(lambda s, task_id: self.on_complete_task(s, task_id))

        self.account_id = info["account_id"]
        self.player_nick_name = info["player_nick_name"]
        self.gender = info["gender"]

        self.attribute_data = attribute_data(info["attribute_data"])
        self.task_data = task_data(info["task_data"])
        self.bag_data = bag_data(info["bag_data"], self.caller)
        self.skill_data = skill_data(info["skill_data"])
        
        self.equip_data = equip_data(info["equip_data"])
        self.scene_data = scene_data(info["scene_data"])

    def full_info(self) -> dict:
        return self.store()
    
    def hub_info(self) -> dict:
        return self.store()

    def client_info(self) -> dict:
        return self.store()
    
    def __check_cond_value__(self, cond: int, cond_type: int, value: int) -> bool:
        if cond == 1:
            return self.skill_data.has_learned_skill()
        if cond == 2:
            progress = self.task_data.get_progress(cond_type)
            return progress >= value
        return False

    def check_cond(self, cond: cond_config) -> bool:
        return self.__check_cond_value__(cond.condition1, cond.condition1_type, cond.condition1_value) and \
               self.__check_cond_value__(cond.condition2, cond.condition2_type, cond.condition2_value) and \
               self.__check_cond_value__(cond.condition3, cond.condition3_type, cond.condition3_value) and \
               self.__check_cond_value__(cond.condition4, cond.condition4_type, cond.condition4_value)

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
            cond.condition1, cond.condition1_type, cond.condition1_value))
        task_progress_info_list.append(self.__get_cond_progress__(
            cond.condition2, cond.condition2_type, cond.condition2_value))
        task_progress_info_list.append(self.__get_cond_progress__(
            cond.condition3, cond.condition3_type, cond.condition3_value))
        task_progress_info_list.append(self.__get_cond_progress__(
            cond.condition4, cond.condition4_type, cond.condition4_value))
        return task_progress_info_list
    
    def get_cond_progress_total(self, cond: cond_config) -> list[task_progress_info]:
        task_progress_total_list = []
        task_progress_total_list.append(self.__get_cond_progress_total__(
            cond.condition1, cond.condition1_type, cond.condition1_value))
        task_progress_total_list.append(self.__get_cond_progress_total__(
            cond.condition2, cond.condition2_type, cond.condition2_value))
        task_progress_total_list.append(self.__get_cond_progress_total__(
            cond.condition3, cond.condition3_type, cond.condition3_value))
        task_progress_total_list.append(self.__get_cond_progress_total__(
            cond.condition4, cond.condition4_type, cond.condition4_value))
        return task_progress_total_list

    def check_accept_task(self):
        task_list = load_task_config()
        for task in task_list:
            if self.check_cond(load_cond_config(task.accept_condition)):
                info = task_info()
                info.task_id = task["id"]
                
                if task.accept_type == 1:
                    info.status = em_task_state.in_progress
                elif task.accept_type == 2:
                    info.status = em_task_state.can_claimed
                    
                if task.refresh_type == 1:
                    now = datetime.now()
                    end_of_day = datetime(now.year, now.month, now.day, 23, 59, 59)
                    info.refresh_time = end_of_day.timestamp()
                elif task.refresh_type == 2:
                    now = datetime.now()
                    days_to_sunday = 7 - now.isoweekday()
                    end_of_week = datetime(now.year, now.month, now.day) + timedelta(days=days_to_sunday, hours=23, minutes=59, seconds=59)
                    info.refresh_time = end_of_week.timestamp()
                    
                info.progress = self.get_cond_progress_total(load_cond_config(task.complete_condition))
                self.task_data.enter_task(info, self.get_cond_progress(load_cond_config(task.accept_condition)))

    def check_complete_task(self):
        tasks = self.task_data.taskes
        self.task_data.taskes = {}
        for id, task in tasks.items():
            tconf = get_task_config(task.task_id)
            if tconf == None:
                self.error(f"task config not found, id={task.task_id}")
                continue
            if self.check_cond(load_cond_config(tconf.complete_condition)):
                if tconf.complete_type == 2:
                    task.status = em_task_state.can_completed
                elif tconf.complete_type == 1:
                    task.status = em_task_state.completed
                    self.bag_data.drop(task.task_id, tconf.task_reward)
                    self.task_data.complete_task(task)
            self.task_data.taskes[id] = task

    def on_complete_task(self, s: session, task_id: int):
        app().trace(f"on_complete_task:{task_id}")
        self.check_task()

        task_info = self.task_data.taskes[task_id]
        if task_info == None:
            app().error(f"task_info not found, task={task_id}")
            return
        if task_info.status != em_task_state.can_completed:
            app().error(f"task_info status error, task={task_id}, status={task_info.status}")
            return
        
        task_info.status = em_task_state.completed
        tconf = get_task_config(task_id)
        if tconf == None:
            app().error(f"task config not found, id={task_id}")
            return
        
        self.bag_data.drop(task_info.task_id, tconf.task_reward)
        self.task_data.complete_task(task_info)

    def check_task(self):
        self.check_complete_task()
        self.task_data.refresh_task()
        self.check_accept_task()
        self.caller.task([t for t in self.task_data.taskes.values()], [p for p in self.task_data.progress.values()])
    
    @abstractmethod
    def store(self) -> dict:
        return { 
            "player_id": self.player_id, 
            "account_id": self.account_id,
            "player_nick_name": self.player_nick_name,
            "gender": self.gender,
            "attribute_data": self.attribute_data.info(),
            "equip_data": self.equip_data.info(), 
            "scene_data": self.scene_data.info(),
            "task_data": self.task_data.info(), 
            "bag_data": self.bag_data.info(),
        }
    
    @staticmethod
    @abstractmethod
    def create() -> dict:
        _attribute_data = attribute_create()
        _bag_data = bag_create()
        _task_data = task_create()
        _skill_date = skill_create()

        return { 
            "player_id":str(uuid.uuid4()),
            "attribute_data": _attribute_data.info(), 
            "bag_data": _bag_data.info(),
            "task_data": _task_data.info(),
            "skill_date": _skill_date.info(),
        }