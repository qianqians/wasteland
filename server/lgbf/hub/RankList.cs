using Newtonsoft.Json;
using StackExchange.Redis;

namespace hub;

public record RankItem<T>
{
    public required string Member { get; init; }
    public required double Score { get; init; }
    public required long Rank { get; init; }
    public T? Data { get; init; }
}

public static class RankList
{
    public static async Task<bool> UpdateRankList<T>(string rankName, string member, double score, T? data = default)
    {
        if (Main.Redis == null)
        {
            throw new InvalidOperationException("redis is not initialized");
        }

        var rankKey = string.Format(RedisHelp.RankListKey, rankName);
        var dataKey = string.Format(RedisHelp.RankListDataKey, rankName);

        var updated = await Main.Redis.SortedSetAdd(rankKey, member, score);
        if (!updated && data is null)
        {
            return false;
        }

        if (data is not null)
        {
            var stored = await Main.Redis.HashSet(dataKey, member, JsonConvert.SerializeObject(data));
            return stored;
        }

        return updated;
    }

    public static async Task<RankItem<T>?> GetSelfRank<T>(string rankName, string member)
    {
        if (Main.Redis == null)
        {
            throw new InvalidOperationException("redis is not initialized");
        }

        var rankKey = string.Format(RedisHelp.RankListKey, rankName);
        var dataKey = string.Format(RedisHelp.RankListDataKey, rankName);

        var rank = await Main.Redis.SortedSetRank(rankKey, member, Order.Descending);
        if (!rank.HasValue)
        {
            return null;
        }

        var score = await Main.Redis.SortedSetScore(rankKey, member);
        if (!score.HasValue)
        {
            return null;
        }

        var rawData = await Main.Redis.HashGet(dataKey, member);
        return new RankItem<T>
        {
            Member = member,
            Score = score.Value,
            Rank = rank.Value + 1,
            Data = DeserializeData<T>(rawData)
        };
    }

    public static async Task<List<RankItem<T>>> GetRangeRank<T>(string rankName, long start, long end)
    {
        if (Main.Redis == null)
        {
            throw new InvalidOperationException("redis is not initialized");
        }

        if (start < 1)
        {
            start = 1;
        }

        if (end < start)
        {
            return [];
        }

        var rankKey = string.Format(RedisHelp.RankListKey, rankName);
        var dataKey = string.Format(RedisHelp.RankListDataKey, rankName);
        var stop = end - 1;

        var entries = await Main.Redis.SortedSetRangeByRankWithScores(rankKey, start - 1, stop, Order.Descending);
        if (entries.Length == 0)
        {
            return [];
        }

        var result = new List<RankItem<T>>(entries.Length);
        for (var i = 0; i < entries.Length; i++)
        {
            var entry = entries[i];
            var member = entry.Element.ToString();
            var rawData = await Main.Redis.HashGet(dataKey, member);
            result.Add(new RankItem<T>
            {
                Member = member,
                Score = entry.Score,
                Rank = start + i,
                Data = DeserializeData<T>(rawData)
            });
        }

        return result;
    }

    private static T? DeserializeData<T>(string? rawData)
    {
        if (string.IsNullOrEmpty(rawData))
        {
            return default;
        }

        return JsonConvert.DeserializeObject<T>(rawData);
    }
}
