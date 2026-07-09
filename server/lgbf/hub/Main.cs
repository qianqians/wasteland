using MongoDB.Bson;
namespace hub;

public class Config
{
    public required string Host = string.Empty;
    public required int Port = 0;
    public required string RedisUrl = string.Empty;
    public required string RedisPwd = string.Empty;
    public required string MongoUrl = string.Empty;
    public required string LogLevel = string.Empty;
    public required string LogFile = string.Empty;
    public required string LogDir = string.Empty;
}

public class Main
{
    private const int SaveIntervalMs = 5 * 60 * 1000;
    private const int SaveBatchSize = 64;

    public static RedisHandle? Redis
    {
        get; private set;
    }

    public static MongodbProxy? Mongo
    {
        get; private set;
    }

    private static HttpService? _service;
    private static int _saveRunning;

    private static void InitLog(Config cfg)
    {
        if (cfg.LogLevel == "trace")
        {
            Log.logMode = Log.EnLogMode.Trace;
        }
        else if (cfg.LogLevel == "debug")
        {
            Log.logMode = Log.EnLogMode.Debug;
        }
        else if (cfg.LogLevel == "info")
        {
            Log.logMode = Log.EnLogMode.Info;
        }
        else if (cfg.LogLevel == "warn")
        {
            Log.logMode = Log.EnLogMode.Warn;
        }
        else if (cfg.LogLevel == "err")
        {
            Log.logMode = Log.EnLogMode.Err;
        }
        var log_file = cfg.LogFile;
        Log.logFile = log_file;
        var log_dir = cfg.LogDir;
        Log.logPath = log_dir;
        {
            if (!System.IO.Directory.Exists(log_dir))
            {
                System.IO.Directory.CreateDirectory(log_dir);
            }
        }
    }

    public static void Start(Config cfg)
    {
        Redis = new RedisHandle(cfg.RedisUrl, cfg.RedisPwd);
        Mongo = new MongodbProxy(cfg.MongoUrl);
        
        TimerService.Ins!.AddTickTime(SaveIntervalMs, Save);

        InitLog(cfg);

        _service = new HttpService(cfg.Host, cfg.Port);
        _service.Run();
    }

    public static async Task WaitClose()
    {
        if (_service != null)
        {
            await _service.Close();
        }
    }

    private static async void Save(long _)
    {
        try
        {
            await SaveAsync();
        }
        catch (Exception ex)
        {
            Log.Err("Save entity error:{0}", ex);
        }
    }

    private static async Task SaveAsync()
    {
        if (Interlocked.Exchange(ref _saveRunning, 1) != 0)
        {
            return;
        }

        try
        {
            if (Redis == null)
            {
                throw new Exception("internal error! redis is nil");
            }

            if (Mongo == null)
            {
                throw new Exception("internal error! mongo is nil");
            }

            var dirtyItems = new List<(DirtyData Dirty, byte[] Data, string StoreKey, string DirtyFlagKey)>(SaveBatchSize);
            for (var i = 0; i < SaveBatchSize; i++)
            {
                var data = await Redis.PopList<DirtyData>(RedisHelp.EntityStoreMongodbList);
                if (data == null)
                {
                    break;
                }

                var storeKey = string.Format(RedisHelp.EntityStoreKey, data.Type, data.Guid);
                var dirtyFlagKey = string.Format(RedisHelp.EntityTickFlagKey, data.Type, data.Guid);

                var data1 = await Redis.GetData(storeKey);
                if (data1 == null)
                {
                    Redis.DelData(dirtyFlagKey);
                    continue;
                }

                dirtyItems.Add((data, data1, storeKey, dirtyFlagKey));
            }

            foreach (var batch in dirtyItems.GroupBy(item => item.Dirty.Type))
            {
                var latestItems = new Dictionary<string, (DirtyData Dirty, byte[] Data, string StoreKey, string DirtyFlagKey)>();
                foreach (var item in batch)
                {
                    latestItems[item.Dirty.Guid] = item;
                }

                var updateItems = new List<BatchUpdateItem>(latestItems.Count);
                foreach (var item in latestItems.Values)
                {
                    var query = new DBQueryHelper();
                    query.Condition("Guid", item.Dirty.Guid);
                    var update = new UpdateDataHelper();
                    update.Set(MongoDB.Bson.Serialization.BsonSerializer.Deserialize<BsonDocument>(item.Data));
                    updateItems.Add(new BatchUpdateItem
                    {
                        Query = query.query().ToBson(),
                        Update = update.Data().ToBson()
                    });
                }

                var result = await Mongo.BulkUpdate("game", batch.Key, updateItems, true);
                if (!result)
                {
                    Log.Err("Save mongodb error");
                    foreach (var item in latestItems.Values)
                    {
                        await Redis.PushList(RedisHelp.EntityStoreMongodbList, item.Dirty);
                    }
                    continue;
                }

                foreach (var item in latestItems.Values)
                {
                    Redis.DelData(item.DirtyFlagKey);
                    var latestData = await Redis.GetData(item.StoreKey);
                    if (latestData != null && !latestData.SequenceEqual(item.Data))
                    {
                        await Redis.SetData(item.DirtyFlagKey, 1, 10 * 60 * 1000);
                        await Redis.PushList(RedisHelp.EntityStoreMongodbList, item.Dirty);
                    }
                }
            }
        }
        catch (Exception ex)
        {
            Log.Err("SaveAsync:{0}", ex);
        }
        finally
        {
            Volatile.Write(ref _saveRunning, 0);
            TimerService.Ins!.AddTickTime(SaveIntervalMs, Save);
        }
    }
}
