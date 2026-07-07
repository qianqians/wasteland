using System;

namespace hub;

public partial class TimerService
{
    private void AddDayTimeHandleImpl()
    {
        lock (pendingDayTimeHandles)
        {
            foreach (var item in pendingDayTimeHandles)
            {
                if (!dayTimeHandles.TryGetValue(item.Key, out var impls))
                {
                    impls = [];
                    dayTimeHandles.Add(item.Key, impls);
                }
                impls.AddRange(item.Value);
            }
            pendingDayTimeHandles.Clear();
        }
    }

    private void PollDayTimeHandleImpl(long tick)
    {
        AddDayTimeHandleImpl();

        var t = DateTime.Now;
        _dayTimeList.Clear();
        foreach (var (key, item) in dayTimeHandles)
        {
            if (key.Hour != t.Hour || key.Minute != t.Minute || key.Second > t.Second)
            {
                continue;
            }
            _dayTimeList.Add(key);

            foreach (var impl in item)
            {
                if (impl.IsDel)
                {
                    continue;
                }

                var handle = impl.Handle as Action<DateTime>;
                if (handle == null)
                {
                    continue;
                }
                try
                {
                    handle(t);
                }
                catch (Exception e)
                {
                    Log.Err("System.Exception{0}", e);
                }
            }
        }

        foreach (var item in _dayTimeList)
        {
            dayTimeHandles.Remove(item);
        }

        AddTickTime(888, PollDayTimeHandleImpl);
    }

    private void AddWeekDayTimeHandleImpl()
    {
        lock (pendingWeekDayTimeHandles)
        {
            foreach (var (key, item) in pendingWeekDayTimeHandles)
            {
                if (!weekDayTimeHandles.TryGetValue(key, out var impls))
                {
                    impls = [];
                    weekDayTimeHandles.Add(key, impls);
                }
                impls.AddRange(item);
            }
            pendingWeekDayTimeHandles.Clear();
        }
    }

    private void PollTimeHandleImpl(long tick)
    {
        AddWeekDayTimeHandleImpl();

        _weekDayTimeList.Clear();
        var t = DateTime.Now;
        foreach (var (key, item) in weekDayTimeHandles)
        {
            if (key.Day != t.DayOfWeek || key.Hour != t.Hour || key.Minute != t.Minute || key.Second > t.Second)
            {
                continue;
            }
            _weekDayTimeList.Add(key);

            foreach (var impl in item)
            {
                if (impl.IsDel)
                {
                    continue;
                }

                var handle = impl.Handle as Action<DateTime>;
                if (handle == null)
                {
                    continue;
                }
                try
                {
                    handle(t);
                }
                catch (Exception e)
                {
                    Log.Err("System.Exception{0}", e);
                }
            }
        }

        foreach (var item in _weekDayTimeList)
        {
            weekDayTimeHandles.Remove(item);
        }

        AddTickTime(888, PollTimeHandleImpl);
    }

    private void AddMonthDayTimeHandleImpl()
    {
        lock (pendingMonthDayTimeHandles)
        {
            foreach (var (key, item) in pendingMonthDayTimeHandles)
            {
                if (!monthDayTimeHandles.TryGetValue(key, out var impls))
                {
                    impls = [];
                    monthDayTimeHandles.Add(key, impls);
                }
                impls.AddRange(item);
            }
            pendingMonthDayTimeHandles.Clear();
        }
    }

    private void PollMonthTimeHandleImpl(long tick)
    {
        AddMonthDayTimeHandleImpl();

        _monthDayTimeList.Clear();
        var t = DateTime.Now;
        foreach (var (key, item) in monthDayTimeHandles)
        {
            if (key.Month != t.Month || key.Day != t.Day || key.Hour != t.Hour || key.Minute != t.Minute || key.Second > t.Second)
            {
                continue;
            }
            _monthDayTimeList.Add(key);

            foreach (var impl in item)
            {
                if (impl.IsDel)
                {
                    continue;
                }

                var handle = impl.Handle as Action<DateTime>;
                if (handle == null)
                {
                    continue;
                }
                try
                {
                    handle(t);
                }
                catch (Exception e)
                {
                    Log.Err("System.Exception{0}", e);
                }
            }
        }

        foreach (var item in _monthDayTimeList)
        {
            monthDayTimeHandles.Remove(item);
        }

        AddTickTime(888, PollMonthTimeHandleImpl);
    }

    public object AddDayTime(int hour, int minute, int second, Action<DateTime> handle)
    {
        var key = new DayTime
        {
            Hour = hour,
            Minute = minute,
            Second = second,
        };

        var impl = new HandleImpl(handle);
        lock (pendingDayTimeHandles)
        {
            if (!pendingDayTimeHandles.TryGetValue(key, out var impls))
            {
                impls = [];
                pendingDayTimeHandles.Add(key, impls);
            }
            impls.Add(impl);
        }

        return impl;
    }

    public object AddWeekDayTime(DayOfWeek day, int hour, int minute, int second, Action<DateTime> handle)
    {
        var key = new WeekDayTime
        {
            Day = day,
            Hour = hour,
            Minute = minute,
            Second = second,
        };

        var impl = new HandleImpl(handle);
        lock (pendingWeekDayTimeHandles)
        {
            if (!pendingWeekDayTimeHandles.TryGetValue(key, out var impls))
            {
                impls = [];
                pendingWeekDayTimeHandles.Add(key, impls);
            }
            impls.Add(impl);
        }

        return impl;
    }

    public object AddMonthDayTime(int month, int day, int hour, int minute, int second, Action<DateTime> handle)
    {
        var key = new MonthDayTime
        {
            Month = month,
            Day = day,
            Hour = hour,
            Minute = minute,
            Second = second,
        };

        var impl = new HandleImpl(handle);
        lock (pendingMonthDayTimeHandles)
        {
            if (!pendingMonthDayTimeHandles.ContainsKey(key))
            {
                pendingMonthDayTimeHandles.Add(key, new List<HandleImpl>());
            }
            pendingMonthDayTimeHandles[key].Add(impl);
        }

        return impl;
    }
}
