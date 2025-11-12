"use client";
import { Viewer as CesiumViewerType, Ion } from "cesium";
import { useCallback, useRef, useState } from "react";
import { Viewer as ResiumViewer } from "resium";
import type { CesiumComponentRef } from "resium";

export default function CesiumViewer() {
  const viewerRef = useRef<CesiumComponentRef<CesiumViewerType> | null>(null);
  const [viewerReady, setViewerReady] = useState(false);

  const [sidebarOpen, setSidebarOpen] = useState(true);

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
        </div>
      </div>
    </div>
  );
}
