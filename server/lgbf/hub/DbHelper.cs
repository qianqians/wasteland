using MongoDB.Bson;
namespace hub;

public class SaveDataHelper
{
    private class SaveDataHelperException(string errInfo) : Exception(errInfo)
    {
    }

    private BsonDocument? _bsonData = null;
    private readonly Dictionary<string, BsonValue> _setData = new();

    public SaveDataHelper Set<T>(string key, T t)
    {
        if (_bsonData != null)
        {
            throw new SaveDataHelperException("repeat set value json_data is set!");
        }

        if (t == null)
        {
            throw new SaveDataHelperException("t value is empty!");
        }

        _setData[key] = BsonValue.Create(t);

        return this;
    }

    public SaveDataHelper Set(string key, string v)
    {
        if (_bsonData != null)
        {
            throw new SaveDataHelperException("repeat set value json_data is set!");
        }
        _setData[key] = v;
        return this;
    }

    public SaveDataHelper Set<T>(T t)
    {
        if (_setData.Count > 0)
        {
            throw new SaveDataHelperException("repeat set value set_data is set!");
        }
        _bsonData = t.ToBsonDocument();
        return this;
    }

    public BsonDocument Data()
    {
        BsonDocument data;

        if (_setData.Count > 0)
        {
            data = new BsonDocument(_setData);
        }
        else if (_bsonData != null)
        {
            data = _bsonData;
        }
        else
        {
            throw new SaveDataHelperException("empty document!");
        }

        return data;
    }
}

public class UpdateDataHelper
{
    private class UpdateDataHelperException(string errInfo) : Exception(errInfo)
    {
    }

    private BsonDocument? _bsonData = null;
    private readonly Dictionary<string, BsonValue> _setData = new();
    private readonly Dictionary<string, BsonValue> _incData = new();

    public UpdateDataHelper Set<T>(string key, T t)
    {
        if (_bsonData != null)
        {
            throw new UpdateDataHelperException("repeat set value json_data is set!");
        }
        
        if (t == null)
        {
            throw new UpdateDataHelperException("t value is empty!");
        }

        _setData[key] = BsonValue.Create(t);
        return this;
    }

    public UpdateDataHelper Set(string key, string v)
    {
        if (_bsonData != null)
        {
            throw new UpdateDataHelperException("repeat set value json_data is set!");
        }
        _setData[key] = v;
        return this;
    }

    public UpdateDataHelper Set<T>(T t)
    {
        if (_setData.Count > 0)
        {
            throw new UpdateDataHelperException("repeat set value set_data is set!");
        }
        _bsonData = t.ToBsonDocument();
        return this;
    }

    public void Inc<T>(string key, T t)
    {
        if (t == null)
        {
            throw new UpdateDataHelperException("Inc t value is empty!");
        }

        if (!string.IsNullOrEmpty(key))
        {
            _incData[key] = BsonValue.Create(t);
        }
    }

    public BsonDocument Data()
    {
        BsonDocument data = new();

        if (_setData.Count > 0)
        {
            var bsonSetData = new BsonDocument(_setData);
            data.Add("$set", bsonSetData);
        }
        else if (_bsonData != null)
        {
            data.Add("$set", _bsonData);
        }

        if (_incData.Count > 0)
        {
            var bsonIncData = new BsonDocument(_incData);
            data.Add("$inc", bsonIncData);
        }

        return data;
    }

    public bool Empty()
    {
        return _incData.Count == 0 && _setData.Count == 0 && _bsonData == null;
    }
}


public class DBQueryHelper
{
    private readonly List<KeyValuePair<string, BsonValue> > queryCondition = new ();

    public DBQueryHelper Condition(string key, long t)
    {
        queryCondition.Add(new KeyValuePair<string, BsonValue>(key, t));
        return this;
    }

    public DBQueryHelper Condition(string key, int t)
    {
        queryCondition.Add(new KeyValuePair<string, BsonValue>(key, t));
        return this;
    }

    public DBQueryHelper Condition(string key, uint t)
    {
        queryCondition.Add(new KeyValuePair<string, BsonValue>(key, t));
        return this;
    }

    public DBQueryHelper Condition(string key, float t)
    {
        queryCondition.Add(new KeyValuePair<string, BsonValue>(key, t));
        return this;
    }

    public DBQueryHelper Condition(string key, double t)
    {
        queryCondition.Add(new KeyValuePair<string, BsonValue>(key, t));
        return this;
    }

    public DBQueryHelper Condition(string key, string v)
    {
        queryCondition.Add(new KeyValuePair<string, BsonValue>(key, v));
        return this;
    }

    public void ElemListMatchEq(string key, long t)
    {
        var condition = new BsonDocument("$eq", t);
        queryCondition.Add(new KeyValuePair<string, BsonValue>(key, new BsonDocument("$elemMatch", condition)));
    }

    public void ElemListMatchEq(string key, int t)
    {
        var condition = new BsonDocument("$eq", t);
        queryCondition.Add(new KeyValuePair<string, BsonValue>(key, new BsonDocument("$elemMatch", condition)));
    }

    public void ElemListMatchEq(string key, uint t)
    {
        var condition = new BsonDocument("$eq", t);
        queryCondition.Add(new KeyValuePair<string, BsonValue>(key, new BsonDocument("$elemMatch", condition)));
    }

    public void ElemListMatchEq(string key, float t)
    {
        var condition = new BsonDocument("$eq", t);
        queryCondition.Add(new KeyValuePair<string, BsonValue>(key, new BsonDocument("$elemMatch", condition)));
    }

    public void ElemListMatchEq(string key, double t)
    {
        var condition = new BsonDocument("$eq", t);
        queryCondition.Add(new KeyValuePair<string, BsonValue>(key, new BsonDocument("$elemMatch", condition)));
    }

    public void ElemListMatchEq(string key, string t)
    {
        var condition = new BsonDocument("$eq", t);
        queryCondition.Add(new KeyValuePair<string, BsonValue>(key, new BsonDocument("$elemMatch", condition)));
    }

    public void Lte(string key, long t)
    {
        queryCondition.Add(new KeyValuePair<string, BsonValue>(key, new BsonDocument("$lte", t)));
    }

    public void Lte(string key, int t)
    {
        queryCondition.Add(new KeyValuePair<string, BsonValue>(key, new BsonDocument("$lte", t)));
    }

    public void Lte(string key, uint t)
    {
        queryCondition.Add(new KeyValuePair<string, BsonValue>(key, new BsonDocument("$lte", t)));
    }

    public void Lte(string key, float t)
    {
        queryCondition.Add(new KeyValuePair<string, BsonValue>(key, new BsonDocument("$lte", t)));
    }

    public void Lte(string key, double t)
    {
        queryCondition.Add(new KeyValuePair<string, BsonValue>(key, new BsonDocument("$lte", t)));
    }

    public void Gte(string key, long t)
    {
        queryCondition.Add(new KeyValuePair<string, BsonValue>(key, new BsonDocument("$gte", t)));
    }

    public void Gte(string key, int t)
    {
        queryCondition.Add(new KeyValuePair<string, BsonValue>(key, new BsonDocument("$gte", t)));
    }

    public void Gte(string key, uint t)
    {
        queryCondition.Add(new KeyValuePair<string, BsonValue>(key, new BsonDocument("$gte", t)));
    }

    public void Gte(string key, float t)
    {
        queryCondition.Add(new KeyValuePair<string, BsonValue>(key, new BsonDocument("$gte", t)));
    }

    public void Gte(string key, double t)
    {
        queryCondition.Add(new KeyValuePair<string, BsonValue>(key, new BsonDocument("$gte", t)));
    }

    public void _in(string key, BsonArray c)
    {
        queryCondition.Add(new KeyValuePair<string, BsonValue>(key, new BsonDocument("$in", c)));
    }

    public BsonDocument query()
    {
        var condition = new BsonArray();
        foreach (var c in queryCondition)
        {
            condition.Add(new BsonDocument(c.Key, c.Value));
        }
        BsonDocument query = new()
        {
            { "$and", condition }
        };

        return query;
    }

    public bool Empty()
    {
        return queryCondition.Count == 0;
    }
}
