from threading import Timer
from collections.abc import Callable
from enum import Enum
from .engine import *
from .engine.msgpack import *
from .common_svr import *

# this enum code is codegen by geese codegen for python

#this struct code is codegen by geese codegen for python
#this module code is codegen by geese codegen for python
class task_get_task_list_rsp(session):
    def __init__(self, gate_name:str, conn_id:str, msg_cb_id:int, entity:player|entity):
        session.__init__(self, gate_name)
        self.entity = entity
        self.conn_id = conn_id
        self.is_rsp = False
        self.msg_cb_id = msg_cb_id

    def rsp(self, tasks:list[task_info]):
        if self.is_rsp:
            return
        self.is_rsp = True

        _argv_c39e0b8b_cdb0_31c9_a8cb_c48f200c387a = []
        _list_ff486e7f_b5aa_3a8b_9d23_28dd187f4870 = []
        for v_9b78b6ab_a6db_5ec0_a23e_7f18c1d576b5 in tasks:
            _list_ff486e7f_b5aa_3a8b_9d23_28dd187f4870.append(task_info_to_protcol(v_9b78b6ab_a6db_5ec0_a23e_7f18c1d576b5))
        _argv_c39e0b8b_cdb0_31c9_a8cb_c48f200c387a.append(_list_ff486e7f_b5aa_3a8b_9d23_28dd187f4870)
        self.entity.call_client_response(self.source, self.conn_id, self.msg_cb_id, dumps(_argv_c39e0b8b_cdb0_31c9_a8cb_c48f200c387a))

    def err(self, ):
        if self.is_rsp:
            return
        self.is_rsp = True

        _argv_c39e0b8b_cdb0_31c9_a8cb_c48f200c387a = [self.uuid_ae7ec252_967c_3105_929b_046e24ba4748]
        self.entity.call_client_response_error(self.source, self.conn_id, self.msg_cb_id, dumps(_argv_c39e0b8b_cdb0_31c9_a8cb_c48f200c387a))

class task_module(object):
    def __init__(self, entity:player|entity):
        self.entity = entity

        self.on_get_task_list:list[Callable[[task_get_task_list_rsp, ], None]] = []
        self.entity.reg_client_request_callback("get_task_list", self.get_task_list)

    def get_task_list(self, gate_name:str, conn_id:str, msg_cb_id:int, bin:bytes):
        inArray = loads(bin)
        rsp = task_get_task_list_rsp(gate_name, conn_id, msg_cb_id, self.entity)
        for fn in self.on_get_task_list:
            fn(rsp, )




