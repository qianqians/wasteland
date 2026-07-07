using MongoDB.Bson;
namespace hub;

public interface IHostingData
{
    public static virtual string Type()
    {
        return string.Empty;
    }

    public static virtual IHostingData? Create()
    {
        return null;
    }

    public static virtual IHostingData? Load(BsonDocument data)
    {
        return null;
    }

    public BsonDocument Store();
}

public interface IDataAgent<T> where T : IHostingData
{
    public T Data { get; }

    public Task WriteBack();
}

public class DirtyData
{
    public required string Type;
    public required string Guid;
}

internal class DataAgent<T> : IDataAgent<T> where T : IHostingData
{
    private readonly Entity _entity;
    private readonly string _storeKey;
    private readonly string _dirtyFlagKey;

    internal DataAgent(Entity entity)
    {
        _entity = entity;
        _storeKey = string.Format(RedisHelp.EntityStoreKey, T.Type(), _entity.Ctx.Guid);
        _dirtyFlagKey = string.Format(RedisHelp.EntityTickFlagKey, T.Type(), _entity.Ctx.Guid);
    }

    public required T Data { get; init; }
    
    public Task WriteBack()
    {
        var bson = Data.Store().ToBson();
        return WriteBackAsync(bson);
    }

    private async Task WriteBackAsync(byte[] bson)
    {
        try
        {
            var redis = _entity.Ctx.Redis!;
            var setOk = await redis.SetData(_storeKey, bson);
            if (!setOk)
            {
                throw new InvalidOperationException($"entity write back failed: redis set failed for {_storeKey}");
            }

            var firstDirty = await redis.SetDataIfNotExists(_dirtyFlagKey, 1, 10 * 60 * 1000);
            if (!firstDirty)
            {
                return;
            }

            var pushLen = await redis.PushList(RedisHelp.EntityStoreMongodbList, new DirtyData()
            {
                Type = T.Type(),
                Guid = _entity.Ctx.Guid
            });
            if (pushLen <= 0)
            {
                throw new InvalidOperationException(
                    $"entity write back failed: dirty queue push failed for {_entity.Ctx.Guid}");
            }
        }
        catch (Exception ex)
        {
            Log.Err("entity write back failed: {0}", ex);
            throw;
        }
    }
}

public record Entity(Context Ctx)
{
    private DataAgent<T> CreateAgent<T>(T data) where T : IHostingData
    {
        return new DataAgent<T>(this)
        {
            Data = data
        };
    }

    public async Task<IDataAgent<T>?> Get<T>() where T : IHostingData
    {
        var storeKey = string.Format(RedisHelp.EntityStoreKey, T.Type(), Ctx.Guid);
        var bin = await Ctx.Redis!.GetData(storeKey);
        if (bin is { Length: > 0 })
        {
            var doc = MongoDB.Bson.Serialization.BsonSerializer.Deserialize<BsonDocument>(bin);
            var data = T.Load(doc);
            if (data != null)
            {
                return CreateAgent((T)data);
            }
        }

        var query = new DBQueryHelper();
        query.Condition("Guid", Ctx.Guid);
        var doc1 = await Ctx.Mongo!.Find(
            "game", T.Type(), query.query().ToBson(),
            0, 0, "", false);
        if (doc1 == null || doc1.Count == 0)
        {
            return null;
        }
        var data1 = T.Load(doc1[0].AsBsonDocument);
        if (data1 != null)
        {
            await Ctx.Redis.SetData(storeKey, data1.Store().ToBson());
            return CreateAgent((T)data1);
        }
        
        return null;
    }

    public async Task<IDataAgent<T>> GetOrCreate<T>() where T : IHostingData
    {
        var agent = await Get<T>();
        if (agent != null)
        {
            return agent;
        }

        var created = T.Create();
        if (created is not T data)
        {
            throw new InvalidOperationException($"{typeof(T).Name} does not provide a valid Create implementation");
        }

        return CreateAgent(data);
    }
}
