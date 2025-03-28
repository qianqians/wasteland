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

class battle_use_item_rsp(session):
    def __init__(self, gate_name:str, conn_id:str, msg_cb_id:int, entity:player|entity):
        session.__init__(self, gate_name)
        self.entity = entity
        self.conn_id = conn_id
        self.is_rsp = False
        self.msg_cb_id = msg_cb_id

    def rsp(self, items:list[item]):
        if self.is_rsp:
            return
        self.is_rsp = True

        _argv_8e931b2d_2ecb_30da_928a_750ecb587c14 = []
        _list_345fb533_0c2c_3ec8_899f_fe985da7fd3a = []
        for v_bf5596fb_837a_5272_bf0d_cd29c7c99192 in items:
            _list_345fb533_0c2c_3ec8_899f_fe985da7fd3a.append(item_to_protcol(v_bf5596fb_837a_5272_bf0d_cd29c7c99192))
        _argv_8e931b2d_2ecb_30da_928a_750ecb587c14.append(_list_345fb533_0c2c_3ec8_899f_fe985da7fd3a)
        self.entity.call_client_response(self.source, self.conn_id, self.msg_cb_id, dumps(_argv_8e931b2d_2ecb_30da_928a_750ecb587c14))

    def err(self, err:error_code):
        if self.is_rsp:
            return
        self.is_rsp = True

        _argv_8e931b2d_2ecb_30da_928a_750ecb587c14 = [self.uuid_6a895a27_7c90_3d7f_b9f5_d47cbcbd1584]
        _argv_8e931b2d_2ecb_30da_928a_750ecb587c14.append(err)
        self.entity.call_client_response_error(self.source, self.conn_id, self.msg_cb_id, dumps(_argv_8e931b2d_2ecb_30da_928a_750ecb587c14))

class battle_module(object):
    def __init__(self, entity:player|entity):
        self.entity = entity

        self.on_use_skill:list[Callable[[battle_use_skill_rsp, int], None]] = []
        self.entity.reg_client_request_callback("use_skill", self.use_skill)
        self.on_use_item:list[Callable[[battle_use_item_rsp, str], None]] = []
        self.entity.reg_client_request_callback("use_item", self.use_item)

    def use_skill(self, gate_name:str, conn_id:str, msg_cb_id:int, bin:bytes):
        inArray = loads(bin)
        _skill_id = inArray[0]
        rsp = battle_use_skill_rsp(gate_name, conn_id, msg_cb_id, self.entity)
        for fn in self.on_use_skill:
            fn(rsp, _skill_id)

    def use_item(self, gate_name:str, conn_id:str, msg_cb_id:int, bin:bytes):
        inArray = loads(bin)
        _item_id = inArray[0]
        rsp = battle_use_item_rsp(gate_name, conn_id, msg_cb_id, self.entity)
        for fn in self.on_use_item:
            fn(rsp, _item_id)




