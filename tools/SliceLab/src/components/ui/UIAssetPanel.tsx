// UIAssetPanel：右侧素材库面板
// 功能：搜索、网格展示素材库图片、支持拖拽到画布
import { useEffect, useRef, useState, useCallback } from "react";
import { api, type ImageMeta } from "@/lib/api";

const PAGE_SIZE = 60;

export function UIAssetPanel() {
  const [items, setItems] = useState<ImageMeta[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const searchTimer = useRef<number | null>(null);

  // 加载第一页
  const loadFirst = useCallback(async (searchKw: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.listImages({ search: searchKw || undefined, limit: PAGE_SIZE, offset: 0 });
      setItems(res.items);
      setTotal(res.total);
    } catch (e: any) {
      setError(e?.message || "加载失败");
      setItems([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, []);

  // 搜索框防抖
  const onSearchChange = (val: string) => {
    setSearch(val);
    if (searchTimer.current) window.clearTimeout(searchTimer.current);
    searchTimer.current = window.setTimeout(() => {
      loadFirst(val);
      if (scrollRef.current) scrollRef.current.scrollTop = 0;
    }, 300);
  };

  // 滚动加载下一页
  const onScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el || loading || items.length >= total) return;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 80) {
      const offset = items.length;
      api
        .listImages({ search: search || undefined, limit: PAGE_SIZE, offset })
        .then((res) => {
          setItems((prev) => [...prev, ...res.items]);
          setTotal(res.total);
        })
        .catch((e) => setError(e?.message || "加载失败"));
    }
  }, [items, total, loading, search]);

  // 初次加载
  useEffect(() => {
    loadFirst("");
  }, [loadFirst, refreshKey]);

  // 拖拽起始
  const onDragStart = (e: React.DragEvent, img: ImageMeta) => {
    const payload = JSON.stringify({ _kind: "asset", id: img.id });
    e.dataTransfer.setData("text/asset", payload);
    e.dataTransfer.setData("application/x-asset", payload);
    e.dataTransfer.setData("text/plain", `asset:${img.id}`);
    e.dataTransfer.effectAllowed = "copy";
  };

  return (
    <div className="flex flex-col h-full bg-ink-900 border-l border-ink-700">
      {/* 顶部搜索 + 刷新 */}
      <div className="shrink-0 px-3 py-2.5 border-b border-ink-700 space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-[12px] font-semibold text-fg">素材库</span>
          <span className="text-[10px] text-fg-muted">共 {total}</span>
          <div className="flex-1" />
          <button
            className="w-6 h-6 inline-flex items-center justify-center text-fg-muted hover:text-fg hover:bg-ink-700 rounded transition-colors"
            onClick={() => setRefreshKey((k) => k + 1)}
            title="刷新"
          >
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="23 4 23 10 17 10" />
              <polyline points="1 20 1 14 7 14" />
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
            </svg>
          </button>
        </div>
        <div className="relative">
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="搜索素材名..."
            className="w-full h-7 pl-7 pr-2 text-[11px] bg-ink-800 border border-ink-700 rounded text-fg placeholder:text-fg-muted/60 focus:outline-none focus:border-accent/50"
          />
          <svg
            viewBox="0 0 24 24"
            width="13"
            height="13"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="absolute left-2 top-1/2 -translate-y-1/2 text-fg-muted pointer-events-none"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </div>
        <div className="text-[10px] text-fg-muted/80 leading-relaxed">
          拖拽图片到画布或图片控件即可使用
        </div>
      </div>

      {/* 图片网格 */}
      <div
        ref={scrollRef}
        onScroll={onScroll}
        className="flex-1 overflow-y-auto p-2"
        style={{ minHeight: 0 }}
      >
        {error && (
          <div className="text-[11px] text-danger px-2 py-4 text-center">{error}</div>
        )}
        {!error && !loading && items.length === 0 && (
          <div className="text-[11px] text-fg-muted px-2 py-8 text-center">
            {search ? "没有匹配的素材" : "素材库为空"}
          </div>
        )}
        {items.length > 0 && (
          <div className="grid grid-cols-2 gap-1.5">
            {items.map((img) => (
              <div
                key={img.id}
                draggable
                onDragStart={(e) => onDragStart(e, img)}
                className="group relative aspect-square bg-ink-800 border border-ink-700 rounded cursor-grab hover:border-accent/60 hover:bg-ink-700 transition-colors overflow-hidden active:cursor-grabbing"
                title={`${img.name}\n${img.width}×${img.height}\n拖拽到画布使用`}
              >
                <img
                  src={api.getImageThumbnailUrl(img.id)}
                  alt={img.name}
                  loading="lazy"
                  className="absolute inset-0 w-full h-full object-contain pointer-events-none select-none"
                  draggable={false}
                />
                <div className="absolute bottom-0 left-0 right-0 px-1 py-0.5 text-[9px] text-fg bg-ink-950/80 truncate pointer-events-none">
                  {img.name}
                </div>
              </div>
            ))}
          </div>
        )}
        {loading && (
          <div className="text-[11px] text-fg-muted px-2 py-4 text-center">加载中...</div>
        )}
        {!loading && items.length > 0 && items.length < total && (
          <div className="text-[10px] text-fg-muted px-2 py-3 text-center">
            已加载 {items.length} / {total}
          </div>
        )}
      </div>
    </div>
  );
}
