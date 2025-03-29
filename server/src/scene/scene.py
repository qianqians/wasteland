from ..engine.engine import *

class scene:
    def __init__(self, scene_name:str, scene_line:int):
        self.scene_name = scene_name
        self.scene_line = scene_line
        
        self.group = group()

    def entry_scene(self, player:player):
        self.group.add_entity(player)