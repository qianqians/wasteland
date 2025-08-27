from threading import Timer
from collections.abc import Callable
from enum import Enum
from .engine import *
from .engine.msgpack import *
from .common_svr import *

# this enum code is codegen by geese codegen for python

#this struct code is codegen by geese codegen for python
#this module code is codegen by geese codegen for python
class player_module(object):
    def __init__(self, entity:player|entity):
        self.entity = entity

        self.on_completed_task:list[Callable[[session, int], None]] = []
        self.entity.reg_client_notify_callback("completed_task", self.completed_task)

    def completed_task(self, gate_name:str, bin:bytes):
        inArray = loads(bin)
        _task_id = inArray[0]
        s = session(gate_name)
        for fn in self.on_completed_task:
            fn(s, _task_id)




