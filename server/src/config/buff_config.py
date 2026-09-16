# -*- coding: UTF-8 -*-
from __future__ import annotations
from ..engine.common_svr import *
from ..scene.battle_impl.buff_data import *

def CreateBuffer(type:em_buff_type, value:float, ratio: float, r:int) -> buffer:
    b = buffer()
    b['type'] = type
    b['value'] = value
    b['ratio'] = ratio
    b['rounds'] = r
    return b

NoneBuffer = 0

BufferDefend = 1
Defend = CreateBuffer(em_buff_type.em_defense_ratio, 1.5, 0)

Buffers:dict[int, buffer] = {
    NoneBuffer: None,
    BufferDefend: Defend,
}