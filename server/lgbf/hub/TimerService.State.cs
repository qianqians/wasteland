using System;
using System.Collections.Generic;
using System.Threading;

namespace hub;

public partial class TimerService
{
    public static long Tick;

    private readonly List<long> _list = [];
    private readonly List<DayTime> _dayTimeList = [];
    private readonly List<WeekDayTime> _weekDayTimeList = [];
    private readonly List<MonthDayTime> _monthDayTimeList = [];

    private readonly SortedDictionary<long, HandleImpl> tickHandleDict;
    private readonly Dictionary<long, HandleImpl> addTickHandle;
    private readonly Timer _pollTimer;
    private int _isPolling;

    private readonly Dictionary<MonthDayTime, List<HandleImpl>> monthDayTimeHandles;
    private readonly Dictionary<MonthDayTime, List<HandleImpl>> pendingMonthDayTimeHandles;

    private readonly Dictionary<WeekDayTime, List<HandleImpl>> weekDayTimeHandles;
    private readonly Dictionary<WeekDayTime, List<HandleImpl>> pendingWeekDayTimeHandles;

    private readonly Dictionary<DayTime, List<HandleImpl>> loopDayTimeHandles;
    private readonly Dictionary<DayTime, List<HandleImpl>> pendingLoopDayTimeHandles;
    private readonly Dictionary<DayTime, List<HandleImpl>> requeueLoopDayTimeHandles;
    private long loopDayTick;

    private readonly Dictionary<DayTime, List<HandleImpl>> dayTimeHandles;
    private readonly Dictionary<DayTime, List<HandleImpl>> pendingDayTimeHandles;

    private readonly Dictionary<WeekDayTime, List<HandleImpl>> loopWeekDayTimeHandles;
    private readonly Dictionary<WeekDayTime, List<HandleImpl>> pendingLoopWeekDayTimeHandles;
    private readonly Dictionary<WeekDayTime, List<HandleImpl>> requeueLoopWeekDayTimeHandles;
    private long loopWeekDayTick;

    private class HandleImpl
    {
        public HandleImpl(Action<long> handle)
        {
            IsDel = false;
            Handle = handle;
        }

        public HandleImpl(Action<DateTime> handle)
        {
            IsDel = false;
            Handle = handle;
        }

        public bool IsDel;
        public readonly object Handle;
    }
}
