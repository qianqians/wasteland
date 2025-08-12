# -*- coding: UTF-8 -*-
from ..engine.engine import *
from ..data.attribute_data import *
from ..data.equip_data import *
from ..data.scene_data import *
from ..data.bag_data import *
from ..data.task_data import *
from .scene import *

@SaveDBDescribe("wasteland", "player_data")
class player_data(save, player):
    def __init__(self, player_gate_name:str, player_conn_id:str, player_id:str, info:dict):
        save.__init__(self)
        player.__init__(self, "scene_service", "player_data", player_id, player_gate_name, player_conn_id, False)

        self.player_id = player_id
            
        self.account_id = info["account_id"]
        self.player_nick_name = info["player_nick_name"]
        self.player_appearance = info["player_appearance"]
        self.gender = info["gender"]

        self.attribute_data = attribute_data(info["attribute_data"])
        self.equip_data = equip_data(info["equip_data"])
        self.scene_data = scene_data(info["scene_data"])
        self.task_data = equip_data(info["task_data"])
        self.bag_data = scene_data(info["bag_data"])

    def full_info(self) -> dict:
        return self.store()
    
    def hub_info(self) -> dict:
        return self.store()

    def client_info(self) -> dict:
        return self.store()
    
    @abstractmethod
    def store(self) -> dict:
        return { 
            "player_id": self.player_id, 
            "account_id": self.account_id,
            "player_nick_name": self.player_nick_name,
            "player_appearance": self.player_appearance,
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
        _attribute_data = attribute_data.create()
        _bag_data = bag_data.create()
        _task_data = task_data.create()

        return { 
            "player_id":str(uuid.uuid4()),
            "attribute_data": _attribute_data.info(), 
            "bag_data": _bag_data.info(),
            "task_data": _task_data.info(),
        }