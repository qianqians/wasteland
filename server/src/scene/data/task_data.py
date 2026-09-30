# -*- coding: UTF-8 -*-
from __future__ import annotations
from datetime import datetime, timedelta
import time
from ...engine.common_svr import *
from ...engine.player_svr import *
from ...engine.player_ntf_client_svr import *
from .bag_data import *
from ..player_data import *

def is_cross_day_simple(timestamp):
    date1 = datetime.fromtimestamp(timestamp).date()
    date2 = datetime.now().date()
    
    return date1 != date2

class task_data:
    def __init__(self, user_id:str, info:dict):
        self.user_id = user_id

    def info(self) -> dict:
        return {}