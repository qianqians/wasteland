# -*- coding: UTF-8 -*-

class base_dbproxy_handle(object):
    def __init__(self):
        self.__dbproxy__ = None
        self.__random_new_dbproxy__()

    def __random_new_dbproxy__(self):
        from .app import app
        app().trace("base_dbproxy_handle.__random_new_dbproxy__ dbproxy_mgr.get_dbproxy!")
        self.__dbproxy__ = app().dbproxy_mgr.get_dbproxy()
        app().trace("base_dbproxy_handle.__random_new_dbproxy__!")
        
    def __get_dbproxy__(self):
        if not self.__dbproxy__:
            self.__random_new_dbproxy__()
        return self.__dbproxy__