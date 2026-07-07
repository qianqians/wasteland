using Google.Protobuf;
using MongoDB.Bson;
using MongoDB.Bson.Serialization;
using Newtonsoft.Json;
using StackExchange.Redis;
using System;
using System.Text;
using System.Threading;
using System.Threading.Tasks;

namespace hub;

public class RedisHandle
{
    private const int RecoverRetryDelayMs = 8;
    private ConnectionMultiplexer? _connectionMultiplexer;
    private IDatabase? _database;
    private ISubscriber? _subscriber;
    private readonly RedisConnectionHelper _connHelper;

    public RedisHandle(string connUrl, string pwd)
    {
        _connHelper = new RedisConnectionHelper(connUrl, "RedisForCache", pwd);
        _connHelper.ConnectOnStartup(ref _connectionMultiplexer, ref _database, ref _subscriber);
    }

    private void Recover(System.Exception e)
    {
        if (_connectionMultiplexer == null || _database == null)
        {
            return;
        }
        _connHelper.Recover(ref _connectionMultiplexer, ref _database, ref _subscriber, e);
    }

    public Task<bool> Expire(string key, int timeout)
    {
        while (true)
        {
            try
            {
                if (_database == null)
                {
                    return Task.FromResult(false);
                }
                return _database.KeyExpireAsync(key, System.TimeSpan.FromMilliseconds(timeout));
            }
            catch (RedisTimeoutException e)
            {
                Recover(e);
                Thread.Sleep(RecoverRetryDelayMs);
            }
        }
    }
    
    private Task<bool> SetStrData(string key, string data, int timeout)
    {
        while (true)
        {
            try
            {
                if (_database == null)
                {
                    return Task.FromResult(false);
                }
                
                if (timeout != 0)
                {
                    return _database.StringSetAsync(key, data, System.TimeSpan.FromMilliseconds(timeout));
                }
                else
                {
                    return _database.StringSetAsync(key, data);
                }
            }
            catch (RedisTimeoutException e)
            {
                Recover(e);
                Thread.Sleep(RecoverRetryDelayMs);
            }
        }
    }

    public Task<bool> SetData(string key, byte[] data, int timeout = 0)
    {
        while (true)
        {
            try
            {
                if (_database == null)
                {
                    return Task.FromResult(false);
                }

                RedisValue value = data;
                if (timeout != 0)
                {
                    return _database.StringSetAsync(key, value, TimeSpan.FromMilliseconds(timeout));
                }

                return _database.StringSetAsync(key, value);
            }
            catch (RedisTimeoutException e)
            {
                Recover(e);
                Thread.Sleep(RecoverRetryDelayMs);
            }
        }
    }

    public Task<bool> SetDataIfNotExists(string key, int data, int timeout = 0)
    {
        while (true)
        {
            try
            {
                if (_database == null)
                {
                    return Task.FromResult(false);
                }

                var expiry = timeout > 0 ? TimeSpan.FromMilliseconds(timeout) : (TimeSpan?)null;
                return _database.StringSetAsync(key, data, expiry, when: When.NotExists);
            }
            catch (RedisTimeoutException e)
            {
                Recover(e);
                Thread.Sleep(RecoverRetryDelayMs);
            }
        }
    }

    public Task<bool> SetData<T>(string key, T data, int timeout = 0)
    {
        return SetStrData(key, JsonConvert.SerializeObject(data), timeout);
    }

    private Task<RedisValue> GetStrData(string key)
    {
        while (true)
        {
            try
            {
                if (_database == null)
                {
                    return Task.FromResult(default(RedisValue));
                }

                return _database.StringGetAsync(key);
            }
            catch (RedisTimeoutException e)
            {
                Recover(e);
                Thread.Sleep(RecoverRetryDelayMs);
            }
        }
    }

    public async Task<byte[]?> GetData(string key)
    {
        byte[]? bin = await GetStrData(key);
        return bin;
    }

    public async ValueTask<T?> GetData<T>(string key)
    {
        byte[]? data = await GetData(key);
        if (data == null || data.Length <= 0)
        {
            return default(T);
        }

        return JsonConvert.DeserializeObject<T>(Encoding.UTF8.GetString(data));
    }

    public bool DelData(string key)
    {
        while (true)
        {
            try
            {
                if (_database == null)
                {
                    return false;
                }
                
                return _database.KeyDelete(key);
            }
            catch (RedisTimeoutException e)
            {
                Recover(e);
                Thread.Sleep(RecoverRetryDelayMs);
            }
        }
    }

    public Task<long>  Publish<T>(string channel, T data) where T : IMessage<T>, new()
    {
        while (true)
        {
            try
            {
                if (_subscriber == null)
                {
                    return Task.FromResult((long)0);
                }

                var ntf = new Request()
                {
                    Token = channel,
                    ProtoName = typeof(T).FullName,
                    Content = data.ToByteString()
                };
                
                return _subscriber.PublishAsync(RedisChannel.Literal(channel), ntf.ToByteArray());
            }
            catch (RedisTimeoutException e)
            {
                Recover(e);
                Thread.Sleep(RecoverRetryDelayMs);
            }
        }
    }

    public void Subscribe(string channel, Action<string?, byte[]?> handler)
    {
        while (true)
        {
            try
            {
                if (_subscriber == null)
                {
                    return;
                }

                var t = _subscriber.Subscribe(RedisChannel.Literal(channel));
                t?.OnMessage((msg) =>
                {
                    try
                    {
                        handler?.Invoke(msg.Channel, msg.Message);
                    }
                    catch(Exception e)
                    {
                        Recover(e);
                    }
                });
            }
            catch (RedisTimeoutException e)
            {
                Recover(e);
                Thread.Sleep(RecoverRetryDelayMs);
            }
        }
    }

    public Task<long> PushList<T>(string key, T data)
    {
        while (true)
        {
            try
            {
                if (_database == null)
                {
                    return Task.FromResult((long)0);
                }
                
                return _database.ListLeftPushAsync(key, JsonConvert.SerializeObject(data));
            }
            catch (RedisTimeoutException e)
            {
                Recover(e);
                Thread.Sleep(RecoverRetryDelayMs);
            }
        }
    }

    public async Task<T?> PopList<T>(string key)
    {
        while (true)
        {
            try
            {
                if (_database == null)
                {
                    return default(T);
                }
                
                var data = await _database.ListLeftPopAsync(key);
                if (data.IsNull)
                {
                    return default(T);
                }
                
                return JsonConvert.DeserializeObject<T>(data.ToString());
            }
            catch (RedisTimeoutException e)
            {
                Recover(e);
                await Task.Delay(RecoverRetryDelayMs);
            }
        }
    }

    public async ValueTask Lock(string key, string token, uint timeout)
    {
        var waitTime = 8;
        while (true)
        {
            try
            {
                if (_database == null)
                {
                    return;
                }
                
                var ret = await _database.LockTakeAsync(key, token, System.TimeSpan.FromMilliseconds(timeout));
                if (!ret)
                {
                    await Task.Delay(waitTime);
                    waitTime *= 2;
                    continue;
                }
                break;
            }
            catch (RedisTimeoutException e)
            {
                Recover(e);
                await Task.Delay(RecoverRetryDelayMs);
            }
        }
    }

    public async ValueTask<bool> TryLock(string key, string token, uint timeout)
    {
        try
        {
            if (_database == null)
            {
                return false;
            }
            
            return await _database.LockTakeAsync(key, token, System.TimeSpan.FromMilliseconds(timeout));
        }
        catch (RedisTimeoutException e)
        {
            Recover(e);
            await Task.Delay(RecoverRetryDelayMs);
        }
        
        return false;
    }

    public async ValueTask<bool> LockExtend(string key, string token, uint timeout)
    {
        try
        {
            if (_database == null)
            {
                return false;
            }

            return await _database.LockExtendAsync(key, token, TimeSpan.FromMilliseconds(timeout));
        }
        catch (RedisTimeoutException e)
        {
            Recover(e);
            await Task.Delay(RecoverRetryDelayMs);
        }

        return false;
    }

    public async ValueTask UnLock(string key, string token)
    {
        while (true)
        {
            try
            {
                if (_database == null)
                {
                    return;
                }
                
                await _database.LockReleaseAsync(key, token);
                break;
            }
            catch (RedisTimeoutException e)
            {
                Recover(e);
                await Task.Delay(RecoverRetryDelayMs);
            }
        }
    }

    public Task<bool> SortedSetAdd(string key, string member, double score)
    {
        while (true)
        {
            try
            {
                if (_database == null)
                {
                    return Task.FromResult(false);
                }

                return _database.SortedSetAddAsync(key, member, score);
            }
            catch (RedisTimeoutException e)
            {
                Recover(e);
                Thread.Sleep(RecoverRetryDelayMs);
            }
        }
    }

    public Task<double> SortedSetIncrement(string key, string member, double value)
    {
        while (true)
        {
            try
            {
                if (_database == null)
                {
                    return Task.FromResult(0d);
                }

                return _database.SortedSetIncrementAsync(key, member, value);
            }
            catch (RedisTimeoutException e)
            {
                Recover(e);
                Thread.Sleep(RecoverRetryDelayMs);
            }
        }
    }

    public Task<long?> SortedSetRank(string key, string member, Order order = Order.Descending)
    {
        while (true)
        {
            try
            {
                if (_database == null)
                {
                    return Task.FromResult<long?>(null);
                }

                return _database.SortedSetRankAsync(key, member, order);
            }
            catch (RedisTimeoutException e)
            {
                Recover(e);
                Thread.Sleep(RecoverRetryDelayMs);
            }
        }
    }

    public Task<double?> SortedSetScore(string key, string member)
    {
        while (true)
        {
            try
            {
                if (_database == null)
                {
                    return Task.FromResult<double?>(null);
                }

                return _database.SortedSetScoreAsync(key, member);
            }
            catch (RedisTimeoutException e)
            {
                Recover(e);
                Thread.Sleep(RecoverRetryDelayMs);
            }
        }
    }

    public Task<SortedSetEntry[]> SortedSetRangeByRankWithScores(string key, long start, long stop, Order order = Order.Descending)
    {
        while (true)
        {
            try
            {
                if (_database == null)
                {
                    return Task.FromResult(Array.Empty<SortedSetEntry>());
                }

                return _database.SortedSetRangeByRankWithScoresAsync(key, start, stop, order);
            }
            catch (RedisTimeoutException e)
            {
                Recover(e);
                Thread.Sleep(RecoverRetryDelayMs);
            }
        }
    }

    public Task<bool> HashSet(string key, string field, string value)
    {
        while (true)
        {
            try
            {
                if (_database == null)
                {
                    return Task.FromResult(false);
                }

                return _database.HashSetAsync(key, field, value);
            }
            catch (RedisTimeoutException e)
            {
                Recover(e);
                Thread.Sleep(RecoverRetryDelayMs);
            }
        }
    }

    public async Task<string?> HashGet(string key, string field)
    {
        while (true)
        {
            try
            {
                if (_database == null)
                {
                    return null;
                }

                var value = await _database.HashGetAsync(key, field);
                return value.IsNull ? null : value.ToString();
            }
            catch (RedisTimeoutException e)
            {
                Recover(e);
                await Task.Delay(RecoverRetryDelayMs);
            }
        }
    }
}
