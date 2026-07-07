using System;
using System.Collections.Generic;
using System.Threading;

namespace hub;

public partial class TimerService
{
    private const int PollIntervalMs = 100;
    private static readonly Lock Mutex = new();
    private static TimerService? _ins;

    public static TimerService? Ins
    {
        get
        {
            if (_ins != null)
            {
                return _ins;
            }

            lock (Mutex)
            {
                Thread.MemoryBarrier();
                if (_ins != null)
                {
                    return _ins;
                }

                _ins = new TimerService();
            }

            return _ins;
        }
    }

    private TimerService() : this(startPollingTimer: true)
    {
    }

    private TimerService(bool startPollingTimer)
    {
        tickHandleDict = new SortedDictionary<long, HandleImpl>();
        addTickHandle = new Dictionary<long, HandleImpl>();

        dayTimeHandles = new Dictionary<DayTime, List<HandleImpl>>();
        pendingDayTimeHandles = new Dictionary<DayTime, List<HandleImpl>>();

        weekDayTimeHandles = new Dictionary<WeekDayTime, List<HandleImpl>>();
        pendingWeekDayTimeHandles = new Dictionary<WeekDayTime, List<HandleImpl>>();

        monthDayTimeHandles = new Dictionary<MonthDayTime, List<HandleImpl>>();
        pendingMonthDayTimeHandles = new Dictionary<MonthDayTime, List<HandleImpl>>();

        loopDayTimeHandles = new Dictionary<DayTime, List<HandleImpl>>();
        pendingLoopDayTimeHandles = new Dictionary<DayTime, List<HandleImpl>>();
        requeueLoopDayTimeHandles = new Dictionary<DayTime, List<HandleImpl>>();

        loopWeekDayTimeHandles = new Dictionary<WeekDayTime, List<HandleImpl>>();
        pendingLoopWeekDayTimeHandles = new Dictionary<WeekDayTime, List<HandleImpl>>();
        requeueLoopWeekDayTimeHandles = new Dictionary<WeekDayTime, List<HandleImpl>>();

        Tick = (long)(DateTime.UtcNow - new DateTime(1970, 1, 1)).TotalMilliseconds;

        loopDayTick = 0;
        loopWeekDayTick = 0;

        _pollTimer = new Timer(static state =>
        {
            var service = state as TimerService;
            if (service == null)
            {
                return;
            }

            if (Interlocked.Exchange(ref service._isPolling, 1) != 0)
            {
                return;
            }

            try
            {
                service.Poll();
            }
            finally
            {
                Volatile.Write(ref service._isPolling, 0);
            }
        }, this, startPollingTimer ? 0 : Timeout.Infinite, PollIntervalMs);

        AddTickTime(888, PollDayTimeHandleImpl);
        AddTickTime(888, PollTimeHandleImpl);
        AddTickTime(888, PollMonthTimeHandleImpl);
        AddTickTime(888, PollLoopDayTimeHandleImpl);
        AddTickTime(888, PollLoopWeekDayTimeHandleImpl);
    }

    internal static TimerService CreateForTests()
    {
        return new TimerService(startPollingTimer: false);
    }

    private static long Refresh()
    {
        Tick = (long)(DateTime.UtcNow - new DateTime(1970, 1, 1)).TotalMilliseconds;
        return Tick;
    }

    public static long WeekEndTimestamp()
    {
        var now = DateTime.Now;
        var dayOfWeek = Convert.ToInt32(now.DayOfWeek.ToString("d"));
        dayOfWeek = dayOfWeek <= 0 ? 7 : dayOfWeek;
        var endOfWeek = now.AddDays(7 - dayOfWeek).Date;
        endOfWeek = endOfWeek.AddHours(23 - endOfWeek.Hour).AddMinutes(59 - endOfWeek.Minute).AddSeconds(59 - endOfWeek.Second);

        return (long)(endOfWeek - new DateTime(1970, 1, 1)).TotalMilliseconds;
    }

    public void Poll()
    {
        Refresh();
        PollTickHandleImpl();
    }
}
