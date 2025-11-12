"use client";
import { Viewer as CesiumViewerType, Ion } from "cesium";
import { useCallback, useRef, useState } from "react";
import { Viewer as ResiumViewer } from "resium";
import type { CesiumComponentRef } from "resium";

export default function CesiumViewer() {
  const viewerRef = useRef<CesiumComponentRef<CesiumViewerType> | null>(null);
  const [viewerReady, setViewerReady] = useState(false);

  const handleViewerRef = useCallback(
    (ref: CesiumComponentRef<CesiumViewerType> | null) => {
      viewerRef.current = ref;
      setViewerReady(Boolean(ref?.cesiumElement));
    },
    []
  );

  return (
    <div className="relative h-screen w-full overflow-hidden bg-slate-900 text-slate-900">
      <ResiumViewer ref={handleViewerRef} className="h-full w-full" />;
    </div>
  );
}
