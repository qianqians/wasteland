using MongoDB.Bson;
namespace hub;

public class AsyncNtfMsg : IHostingData
{
    public required List<string> AsyncNtfMsgList;

    public static string Type()
    {
        return "AsyncNtfMsg";
    }

    public static IHostingData? Create()
    {
        return new AsyncNtfMsg()
        {
            AsyncNtfMsgList = new()
        };
    }

    public static IHostingData? Load(BsonDocument data)
    {
        var msgList = new AsyncNtfMsg()
        {
            AsyncNtfMsgList = new()
        };
        
        foreach(var item in data.GetValue("Messages").AsBsonArray)
        {
            msgList.AsyncNtfMsgList.Add(item.AsString);
        }

        return msgList;
    }

    public BsonDocument Store()
    {
        var itemList = new BsonArray();
        foreach (var item in AsyncNtfMsgList)
        {
            itemList.Add(item);
        }
        var doc = new BsonDocument
        {
            { "Messages", itemList }
        };
        return doc;
    }

    public void SendOfflineMsg(string msg)
    {
        try
        {
            AsyncNtfMsgList.Add(msg);
        }
        catch (Exception ex)
        {
            Log.Err("SendOfflineMsg ex:{0}", ex);
            throw;
        }
    }
}
