using MongoDB.Driver;
namespace hub;

public sealed class BatchUpdateItem
{
    public required byte[] Query;
    public required byte[] Update;
}

public class MongodbProxy
{
    private readonly MongoClient _client;

    public MongodbProxy(string url)
    {
        var mongoUrl = new MongoUrl(url);
        _client = new MongoClient(mongoUrl);
    }

    private MongoClient GetMongoClient()
    {
        return _client;
    }

    private IMongoCollection<MongoDB.Bson.BsonDocument> GetCollection(string db, string collection)
    {
        return _client.GetDatabase(db).GetCollection<MongoDB.Bson.BsonDocument>(collection);
    }

    private static MongoDB.Bson.BsonDocument Deserialize(byte[] bsonData)
    {
        return MongoDB.Bson.Serialization.BsonSerializer.Deserialize<MongoDB.Bson.BsonDocument>(bsonData);
    }

    public void CreateIndex(string db, string collection, string key, bool isUnique)
    {
        var collectionInst = GetCollection(db, collection);

        try
        {
            var builder = new IndexKeysDefinitionBuilder<MongoDB.Bson.BsonDocument>();
            var opt = new CreateIndexOptions
            {
                Unique = isUnique
            };
            var indexModel = new CreateIndexModel<MongoDB.Bson.BsonDocument>(builder.Ascending(key), opt);
            collectionInst.Indexes.CreateOne(indexModel);
        }
        catch(Exception e)
        {
            Log.Err("create_index failed, {0}", e.Message);
        }
    }

    public async Task CheckIntGuid(string db, string collection, long guid)
    {
        var collectionInst = GetCollection(db, collection);

        try
        {
            var query = new BsonDocumentFilterDefinition<MongoDB.Bson.BsonDocument>(new MongoDB.Bson.BsonDocument("Guid", "__guid__"));

            var c = await collectionInst.FindAsync<MongoDB.Bson.BsonDocument>(query);
            if (c != null && await c.MoveNextAsync() && (c.Current == null || !c.Current.Any()))
            {
                MongoDB.Bson.BsonDocument d = new MongoDB.Bson.BsonDocument { { "Guid", "__guid__" }, { "inside_guid", guid } };
                await collectionInst.InsertOneAsync(d);
            }
        }
        catch (Exception e)
        {
            Log.Err("check_int_guid db: {0}, collection: {1}, inside_guid: {2}, faild: {3}", db, collection, guid, e);
        }
    }

    public async ValueTask<bool> Save(string db, string collection, byte[] bsonData)
    {
        var collectionInst = GetCollection(db, collection);

        var d = Deserialize(bsonData);
        await collectionInst.InsertOneAsync(d);

        return true;
	}

    public async ValueTask<bool> Update(string db, string collection, byte[] bsonQuery, byte[] bsonUpdate, bool upsert)
    {
        var collectionInst = GetCollection(db, collection);

        var bsonQueryDoc = Deserialize(bsonQuery);
        var bsonUpdateDoc = Deserialize(bsonUpdate);

        var query = new BsonDocumentFilterDefinition<MongoDB.Bson.BsonDocument>(bsonQueryDoc);
        var update = new BsonDocumentUpdateDefinition<MongoDB.Bson.BsonDocument>(bsonUpdateDoc);
        var options = new UpdateOptions() { IsUpsert = upsert };

        await collectionInst.UpdateOneAsync(query, update, options);

        return true;
	}

    public async ValueTask<bool> BulkUpdate(string db, string collection, IReadOnlyList<BatchUpdateItem> items, bool upsert)
    {
        if (items.Count == 0)
        {
            return true;
        }

        var collectionInst = GetCollection(db, collection);
        var models = new List<WriteModel<MongoDB.Bson.BsonDocument>>(items.Count);
        foreach (var item in items)
        {
            var query = new BsonDocumentFilterDefinition<MongoDB.Bson.BsonDocument>(Deserialize(item.Query));
            var update = new BsonDocumentUpdateDefinition<MongoDB.Bson.BsonDocument>(Deserialize(item.Update));
            models.Add(new UpdateOneModel<MongoDB.Bson.BsonDocument>(query, update) { IsUpsert = upsert });
        }

        await collectionInst.BulkWriteAsync(models, new BulkWriteOptions { IsOrdered = false });
        return true;
    }

    public async ValueTask<MongoDB.Bson.BsonDocument> FindAndModify(string db, string collection, byte[] bsonQuery, byte[] bsonUpdate, bool isNew, bool upsert)
    {
        var collectionInst = GetCollection(db, collection);

        var bsonQueryDoc = Deserialize(bsonQuery);
        var bsonUpdateDoc = Deserialize(bsonUpdate);

        var query = new BsonDocumentFilterDefinition<MongoDB.Bson.BsonDocument>(bsonQueryDoc);
        var bsonUpdateImpl = new MongoDB.Bson.BsonDocument { { "$set", bsonUpdateDoc } };
        var update = new BsonDocumentUpdateDefinition<MongoDB.Bson.BsonDocument>(bsonUpdateImpl);
        var options = new FindOneAndUpdateOptions<MongoDB.Bson.BsonDocument, MongoDB.Bson.BsonDocument>()
        {
            ReturnDocument = isNew ? ReturnDocument.After : ReturnDocument.Before,
            IsUpsert = upsert
        };

        var r = await collectionInst.FindOneAndUpdateAsync(query, update, options);

        return r;
    }

    public async ValueTask<MongoDB.Bson.BsonArray?> Find(string db, string collection, byte[] bsonQuery, int skip, int limit, string sort, bool ascending)
    {
        var collectionInst = GetCollection(db, collection);

        var bsonQueryDoc = Deserialize(bsonQuery);
        var opt = new FindOptions<MongoDB.Bson.BsonDocument>();
        if (skip > 0)
        {
            opt.Skip = skip;
        }
        if (limit > 0)
        {
            opt.Limit = limit;
        }
        if (!string.IsNullOrEmpty(sort))
        {
            opt.Sort = ascending ? Builders<MongoDB.Bson.BsonDocument>.Sort.Ascending(sort) : 
                Builders<MongoDB.Bson.BsonDocument>.Sort.Descending(sort);
        }
        opt.Projection = Builders<MongoDB.Bson.BsonDocument>.Projection.Exclude("_id");

        var c = await collectionInst.FindAsync(bsonQueryDoc, opt);
        if (c == null)
        {
            return null;
        }
        
        var datalist = new MongoDB.Bson.BsonArray();
        while (await c.MoveNextAsync())
        {
            var cur = c.Current;
            if (cur != null)
            {
                foreach (var data in cur)
                {
                    datalist.Add(data);
                }
            }
        }
        
        return datalist;
    }

    public async ValueTask<int> Count(string db, string collection, byte[] bsonQuery)
    {
        var collectionInst = GetCollection(db, collection);

        var bsonQueryDoc = Deserialize(bsonQuery);
        return (int)(await collectionInst.CountDocumentsAsync(bsonQueryDoc));
    }

	public async ValueTask<bool> Remove(string db, string collection, byte[] bsonQuery)
    {
        var collectionInst = GetCollection(db, collection);

        var bsonQueryDoc = Deserialize(bsonQuery);
        await collectionInst.DeleteOneAsync(bsonQueryDoc);

        return true;
	}

    public async ValueTask<long> GetGuid(string db, string collection)
    {
        var collectionInst = GetCollection(db, collection);

        var query = new MongoDB.Bson.BsonDocument("Guid", "__guid__");
        var queryDoc = new BsonDocumentFilterDefinition<MongoDB.Bson.BsonDocument>(query);
        var bsonUpdateImpl = new MongoDB.Bson.BsonDocument { { "$inc", new MongoDB.Bson.BsonDocument { { "inside_guid", 1 } } } };
        var options = new FindOneAndUpdateOptions<MongoDB.Bson.BsonDocument, MongoDB.Bson.BsonDocument>
        {
            ReturnDocument = ReturnDocument.After,
            IsUpsert = true
        };

        var c = await collectionInst.FindOneAndUpdateAsync<MongoDB.Bson.BsonDocument>(queryDoc, bsonUpdateImpl, options);
        return c.GetValue("inside_guid").ToInt64();
    }
}
