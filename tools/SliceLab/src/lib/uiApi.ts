// UI 系统前端 API 客户端：方案 + 模板
// 复用素材库 images 表作为素材源（assetId = images.id）
const UI_API_BASE = "/api/ui";

async function uiRequest<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${UI_API_BASE}${url}`, {
    ...init,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...(init?.headers || {}),
    },
  });
  if (!res.ok) {
    let msg = `请求失败 ${res.status}`;
    try {
      const err = await res.json();
      if (err.error) msg = err.error;
    } catch {}
    throw new Error(msg);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

// ============ Types ============
export interface UiSchemeMeta {
  id: number;
  name: string;
  description: string;
  canvas_width: number;
  canvas_height: number;
  version: number;
  created_at: string;
  updated_at: string;
}

export interface UiScheme {
  id: number;
  name: string;
  description: string;
  canvas_width: number;
  canvas_height: number;
  root_node: any;
  extra_root_nodes: any[];
  version: number;
  created_at: string;
  updated_at: string;
}

export interface ComponentTemplate {
  id: number;
  name: string;
  thumbnail: string | null;
  node_data: any;
  created_at: string;
  updated_at: string;
}

// ============ Scheme API ============
export const schemeApi = {
  list: () => uiRequest<UiSchemeMeta[]>("/schemes"),

  get: (id: number) => uiRequest<UiScheme>(`/schemes/${id}`),

  create: (data: {
    name: string;
    description?: string;
    canvasWidth?: number;
    canvasHeight?: number;
    rootNode?: any;
    extraRootNodes?: any[];
  }) =>
    uiRequest<UiScheme>("/schemes", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (
    id: number,
    data: {
      name?: string;
      description?: string;
      canvasWidth?: number;
      canvasHeight?: number;
      rootNode?: any;
      extraRootNodes?: any[];
    }
  ) =>
    uiRequest<UiScheme>(`/schemes/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  autosave: (
    id: number,
    data: {
      name?: string;
      description?: string;
      canvasWidth?: number;
      canvasHeight?: number;
      rootNode?: any;
      extraRootNodes?: any[];
    }
  ) =>
    uiRequest<UiScheme>(`/schemes/${id}/autosave`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  delete: (id: number) =>
    uiRequest<{ ok: boolean }>(`/schemes/${id}`, { method: "DELETE" }),
};

// ============ Template API ============
export const templateApi = {
  list: () => uiRequest<ComponentTemplate[]>("/templates"),

  create: (data: { name: string; nodeData: any; thumbnail?: string }) =>
    uiRequest<ComponentTemplate>("/templates", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (id: number, data: { name?: string; nodeData?: any; thumbnail?: string }) =>
    uiRequest<ComponentTemplate>(`/templates/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  delete: (id: number) =>
    uiRequest<{ ok: boolean }>(`/templates/${id}`, { method: "DELETE" }),
};

// ============ 资产 URL（复用素材库 image API） ============
/** 获取 UI 资产原图 URL（assetId 就是素材库 images.id） */
export function getUiAssetFileUrl(assetId: number, version?: string): string {
  return `/api/images/${assetId}/file${version ? `?v=${encodeURIComponent(version)}` : ""}`;
}

/** 获取 UI 资产缩略图 URL */
export function getUiAssetThumbUrl(assetId: number, version?: string): string {
  return `/api/images/${assetId}/thumbnail${version ? `?v=${encodeURIComponent(version)}` : ""}`;
}
