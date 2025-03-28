from ..engine.common_svr import *

class scene_data:
    def __init__(self, info:dict):
        self.write_back(info)

    def write_back(self, info:dict):
        self.scene_name = info["scene_name"]
        self.scene_line = info["scene_line"]
        self.postion = protcol_to_position(info["postion"])

    def info(self) -> dict:
        return { "scene_name": self.scene_name, "scene_line": self.scene_line, "postion": position_to_protcol(self.postion) }