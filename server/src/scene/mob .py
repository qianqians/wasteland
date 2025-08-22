# -*- coding: UTF-8 -*-
from ..engine.engine import *
from .scene import scene

class mob(entity):
    def __init__(self, service_name, entity_id):
        super().__init__(service_name, "mob", entity_id, False)
        
    def update(self, _scene:scene):
        pass