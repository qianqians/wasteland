using System.Reflection;
using hub;

namespace hub.Tests;

static class AssertEx
{
    public static void Equal<T>(T expected, T actual, string message)
    {
        if (!EqualityComparer<T>.Default.Equals(expected, actual))
        {
            throw new Exception($"{message}. Expected: {expected}, Actual: {actual}");
        }
    }

    public static void NotSame(object? left, object? right, string message)
    {
        if (ReferenceEquals(left, right))
        {
            throw new Exception(message);
        }
    }
}

internal static class Program
{
    private static int Main()
    {
        var failures = new List<string>();

        Run("Loop day timers fire at scheduled daytime and rearm next day", TestLoopDayTimers, failures);
        Run("Loop week timers fire at scheduled weekday and rearm next week", TestLoopWeekTimers, failures);
        Run("Redis reconnect wait handle is scoped per helper instance", TestRedisWaitHandleIsolation, failures);

        if (failures.Count > 0)
        {
            Console.Error.WriteLine($"FAILED: {failures.Count} test(s)");
            foreach (var failure in failures)
            {
                Console.Error.WriteLine(failure);
            }
            return 1;
        }

        Console.WriteLine("All hub regression tests passed.");
        return 0;
    }

    private static void Run(string name, Action test, List<string> failures)
    {
        try
        {
            test();
            Console.WriteLine($"PASS {name}");
        }
        catch (Exception ex)
        {
            failures.Add($"FAIL {name}: {ex.Message}");
        }
    }

    private static void TestLoopDayTimers()
    {
        var service = TimerService.CreateForTests();
        var triggerCount = 0;

        service.AddLoopDayTime(8, 30, 0, _ => triggerCount++);

        service.PollLoopDayTimeForTest(new DateTime(2026, 5, 6, 8, 29, 59));
        AssertEx.Equal(0, triggerCount, "loop day timer should not fire early");

        service.PollLoopDayTimeForTest(new DateTime(2026, 5, 6, 8, 30, 5));
        AssertEx.Equal(1, triggerCount, "loop day timer should fire at its daytime slot");

        service.PollLoopDayTimeForTest(new DateTime(2026, 5, 6, 8, 30, 6));
        AssertEx.Equal(1, triggerCount, "loop day timer should fire only once per day");

        service.PollLoopDayTimeForTest(new DateTime(2026, 5, 7, 8, 30, 2));
        AssertEx.Equal(2, triggerCount, "loop day timer should rearm on the next day");
    }

    private static void TestLoopWeekTimers()
    {
        var service = TimerService.CreateForTests();
        var triggerCount = 0;

        service.AddLoopWeekDayTime(DayOfWeek.Monday, 14, 0, 0, _ => triggerCount++);

        service.PollLoopWeekDayTimeForTest(new DateTime(2026, 5, 4, 13, 59, 59));
        AssertEx.Equal(0, triggerCount, "loop week timer should not fire early");

        service.PollLoopWeekDayTimeForTest(new DateTime(2026, 5, 4, 14, 0, 3));
        AssertEx.Equal(1, triggerCount, "loop week timer should fire at its weekday slot");

        service.PollLoopWeekDayTimeForTest(new DateTime(2026, 5, 4, 14, 0, 5));
        AssertEx.Equal(1, triggerCount, "loop week timer should fire only once per week");

        service.PollLoopWeekDayTimeForTest(new DateTime(2026, 5, 11, 14, 0, 1));
        AssertEx.Equal(2, triggerCount, "loop week timer should rearm on the next week");
    }

    private static void TestRedisWaitHandleIsolation()
    {
        var helperType = typeof(RedisConnectionHelper);
        var waitNotifyField = helperType.GetField("_waitNotify", BindingFlags.Instance | BindingFlags.NonPublic)
            ?? throw new Exception("could not find _waitNotify field");

        var helper1 = new RedisConnectionHelper("127.0.0.1:6379", "redis-a", string.Empty);
        var helper2 = new RedisConnectionHelper("127.0.0.1:6379", "redis-b", string.Empty);

        var wait1 = waitNotifyField.GetValue(helper1);
        var wait2 = waitNotifyField.GetValue(helper2);

        AssertEx.NotSame(wait1, wait2, "redis helpers should not share the same wait handle");
    }
}
