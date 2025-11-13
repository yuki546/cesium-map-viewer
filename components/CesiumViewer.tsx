"use client";
import { Viewer as CesiumViewerType, Ion } from "cesium";
import { useCallback, useRef, useState } from "react";
import { Viewer as ResiumViewer } from "resium";
import type { CesiumComponentRef } from "resium";

const SIDEBAR_TABS = [
  { id: "camera" as const, label: "カメラ" },
  { id: "layers" as const, label: "レイヤー" },
  { id: "search" as const, label: "検索" },
];

type ViewerTab = (typeof SIDEBAR_TABS)[number]["id"];

export default function CesiumViewer() {
  const viewerRef = useRef<CesiumComponentRef<CesiumViewerType> | null>(null);
  const [viewerReady, setViewerReady] = useState(false);

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<ViewerTab>("camera");

  const handleViewerRef = useCallback(
    (ref: CesiumComponentRef<CesiumViewerType> | null) => {
      viewerRef.current = ref;
      setViewerReady(Boolean(ref?.cesiumElement));
    },
    []
  );

  return (
    <div className="relative h-screen w-full overflow-hidden bg-slate-900 text-slate-900">
      <ResiumViewer ref={handleViewerRef} className="h-full w-full" />
      <div className="pointer-events-none absolute inset-0 z-20 flex">
        <div
          className={`pointer-events-auto relative flex h-full w-80 flex-col border-r-5 border-sky-500 bg-white/95 shadow-xl backdrop-blur transition-trarnsform duration-300 ${
            sidebarOpen ? "translate-x-0" : "-translate-x-[calc(100%)]"
          }`}
        >
          <button
            type="button"
            onClick={() => setSidebarOpen((prev) => !prev)}
            className="absolute -right-11.25 top-6 flex h-10 w-10 items-center justify-center rounded-r-lg bg-white/95 text-slate-700 shadow-lg transition hover:bg-white"
          >
            <span className="text-lg">{sidebarOpen ? "⟨" : "⟩"}</span>
          </button>

          <div className="flex items-center gap-2 border-b border-slate-200 px-5 py-4">
            <div className="text-xs font-semibold uppercase tracking-widest text-slate-500">
              Cesium
            </div>
            <div className="text-sm text-slate-400">Map Viewer</div>
          </div>

          <div className="flex border-b border-slate-200 px-4">
            {SIDEBAR_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 border-b-2 px-2 py-3 text-sm font-medium transition ${
                  activeTab === tab.id
                    ? "border-sky-500 text-slate-900"
                    : "border-transparent text-slate-400 hover:border-slate-200 hover:text-slate-600"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
