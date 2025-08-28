# -*- coding: UTF-8 -*-
from __future__ import annotations
from ..engine.engine import *
from .scene import scene

class monster(entity):
    def __init__(self, service_name, entity_id):
        super().__init__(service_name, "monster", entity_id, False)
        
    def update(self, _scene:scene):
        pass