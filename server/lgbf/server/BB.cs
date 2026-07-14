using hub;
using MongoDB.Bson;

namespace wasteland
{
    public class BB
    {
        public string BBID = string.Empty;
        public uint BBTableID = 0;
        public ERarity Rarity = ERarity.None;
        public float Growth = 0.0f;
        public List<uint> Skills = [];
        public Dictionary<string, uint> Attributes = new();
    }

    public class BBSystem : IHostingData
    {
        public List<BB> BBs = [];
        public BB? BattleBB = null;

        public static string Type()
        {
            return "BBSystem";
        }

        public static IHostingData? Create()
        {
            return new BBSystem();
        }

        public static IHostingData? Load(BsonDocument data)
        {
            var d = Create() as BBSystem;
            foreach (var item in data.GetValue("BBs").AsBsonArray)
            {
                d!.BBs.Add(MongoDB.Bson.Serialization.BsonSerializer.Deserialize<BB>(item.AsBsonDocument));
            }
            d!.BattleBB = data.GetValue("BattleBB").IsBsonNull ? null : MongoDB.Bson.Serialization.BsonSerializer.Deserialize<BB>(data.GetValue("BattleBB").AsBsonDocument);
            return d;
        }

        public BsonDocument Store()
        {
            var bbList = new BsonArray();
            foreach (var bb in BBs)
            {
                bbList.Add(bb.ToBsonDocument());
            }
            var battleBBDoc = BattleBB?.ToBsonDocument() ?? BsonNull.Value.AsBsonDocument;
            return new BsonDocument
            {
                { "BBs", bbList },
                { "BattleBB", battleBBDoc},
            };
        }
    }
}