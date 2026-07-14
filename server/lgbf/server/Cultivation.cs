using hub;
using MongoDB.Bson;

namespace wasteland
{
    public class CultivationSkill
    {
        public List<uint> ActiveSkills = [];
        public List<uint> PassiveSkills = [];
    }

    public class Cultivation
    {
        public string CultivationID = string.Empty;
        public uint CultivationTableID = 0;
        public ERarity Rarity = ERarity.None;
        public ulong XP = 0;
        public string Description = string.Empty;
        public CultivationSkill Skills = new();
        public Dictionary<string, uint> Attributes = new();
    }

    public class CultivationSystem : IHostingData
    {
        public List<Cultivation> LearnCultivations = [];
        public Cultivation? CurrCultivation = null;

        public static string Type()
        {
            return "CultivationSystem";
        }

        public static IHostingData? Create()
        {
            return new CultivationSystem();
        }

        public static IHostingData? Load(BsonDocument data)
        {
            var d = Create() as CultivationSystem;
            foreach (var item in data.GetValue("LearnCultivations").AsBsonArray)
            {
                d!.LearnCultivations.Add(MongoDB.Bson.Serialization.BsonSerializer.Deserialize<Cultivation>(item.AsBsonDocument));
            }
            d!.CurrCultivation = data.GetValue("CurrCultivation").IsBsonNull ? null : MongoDB.Bson.Serialization.BsonSerializer.Deserialize<Cultivation>(data.GetValue("Cultivation").AsBsonDocument);
            return d;
        }

        public BsonDocument Store()
        {
            var cultivationList = new BsonArray();
            foreach (var bb in LearnCultivations)
            {
                cultivationList.Add(bb.ToBsonDocument());
            }
            var currCultivationDoc = CurrCultivation?.ToBsonDocument() ?? BsonNull.Value.AsBsonDocument;
            return new BsonDocument
            {
                { "LearnCultivations", cultivationList },
                { "CurrCultivation", currCultivationDoc},
            };
        }
    }
}