# -*- coding: UTF-8 -*-
from __future__ import annotations
from ..engine.player_ntf_client_svr import *
from ..engine.common_svr import *
from ..data.config import *

class bag_data:
    def __init__(self, user_id:str, info:dict, caller:player_ntf_client_caller):
        self.user_id = user_id
        
        self.bag:dict[int, item] = {}
        for grid, item in info.items():
            self.bag[grid] = protcol_to_item(item)
            
        self.caller = caller

    def info(self) -> dict:
        return { grid: item_to_protcol(item) for grid, item in self.bag.items() }
    
    def __drop_item__(self, item_id:int, count:int) -> item | None:
        if item_id <= 0 or count <= 0:
            return None
        
        item1 = item()
        item1.item_id = item_id
        item1.item_type = item_id
        item1.item_count = count
        
        for _, i in self.bag.items():
            if i.item_id == item_id:
                i.item_count += count
                return item1
        
        grid = len(self.bag)
        self.bag[grid] = item1
        
        return item1
    
    def drop(self, task_id:int, pkg_id:int):
        pkg = load_pkg_config(pkg_id)
        if pkg == None:
            self.error(f"bag drop pkg config not found, id={pkg_id}")
            return
        
        items:list[item] = []
        items.append(self.__drop_item__(pkg.item1_id, pkg.item1_num))
        items.append(self.__drop_item__(pkg.item2_id, pkg.item2_num))
        items.append(self.__drop_item__(pkg.item3_id, pkg.item3_num))
        items.append(self.__drop_item__(pkg.item4_id, pkg.item4_num))
        
        pkg_item:list[item] = [i for i in items if i != None]
        self.caller.drop(task_id, pkg_item, [i for i in self.bag.values() if i != None])

def bag_create() -> bag_data:
    return bag_data({})