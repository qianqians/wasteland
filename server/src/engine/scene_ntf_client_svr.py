from threading import Timer
from collections.abc import Callable
from enum import Enum
from .engine import *
from .engine.msgpack import *
from .common_svr import *

# this enum code is codegen by geese codegen for python

#this struct code is codegen by geese codegen for python
#this caller code is codegen by geese codegen for python
class scene_ntf_client_caller(object):
    def __init__(self, entity:player|entity):
        self.entity = entity

    def move(self, dir:direction, pos:position):
        _argv_33efb72e_9227_32af_a058_169be114a277 = []
        _argv_33efb72e_9227_32af_a058_169be114a277.append(dir)
        _argv_33efb72e_9227_32af_a058_169be114a277.append(position_to_protcol(pos))
        self.entity.call_client_mutilcast("move", dumps(_argv_33efb72e_9227_32af_a058_169be114a277))

    def mob_refresh(self, info:bytes):
        _argv_ddf021d9_5f38_3a51_a76b_7f975f360c87 = []
        _argv_ddf021d9_5f38_3a51_a76b_7f975f360c87.append(info)
        self.entity.call_client_mutilcast("mob_refresh", dumps(_argv_ddf021d9_5f38_3a51_a76b_7f975f360c87))



