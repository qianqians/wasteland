from threading import Timer
from collections.abc import Callable
from enum import Enum
from .engine import *
from .engine.msgpack import *
from .common_svr import *

# this enum code is codegen by geese codegen for python

#this struct code is codegen by geese codegen for python
#this caller code is codegen by geese codegen for python
class player_ntf_client_caller(object):
    def __init__(self, entity:player):
        self.entity = entity

    def drop(self, task_id:int, pkg_item:list[item], total_item:list[item]):
        _argv_eb03ad59_660a_30d5_8232_5fb4f9c07d3f = []
        _argv_eb03ad59_660a_30d5_8232_5fb4f9c07d3f.append(task_id)
        _list_41373670_f5d5_318d_b7f7_c3a4f5036023 = []
        for v_5441b1b9_4592_5e1c_94ba_124d9c6a6f94 in pkg_item:
            _list_41373670_f5d5_318d_b7f7_c3a4f5036023.append(item_to_protcol(v_5441b1b9_4592_5e1c_94ba_124d9c6a6f94))
        _argv_eb03ad59_660a_30d5_8232_5fb4f9c07d3f.append(_list_41373670_f5d5_318d_b7f7_c3a4f5036023)
        _list_08bdea7a_087c_3a03_a2ce_2b98ccf14532 = []
        for v_e22d0078_3b03_5fe2_a310_c3f6c3c23740 in total_item:
            _list_08bdea7a_087c_3a03_a2ce_2b98ccf14532.append(item_to_protcol(v_e22d0078_3b03_5fe2_a310_c3f6c3c23740))
        _argv_eb03ad59_660a_30d5_8232_5fb4f9c07d3f.append(_list_08bdea7a_087c_3a03_a2ce_2b98ccf14532)
        self.entity.call_client_main_notify("drop", dumps(_argv_eb03ad59_660a_30d5_8232_5fb4f9c07d3f))



