from threading import Timer
from collections.abc import Callable
from enum import Enum
from .engine import *
from .engine.msgpack import *
from .common_svr import *

# this enum code is codegen by geese codegen for python

#this struct code is codegen by geese codegen for python
#this module code is codegen by geese codegen for python
class battle_use_skill_rsp(session):
    def __init__(self, gate_name:str, conn_id:str, msg_cb_id:int, entity:player|entity):
        session.__init__(self, gate_name)
        self.entity = entity
        self.conn_id = conn_id
        self.is_rsp = False
        self.msg_cb_id = msg_cb_id

    def rsp(self):
        if self.is_rsp:
            return
        self.is_rsp = True

        _argv_f54ecac1_af9c_3003_a2f2_ed93134bfdfe = []
        self.entity.call_client_response(self.source, self.conn_id, self.msg_cb_id, dumps(_argv_f54ecac1_af9c_3003_a2f2_ed93134bfdfe))

    def err(self, err:error_code):
        if self.is_rsp:
            return
        self.is_rsp = True

        _argv_f54ecac1_af9c_3003_a2f2_ed93134bfdfe = [self.uuid_871186aa_104b_36ee_939d_9b8b1285e974]
        _argv_f54ecac1_af9c_3003_a2f2_ed93134bfdfe.append(err)
        self.entity.call_client_response_error(self.source, self.conn_id, self.msg_cb_id, dumps(_argv_f54ecac1_af9c_3003_a2f2_ed93134bfdfe))

class battle_module(object):
    def __init__(self, entity:player|entity):
        self.entity = entity

        self.on_use_skill:list[Callable[[battle_use_skill_rsp, int], None]] = []
        self.entity.reg_client_request_callback("use_skill", self.use_skill)

    def use_skill(self, gate_name:str, conn_id:str, msg_cb_id:int, bin:bytes):
        inArray = loads(bin)
        _skill_id = inArray[0]
        rsp = battle_use_skill_rsp(gate_name, conn_id, msg_cb_id, self.entity)
        for fn in self.on_use_skill:
            fn(rsp, _skill_id)




