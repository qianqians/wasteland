namespace hub;
using Google.Protobuf;

public class Subscribe(RedisHandle handle)
{
    private delegate void SubHandler(ByteString data);
    private readonly Dictionary<string, SubHandler> _callbackSub = new();
    private readonly RedisHandle _redis = handle;

    public void SubscribeChannel(string channel)
    {
        _redis.Subscribe(channel, (_, data) =>
        {
            var req = Request.Parser.ParseFrom(data, 0, data!.Length);
            if (!_callbackSub.TryGetValue(req.ProtoName, out var callback))
            {
                callback?.Invoke(req.Content);
            }
        });
    }
    
    public void RegisterSubscribe<T>(string method, Action<T> callback) where T : IMessage<T>, new()
    {
        var parser = new MessageParser<T>(() => new T());
        _callbackSub.Add(method, (data) =>
        {
            try
            {
                var t = parser.ParseFrom(data);
                callback(t);
            }
            catch (Exception ex)
            {
                Log.Err("", ex);
            }
        });
    }
}