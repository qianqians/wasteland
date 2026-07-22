// UIPropertyPanel：属性面板（根节点/控件/多选属性编辑）
import { useState } from "react";
import { useUiEditorStore, CANVAS_PRESETS, type UiNode, type NodeProps } from "@/store/useUiEditorStore";
import Section from "./props/Section";
import PropInput from "./props/PropInput";
import PropNumber from "./props/PropNumber";
import PropSelect from "./props/PropSelect";
import PropToggle from "./props/PropToggle";
import PropTextarea from "./props/PropTextarea";
import ColorInput from "./props/ColorInput";
import AssetSelector from "./props/AssetSelector";
import ConfirmDialog from "@/components/ConfirmDialog";

const FILL_MODE_OPTIONS = [
  { value: "contain", label: "适应" },
  { value: "cover", label: "填充" },
  { value: "fill", label: "拉伸" },
  { value: "repeat-x", label: "横向重复" },
  { value: "repeat-y", label: "纵向重复" },
  { value: "repeat", label: "网格重复" },
];
const ALIGN_OPTIONS = [
  { value: "left", label: "左对齐" },
  { value: "center", label: "居中" },
  { value: "right", label: "右对齐" },
];
const DIRECTION_OPTIONS = [
  { value: "left-to-right", label: "从左到右" },
  { value: "right-to-left", label: "从右到左" },
  { value: "top-to-bottom", label: "从上到下" },
  { value: "bottom-to-top", label: "从下到上" },
];
const TRIGGER_OPTIONS = [
  { value: "click", label: "点击" },
  { value: "mouseEnter", label: "鼠标移入" },
  { value: "mouseLeave", label: "鼠标移出" },
  { value: "mounted", label: "加载完成" },
];

function OpBtn({ active, locked, preview, onClick, children, title }: {
  active?: boolean; locked?: boolean; preview?: boolean; onClick: () => void; children: React.ReactNode; title: string;
}) {
  return (
    <button
      className={`inline-flex items-center gap-1 px-2 py-1.5 text-[11px] bg-ink-800 border border-ink-700 rounded cursor-pointer transition-colors flex-1 justify-center min-w-0 hover:bg-ink-700 hover:text-fg ${active ? "text-fg" : "text-fg-muted"} ${locked ? "text-[#fbbf24] border-[#fbbf24]/40" : ""} ${preview ? "text-[#60a5fa] border-[#60a5fa]/40 hover:bg-[#60a5fa]/15 hover:text-[#93c5fd]" : ""}`}
      onClick={onClick}
      title={title}
    >
      {children}
    </button>
  );
}

export function UIPropertyPanel() {
  const store = useUiEditorStore;
  const renderVersion = useUiEditorStore((s) => s.renderVersion);
  const selectedNodeIds = useUiEditorStore((s) => s.selectedNodeIds);
  const selectedNodeId = useUiEditorStore((s) => s.selectedNodeId);
  const rootNode = useUiEditorStore((s) => s.rootNode);
  const currentSchemeId = useUiEditorStore((s) => s.currentSchemeId);
  const isModified = useUiEditorStore((s) => s.isModified);
  const [tip, setTip] = useState<{ open: boolean; title: string; msg: string }>({ open: false, title: "", msg: "" });

  const st = store.getState();
  const node = selectedNodeId ? st.findNodeById(selectedNodeId) : null;

  // 多选
  if (selectedNodeIds.length >= 2) {
    const commonProp = (key: keyof NodeProps): any => {
      const ids = selectedNodeIds;
      if (ids.length < 2) return undefined;
      const nodes = ids.map((id) => st.findNodeById(id)).filter(Boolean) as UiNode[];
      if (nodes.length === 0) return undefined;
      const first = (nodes[0].props as any)[key];
      for (const n of nodes) {
        if ((n.props as any)[key] !== first) return undefined;
      }
      return first;
    };
    const updateMultiProp = (key: keyof NodeProps, value: any) => {
      const ids = selectedNodeIds.filter((id) => id !== rootNode.id);
      if (ids.length > 0) st.updateMultipleNodesProps(ids, { [key]: value } as any);
    };
    return (
      <div className="p-2 text-xs" key={renderVersion}>
        <Section title="多选编辑">
          <div className="text-[11px] text-fg-muted mb-2 px-2 py-1.5 bg-ink-800 rounded leading-relaxed">
            已选 {selectedNodeIds.length} 个控件，修改基础属性将批量应用
          </div>
          <div className="grid grid-cols-2 gap-1">
            <PropNumber label="宽度" value={commonProp("width")} onChange={(v) => updateMultiProp("width", v)} min={1} />
            <PropNumber label="高度" value={commonProp("height")} onChange={(v) => updateMultiProp("height", v)} min={1} />
          </div>
          <div className="grid grid-cols-2 gap-1">
            <PropNumber label="X" value={commonProp("x")} onChange={(v) => updateMultiProp("x", v)} />
            <PropNumber label="Y" value={commonProp("y")} onChange={(v) => updateMultiProp("y", v)} />
          </div>
          <PropNumber label="透明度" value={commonProp("opacity")} onChange={(v) => updateMultiProp("opacity", v)} min={0} max={1} step={0.1} />
        </Section>
      </div>
    );
  }

  if (!node) {
    return <div className="p-6 text-center text-fg-muted text-xs">选中一个控件以编辑属性</div>;
  }

  const updateProp = (key: keyof NodeProps, value: any) => {
    st.updateNodeProps(node.id, { [key]: value } as any);
  };

  const openPreview = async () => {
    if (node.type !== "root") return;
    try {
      if (isModified) await st.saveScheme();
      if (currentSchemeId) {
        const url = `/preview.html?id=${currentSchemeId}&rootId=${node.id}`;
        window.open(url, "_blank");
      } else {
        setTip({ open: true, title: "无法预览", msg: "方案尚未保存，请先点击保存按钮保存方案。" });
      }
    } catch (e: any) {
      setTip({ open: true, title: "预览失败", msg: "保存方案失败，无法预览。\n\n错误信息: " + (e?.message || e) });
    }
  };

  // 画布预设
  const canvasPresetOptions = [
    { value: "custom", label: "自定义" },
    ...CANVAS_PRESETS.map((p) => ({ value: `${p.width}x${p.height}`, label: `${p.label} (${p.width}×${p.height})` })),
  ];
  const currentPresetValue = (() => {
    const w = node.props.width;
    const h = node.props.height;
    const match = CANVAS_PRESETS.find((p) => p.width === w && p.height === h);
    return match ? `${match.width}x${match.height}` : "custom";
  })();
  const onPresetChange = (value: string) => {
    if (value === "custom") return;
    const [w, h] = value.split("x").map(Number);
    if (w && h) st.setCanvasSize(w, h);
  };

  // 容器子控件管理
  const availableChildren = (() => {
    if (node.type !== "container") return [];
    const root = st.findRootOf(node.id);
    if (!root) return [];
    return root.children.filter((n) => n.id !== node.id && !node.children.some((c) => c.id === n.id));
  })();

  const VisIcon = ({ visible }: { visible: boolean }) => visible ? (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
  ) : (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
  );
  const LockIcon = ({ locked }: { locked: boolean }) => locked ? (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
  ) : (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/></svg>
  );

  return (
    <div className="p-2 text-xs overflow-y-auto h-full" key={renderVersion}>
      {/* 根节点属性 */}
      {node.type === "root" && (
        <>
          <Section title="操作">
            <div className="flex gap-1 flex-wrap">
              <OpBtn active={node.props.visible !== false} onClick={() => updateProp("visible", !(node.props.visible !== false))} title="显示/隐藏">
                <VisIcon visible={node.props.visible !== false} />
                <span>{node.props.visible !== false ? "显示中" : "已隐藏"}</span>
              </OpBtn>
              <OpBtn locked={node.props.locked} onClick={() => updateProp("locked", !node.props.locked)} title="锁定/解锁">
                <LockIcon locked={!!node.props.locked} />
                <span>{node.props.locked ? "已锁定" : "未锁定"}</span>
              </OpBtn>
              <OpBtn preview onClick={openPreview} title="预览">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/><polygon points="10 8 16 10 10 12 10 8" fill="currentColor"/></svg>
                <span>预览</span>
              </OpBtn>
            </div>
          </Section>
          <Section title="根节点属性">
            <PropInput label="名称" value={node.name} onChange={(v) => st.updateNodeName(node.id, v)} />
            <div className="grid grid-cols-2 gap-1">
              <PropNumber label="宽度" value={node.props.width} onChange={(v) => updateProp("width", v)} min={1} />
              <PropNumber label="高度" value={node.props.height} onChange={(v) => updateProp("height", v)} min={1} />
            </div>
            <ColorInput label="背景色" value={node.props.backgroundColor} onChange={(v) => updateProp("backgroundColor", v)} />
            <AssetSelector label="背景图片" assetId={node.props.rootBgAssetId as string} onChange={(v) => updateProp("rootBgAssetId", v)} />
            {node.props.rootBgAssetId !== undefined && node.props.rootBgAssetId !== "" && (
              <>
                <PropSelect label="背景填充" value={node.props.rootBgFillMode || "contain"} options={FILL_MODE_OPTIONS} onChange={(v) => updateProp("rootBgFillMode", v)} />
                {node.props.rootBgFillMode && ["repeat-x", "repeat-y", "repeat"].includes(node.props.rootBgFillMode) && (
                  <div className="grid grid-cols-2 gap-1">
                    <PropNumber label="单元格宽" value={node.props.rootBgTileWidth ?? 100} onChange={(v) => updateProp("rootBgTileWidth", v)} min={1} />
                    <PropNumber label="单元格高" value={node.props.rootBgTileHeight ?? 100} onChange={(v) => updateProp("rootBgTileHeight", v)} min={1} />
                  </div>
                )}
              </>
            )}
          </Section>
          <Section title="画布分辨率预设">
            <PropSelect label="分辨率" value={currentPresetValue} options={canvasPresetOptions} onChange={onPresetChange} />
            <div className="text-[11px] text-fg-muted mt-1.5 leading-relaxed px-1.5 py-1 bg-ink-800 rounded">
              根节点是整个视窗，不可移动、不可旋转，默认为最底层。
            </div>
          </Section>
        </>
      )}

      {/* 普通控件属性 */}
      {node.type !== "root" && (
        <>
          <Section title="操作">
            <div className="flex gap-1 flex-wrap">
              <OpBtn active={node.props.visible !== false} onClick={() => updateProp("visible", !(node.props.visible !== false))} title="显示/隐藏">
                <VisIcon visible={node.props.visible !== false} />
                <span>{node.props.visible !== false ? "显示中" : "已隐藏"}</span>
              </OpBtn>
              <OpBtn locked={node.props.locked} onClick={() => updateProp("locked", !node.props.locked)} title="锁定/解锁">
                <LockIcon locked={!!node.props.locked} />
                <span>{node.props.locked ? "已锁定" : "未锁定"}</span>
              </OpBtn>
            </div>
          </Section>

          <Section title="基础属性">
            <PropInput label="名称" value={node.name} onChange={(v) => st.updateNodeName(node.id, v)} />
            <div className="grid grid-cols-2 gap-1">
              <PropNumber label="X" value={node.props.x} onChange={(v) => updateProp("x", v)} />
              <PropNumber label="Y" value={node.props.y} onChange={(v) => updateProp("y", v)} />
              <PropNumber label="宽度" value={node.props.width} onChange={(v) => updateProp("width", v)} min={1} />
              <PropNumber label="高度" value={node.props.height} onChange={(v) => updateProp("height", v)} min={1} />
            </div>
            <div className="grid grid-cols-2 gap-1">
              <PropNumber label="透明度" value={node.props.opacity ?? 1} onChange={(v) => updateProp("opacity", v)} min={0} max={1} step={0.1} />
              <PropNumber label="旋转" value={node.props.rotation ?? 0} onChange={(v) => updateProp("rotation", v)} />
            </div>
            <PropNumber label="Z-Index" value={node.props.zIndex ?? 20} onChange={(v) => updateProp("zIndex", v)} step={1} min={0} />
          </Section>

          {node.type === "image" && (
            <Section title="图片属性">
              <AssetSelector label="素材" assetId={node.props.assetId as string} onChange={(v) => updateProp("assetId", v)} />
              <PropSelect label="填充模式" value={node.props.fillMode || "contain"} options={FILL_MODE_OPTIONS} onChange={(v) => updateProp("fillMode", v)} />
              {node.props.fillMode && ["repeat-x", "repeat-y", "repeat"].includes(node.props.fillMode) && (
                <div className="grid grid-cols-2 gap-1">
                  <PropNumber label="单元格宽" value={node.props.tileWidth ?? 100} onChange={(v) => updateProp("tileWidth", v)} min={1} />
                  <PropNumber label="单元格高" value={node.props.tileHeight ?? 100} onChange={(v) => updateProp("tileHeight", v)} min={1} />
                </div>
              )}
              <PropToggle label="九宫格裁切" value={!!node.props.nineSliceEnabled} onChange={(v) => updateProp("nineSliceEnabled", v)} />
              {node.props.nineSliceEnabled && (
                <>
                  <div className="text-[11px] text-fg-muted my-1 px-1.5 py-1 bg-ink-800 rounded leading-relaxed">4条分割线切为9块，角不缩放，中间平铺</div>
                  <div className="grid grid-cols-2 gap-1">
                    <PropNumber label="左边距" value={node.props.sliceLeft ?? 0} onChange={(v) => updateProp("sliceLeft", v)} min={0} />
                    <PropNumber label="右边距" value={node.props.sliceRight ?? 0} onChange={(v) => updateProp("sliceRight", v)} min={0} />
                  </div>
                  <div className="grid grid-cols-2 gap-1">
                    <PropNumber label="上边距" value={node.props.sliceTop ?? 0} onChange={(v) => updateProp("sliceTop", v)} min={0} />
                    <PropNumber label="下边距" value={node.props.sliceBottom ?? 0} onChange={(v) => updateProp("sliceBottom", v)} min={0} />
                  </div>
                </>
              )}
            </Section>
          )}

          {node.type === "text" && (
            <Section title="文本属性">
              <PropTextarea label="内容" value={node.props.content || ""} onChange={(v) => updateProp("content", v)} />
              <div className="grid grid-cols-2 gap-1">
                <PropNumber label="字号" value={node.props.fontSize} onChange={(v) => updateProp("fontSize", v)} min={8} max={200} />
                <PropNumber label="行高" value={node.props.lineHeight || 1.5} onChange={(v) => updateProp("lineHeight", v)} min={0.5} max={5} step={0.1} />
              </div>
              <div className="grid grid-cols-2 gap-1">
                <ColorInput label="颜色" value={node.props.color} onChange={(v) => updateProp("color", v)} />
                <ColorInput label="描边色" value={node.props.strokeColor} onChange={(v) => updateProp("strokeColor", v)} />
              </div>
              <div className="grid grid-cols-2 gap-1">
                <PropSelect label="对齐" value={node.props.textAlign || "left"} options={ALIGN_OPTIONS} onChange={(v) => updateProp("textAlign", v)} />
                <PropNumber label="描边宽" value={node.props.strokeWidth || 0} onChange={(v) => updateProp("strokeWidth", v)} min={0} />
              </div>
            </Section>
          )}

          {node.type === "container" && (
            <>
              <Section title="容器属性">
                <ColorInput label="背景色" value={node.props.backgroundColor} onChange={(v) => updateProp("backgroundColor", v)} />
                <PropToggle label="裁剪溢出" value={!!node.props.clip} onChange={(v) => updateProp("clip", v)} />
              </Section>
              <Section title="子控件管理">
                {node.children.length > 0 ? (
                  <div className="mb-1.5">
                    <div className="text-[11px] text-fg-muted mb-1">容器内控件（点击移除）：</div>
                    <div className="flex flex-col gap-0.5">
                      {node.children.map((child) => (
                        <div key={child.id} className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-ink-800 cursor-pointer text-[11px] hover:bg-ink-900" onClick={() => st.removeFromContainer(child.id, node.id)}>
                          <span className="text-danger w-3 shrink-0">−</span>
                          <span className="flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-fg">{child.name}</span>
                          <span className="text-fg-muted shrink-0">({child.type})</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-[11px] text-fg-muted italic mb-1.5 px-1">容器为空</div>
                )}
                <div className="text-[11px] text-fg-muted mb-1">从根容器选择控件加入此容器：</div>
                <div className="max-h-[140px] overflow-y-auto flex flex-col gap-0.5">
                  {availableChildren.map((cand) => (
                    <div key={cand.id} className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-ink-800 cursor-pointer text-[11px] hover:bg-ink-900" onClick={() => st.moveToContainer(cand.id, node.id)}>
                      <span className="text-[#3b82f6] w-3 shrink-0">+</span>
                      <span className="flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-fg">{cand.name}</span>
                      <span className="text-fg-muted shrink-0">({cand.type})</span>
                    </div>
                  ))}
                  {availableChildren.length === 0 && <div className="text-[11px] text-fg-muted italic px-1">根容器中没有其他控件可添加</div>}
                </div>
                <div className="text-[11px] text-fg-muted mt-1">当前子控件数: {node.children.length}</div>
              </Section>
            </>
          )}

          {node.type === "button" && (
            <Section title="按钮属性">
              <AssetSelector label="常态素材" assetId={node.props.normalAssetId as string} onChange={(v) => updateProp("normalAssetId", v)} />
              <AssetSelector label="悬浮素材" assetId={node.props.hoverAssetId as string} onChange={(v) => updateProp("hoverAssetId", v)} />
              <AssetSelector label="按下素材" assetId={node.props.pressedAssetId as string} onChange={(v) => updateProp("pressedAssetId", v)} />
              <AssetSelector label="禁用素材" assetId={node.props.disabledAssetId as string} onChange={(v) => updateProp("disabledAssetId", v)} />
              <PropToggle label="禁用状态" value={!!node.props.disabled} onChange={(v) => updateProp("disabled", v)} />
            </Section>
          )}

          {node.type === "progress" && (
            <Section title="进度条属性">
              <AssetSelector label="背景素材" assetId={node.props.bgAssetId as string} onChange={(v) => updateProp("bgAssetId", v)} />
              <AssetSelector label="填充素材" assetId={node.props.fillAssetId as string} onChange={(v) => updateProp("fillAssetId", v)} />
              <div className="grid grid-cols-2 gap-1">
                <PropNumber label="当前值" value={node.props.currentValue} onChange={(v) => updateProp("currentValue", v)} min={0} />
                <PropNumber label="最大值" value={node.props.maxValue} onChange={(v) => updateProp("maxValue", v)} min={1} />
              </div>
              <PropSelect label="填充方向" value={node.props.fillDirection || "left-to-right"} options={DIRECTION_OPTIONS} onChange={(v) => updateProp("fillDirection", v)} />
            </Section>
          )}

          {node.type !== "container" && (
            <Section title="事件绑定">
              {node.events.map((event, idx) => (
                <div key={idx} className="border border-ink-700 rounded p-1.5 mb-1.5">
                  <div className="flex items-center justify-between mb-1 gap-1">
                    <PropSelect label="触发" value={event.trigger} options={TRIGGER_OPTIONS} onChange={(v) => st.updateEvent(node.id, idx, { ...event, trigger: v as any })} />
                    <button className="border-none bg-none text-danger text-[11px] cursor-pointer hover:text-[#dc2626]" onClick={() => st.removeEvent(node.id, idx)}>删除</button>
                  </div>
                  <div className="text-[11px] text-fg-muted mb-0.5">动作({event.action ? 1 : 0})</div>
                  {event.action && (
                    <div className="text-[11px] bg-ink-800 rounded px-1 py-0.5 mb-0.5 flex items-center gap-1">
                      <span className="text-[#3b82f6]">{event.action.type}</span>
                      <span className="text-fg-muted">→</span>
                      <span className="text-fg overflow-hidden text-ellipsis whitespace-nowrap">{st.findNodeById(event.action.targetId || "")?.name || event.action.targetId || "-"}</span>
                    </div>
                  )}
                </div>
              ))}
              {node.events.length < 4 && (
                <button className="w-full py-1 text-[11px] text-[#3b82f6] border border-dashed border-ink-700 rounded bg-transparent cursor-pointer hover:bg-ink-800" onClick={() => st.addEvent(node.id, { trigger: "click", action: { type: "toggle", targetId: "" } })}>
                  + 添加事件
                </button>
              )}
            </Section>
          )}
        </>
      )}

      <ConfirmDialog
        open={tip.open}
        title={tip.title}
        message={tip.msg}
        confirmText="确定"
        hideActions
        onConfirm={() => setTip({ open: false, title: "", msg: "" })}
        onCancel={() => setTip({ open: false, title: "", msg: "" })}
      >
        <div className="flex items-center justify-end pt-2">
          <button className="btn-primary h-9 px-5 text-sm" onClick={() => setTip({ open: false, title: "", msg: "" })}>确定</button>
        </div>
      </ConfirmDialog>
    </div>
  );
}
