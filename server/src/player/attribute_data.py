
class AttributeData:
    def __init__(self, data:dict):
        self.hp = data["hp"]
        self.mp = data["mp"]
        self.max_hp = data["max_hp"]
        self.max_mp = data["max_mp"]
        self.defense = data["defense"]

    def info(self) -> dict:
        return {
            "hp": self.hp,
            "mp": self.mp,
            "max_hp": self.max_hp,
            "max_mp": self.max_mp,
            "defense": self.defense,
        }
    
    def create():
        return AttributeData({
            "hp": 100,
            "mp": 100,
            "max_hp": 100,
            "max_mp": 100,
            "defense": 10,
        })