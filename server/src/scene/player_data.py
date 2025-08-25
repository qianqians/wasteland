# -*- coding: UTF-8 -*-
from ..engine.engine import *
from ..data.attribute_data import *
from ..data.equip_data import *
from ..data.scene_data import *
from ..data.bag_data import *
from ..data.task_data import *
from ..data.config import *
from .scene import *


@SaveDBDescribe("wasteland", "player_data")
class player_data(save, player):
    def __init__(self, player_gate_name:str, player_conn_id:str, player_id:str, info:dict):
        save.__init__(self)
        player.__init__(self, "scene_service", "player_data", player_id, player_gate_name, player_conn_id, False)

        self.player_id = player_id
            
        self.account_id = info["account_id"]
        self.player_nick_name = info["player_nick_name"]
        self.gender = info["gender"]

        self.attribute_data = attribute_data(info["attribute_data"])
        self.task_data = task_data(info["task_data"])
        self.bag_data = bag_data(info["bag_data"])
        
        self.equip_data = equip_data(info["equip_data"])
        self.scene_data = scene_data(info["scene_data"])

    def full_info(self) -> dict:
        return self.store()
    
    def hub_info(self) -> dict:
        return self.store()

    def client_info(self) -> dict:
        return self.store()
    
    def __check_cond_value__(self, cond: int, value: int) -> bool:
        if cond == 1:
            pass

    def check_cond(self, cond: cond_config) -> bool:
        return self.__check_cond_value__(cond.condition1, cond.condition1_value) and \
               self.__check_cond_value__(cond.condition2, cond.condition2_value) and \
               self.__check_cond_value__(cond.condition3, cond.condition3_value) and \
               self.__check_cond_value__(cond.condition4, cond.condition4_value)

    def get_cond_progress(self, cond: cond_config) -> list[task_progress_info]:
        return []

    def check_task(self):
        self.task_data.refresh_task()

        task_list = load_task_config()
        for task in task_list:
            if self.check_cond(task.accept_condition):
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
                info.progress = self.get_cond_progress(task.complete_condition)
                self.task_data.enter_task(info)
    
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

        return { 
            "player_id":str(uuid.uuid4()),
            "attribute_data": _attribute_data.info(), 
            "bag_data": _bag_data.info(),
            "task_data": _task_data.info(),
        }