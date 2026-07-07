
namespace hub;

public record class Context
{
    public required string Guid { get; init; }
    public RedisHandle? Redis { get; init; }
    public MongodbProxy? Mongo { get; init; }
    public TimerService? Timer { get; init; }

    public static Context New(string guid)
    {
        return new Context()
        {
            Guid = guid,
            Redis = Main.Redis,
            Mongo = Main.Mongo,
            Timer = TimerService.Ins,
        };
    }
    
    public Context From(string guid)
    {
        return this with { Guid = guid };
    }
}
