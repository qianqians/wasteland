from threading import Timer
from collections.abc import Callable
from enum import Enum
from .engine import *
from .engine.msgpack import *
from .common_svr import *

# this enum code is codegen by geese codegen for python

#this struct code is codegen by geese codegen for python
#this caller code is codegen by geese codegen for python
class battle_ntf_client_caller(object):
    def __init__(self, entity:player|entity):
        self.entity = entity

    def use_skill(self, skill_id:int, pos:position):
        _argv_f54ecac1_af9c_3003_a2f2_ed93134bfdfe = []
        _argv_f54ecac1_af9c_3003_a2f2_ed93134bfdfe.append(skill_id)
        _argv_f54ecac1_af9c_3003_a2f2_ed93134bfdfe.append(position_to_protcol(pos))
        self.entity.call_client_mutilcast("use_skill", dumps(_argv_f54ecac1_af9c_3003_a2f2_ed93134bfdfe))

    def harm(self, attack_entity_id:str, skill_id:int, pos:position, harm_type:em_harm_type, harm_value:int):
        _argv_7e9b4bc8_3331_36e9_9f2e_511457f22912 = []
        _argv_7e9b4bc8_3331_36e9_9f2e_511457f22912.append(attack_entity_id)
        _argv_7e9b4bc8_3331_36e9_9f2e_511457f22912.append(skill_id)
        _argv_7e9b4bc8_3331_36e9_9f2e_511457f22912.append(position_to_protcol(pos))
        _argv_7e9b4bc8_3331_36e9_9f2e_511457f22912.append(harm_type)
        _argv_7e9b4bc8_3331_36e9_9f2e_511457f22912.append(harm_value)
        self.entity.call_client_mutilcast("harm", dumps(_argv_7e9b4bc8_3331_36e9_9f2e_511457f22912))

    def dead(self):
        _argv_ae3baee5_fff4_35d0_8878_58a95b76200d = []
        self.entity.call_client_mutilcast("dead", dumps(_argv_ae3baee5_fff4_35d0_8878_58a95b76200d))



