"use client";
import {
  Cartesian3,
  Viewer as CesiumViewerType,
  Math as CesiumMath,
  Ion,
  Cartographic,
  EllipsoidTerrainProvider,
  createWorldImageryAsync,
  IonWorldImageryStyle,
  Cesium3DTileset,
  CesiumTerrainProvider,
} from "cesium";
import {
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Viewer as ResiumViewer } from "resium";
import type { CesiumComponentRef } from "resium";
import {
  CameraTab,
  type CameraFormState,
  type CameraBookmark,
} from "./CameraTab";
import { LayersTab } from "./LayersTab";

Ion.defaultAccessToken = process.env.NEXT_PUBLIC_CESIUM_ION_TOKEN || "";

const SIDEBAR_TABS = [
  { id: "camera" as const, label: "カメラ" },
  { id: "layers" as const, label: "レイヤー" },
  { id: "search" as const, label: "検索" },
];

const DEFAULT_CAMERA_STATE = {
  lon: "139.6917",
  lat: "35.6895",
  height: "3000",
  heading: "0",
  pitch: "-90",
  roll: "0",
} as const;

const NOMINATIM_RESULT_LIMIT = "10";

const DEFAULT_VIEW_DESTINATION = {
  lon: 139.6917,
  lat: 35.6895,
  height: 20_000_000,
} as const;

const DEFAULT_ORIENTATION = {
  heading: 0,
  pitch: -Math.PI / 2,
  roll: 0,
} as const;

type ViewerTabId = (typeof SIDEBAR_TABS)[number]["id"];
type BoundingBox = readonly [number, number, number, number];

type CameraOrientation = {
  heading: number;
  pitch: number;
  roll: number;
};

type CameraDestination = {
  lon: number;
  lat: number;
  height: number;
};

type ParsedCameraState = CameraDestination & CameraOrientation;

const TOKYO_TIMESTAMP_FORMATTER = new Intl.DateTimeFormat("ja-JP", {
  timeZone: "Asia/Tokyo",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
});

function formatTokyoTimestamp(date: Date): string {
  return TOKYO_TIMESTAMP_FORMATTER.format(date);
}

type SearchResult = {
  id: string;
  displayName: string;
  lat: number;
  lon: number;
  boundingBox?: BoundingBox;
};

type CesiumTilesetRef = { current: Cesium3DTileset | null };

function parseIonAssetId(
  envValue: string | undefined,
  fallback: number
): number {
  const parsed = envValue ? Number(envValue) : Number.NaN;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function computeHeightFromBoundingBox(boundingBox?: BoundingBox): number {
  if (!boundingBox) {
    return 1_200;
  }

  const [south, north, west, east] = boundingBox;
  const latDiff = Math.abs(north - south);
  const lonDiff = Math.abs(east - west);
  const dominantDiff = Math.max(latDiff, lonDiff);

  if (!Number.isFinite(dominantDiff) || dominantDiff === 0) {
    return 1_200;
  }

  const approxMeters = dominantDiff * 111_000;
  const scaled = approxMeters * 3;
  return Math.min(Math.max(scaled, 500), 2_000_000);
}

function parseCameraFormValues(
  form: CameraFormState
): ParsedCameraState | null {
  const lon = Number(form.lon);
  const lat = Number(form.lat);
  const height = Number(form.height);
  const heading = Number(form.heading);
  const pitch = Number(form.pitch);
  const roll = Number(form.roll);

  if (
    [lon, lat, height, heading, pitch, roll].some((value) =>
      Number.isNaN(value)
    )
  ) {
    return null;
  }

  return { lon, lat, height, heading, pitch, roll };
}

function removeTileset(viewer: CesiumViewerType, ref: CesiumTilesetRef) {
  const tileset = ref.current;
  if (!tileset) return;

  viewer.scene.primitives.remove(tileset);

  if (typeof tileset.isDestroyed === "function" && !tileset.isDestroyed()) {
    tileset.destroy();
  }

  ref.current = null;
  viewer.scene.requestRender();
}

function destroyTerrainProvider(provider: CesiumTerrainProvider | null) {
  if (!provider) return;

  const destroyable = provider as CesiumTerrainProvider & {
    destroy?: () => void;
    isDestroyed?: () => boolean;
  };

  if (typeof destroyable.destroy !== "function") {
    return;
  }

  if (
    typeof destroyable.isDestroyed === "function" &&
    destroyable.isDestroyed()
  ) {
    return;
  }

  destroyable.destroy();
}

export default function CesiumViewer() {
  const viewerRef = useRef<CesiumComponentRef<CesiumViewerType> | null>(null);
  const [viewerReady, setViewerReady] = useState(false);

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<ViewerTabId>("camera");

  const [cameraForm, setCameraForm] = useState<CameraFormState>(() => ({
    ...DEFAULT_CAMERA_STATE,
  }));

  const [cameraBookmarks, setCameraBookmarks] = useState<CameraBookmark[]>([]);
  const [gotoError, setGotoError] = useState("");

  const [buildingEnabled, setBuildingEnabled] = useState(false);
  const [buildingLoading, setBuildingLoading] = useState(false);
  const [buildingError, setBuildingError] = useState<string | null>(null);

  const [terrainEnabled, setTerrainEnabled] = useState(false);
  const [terrainLoading, setTerrainLoading] = useState(false);
  const [terrainError, setTerrainError] = useState<string | null>(null);

  const buildingTilesetRef = useRef<Cesium3DTileset | null>(null);
  const terrainProviderRef = useRef<CesiumTerrainProvider | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const buildingAssetId = useMemo(
    () =>
      parseIonAssetId(process.env.NEXT_PUBLIC_ION_ASSET_ID_BUILDINGS, 96_188),
    []
  );

  const terrainAssetId = useMemo(
    () => parseIonAssetId(process.env.NEXT_PUBLIC_ION_ASSET_ID_TERRAIN, 75_343),
    []
  );

  const handleViewerRef = useCallback(
    (ref: CesiumComponentRef<CesiumViewerType> | null) => {
      viewerRef.current = ref;
      setViewerReady(Boolean(ref?.cesiumElement));
    },
    []
  );

  const flyTo = useCallback(
    (viewer: CesiumViewerType, target: ParsedCameraState) => {
      viewer.camera.flyTo({
        destination: Cartesian3.fromDegrees(
          target.lon,
          target.lat,
          target.height
        ),
        orientation: {
          heading: CesiumMath.toRadians(target.heading),
          pitch: CesiumMath.toRadians(target.pitch),
          roll: CesiumMath.toRadians(target.roll),
        },
      });
    },
    []
  );

  const handleMove = useCallback(
    (event?: FormEvent) => {
      event?.preventDefault();
      const viewer = viewerRef.current?.cesiumElement;
      if (!viewer) {
        setGotoError("ビューアーの初期化をお待ちください。");
        return;
      }

      const parsed = parseCameraFormValues(cameraForm);
      if (!parsed) {
        setGotoError("数値を入力してください。");
        return;
      }

      setGotoError("");

      try {
        flyTo(viewer, parsed);
      } catch (error) {
        console.error("[Camera] flyTo error", error);
        setGotoError("移動に失敗しました。");
      }
    },
    [cameraForm, flyTo]
  );

  const handleSaveCameraBookmark = useCallback(() => {
    setCameraBookmarks((previous) => {
      const bookmark = {
        id: `${Date.now().toString(36)}-${Math.random()
          .toString(36)
          .slice(2, 8)}`,
        state: { ...cameraForm },
        savedAt: formatTokyoTimestamp(new Date()),
      };

      return [bookmark, ...previous].slice(0, 3);
    });
  }, [cameraForm]);

  const handleLoadCameraBookmark = useCallback((bookmark: CameraBookmark) => {
    setCameraForm({ ...bookmark.state });
  }, []);

  const handleGoHome = useCallback(() => {
    setCameraForm({ ...DEFAULT_CAMERA_STATE });

    const viewer = viewerRef.current?.cesiumElement;
    if (!viewer) return;

    const defaultParsed = parseCameraFormValues({
      ...DEFAULT_CAMERA_STATE,
    });

    if (!defaultParsed) {
      return;
    }

    setGotoError("");

    try {
      flyTo(viewer, defaultParsed);
    } catch (error) {
      console.error("[Camera] flyTo home error", error);
      setGotoError("移動に失敗しました。");
    }
  }, [flyTo]);

  const flyToSearchResult = useCallback((result: SearchResult) => {
    const viewer = viewerRef.current?.cesiumElement;
    if (!viewer) {
      setSearchError("ビューアーの初期化をお待ちください。");
      return;
    }

    setSearchError(null);

    try {
      viewer.camera.flyTo({
        destination: Cartesian3.fromDegrees(
          result.lon,
          result.lat,
          computeHeightFromBoundingBox(result.boundingBox)
        ),
        orientation: {
          heading: CesiumMath.toRadians(0),
          pitch: -Math.PI / 2,
          roll: 0,
        },
      });
    } catch (error) {
      console.error("[Search] flyTo error", error);
      setSearchError("移動に失敗しました。");
    }
  }, []);

  const handleCaptureCurrentView = useCallback(() => {
    const viewer = viewerRef.current?.cesiumElement;
    if (!viewer) return;

    const { camera } = viewer;
    const cartographic = Cartographic.fromCartesian(camera.positionWC);

    setCameraForm({
      lon: CesiumMath.toDegrees(cartographic.longitude).toFixed(6),
      lat: CesiumMath.toDegrees(cartographic.latitude).toFixed(6),
      height: cartographic.height.toFixed(2),
      heading: CesiumMath.toDegrees(camera.heading).toFixed(2),
      pitch: CesiumMath.toDegrees(camera.pitch).toFixed(2),
      roll: CesiumMath.toDegrees(camera.roll).toFixed(2),
    });
  }, []);

  const performSearch = useCallback(
    async (query: string): Promise<SearchResult[] | null> => {
      const trimmed = query.trim();
      if (!trimmed) {
        setSearchResults([]);
        setSearchError("検索キーワードを入力してください。");
        return null;
      }

      setSearchLoading(true);
      setSearchError(null);

      try {
        const params = new URLSearchParams({
          format: "jsonv2",
          q: trimmed,
          "accept-language": "ja",
          addressdetails: "1",
          limit: NOMINATIM_RESULT_LIMIT,
        });

        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?${params.toString()}`,
          {
            headers: {
              "Accept-Language": "ja",
            },
          }
        );

        if (!response.ok) {
          throw new Error(`Nominatim request failed: ${response.status}`);
        }

        const rawResults = (await response.json()) as Array<{
          place_id: number | string;
          display_name: string;
          lat: string;
          lon: string;
          boundingbox?: [string, string, string, string];
        }>;

        if (!Array.isArray(rawResults) || rawResults.length === 0) {
          setSearchResults([]);
          setSearchError("該当する場所がありません。");
          return null;
        }

        const mappedResults = rawResults.reduce<SearchResult[]>((acc, item) => {
          const lat = Number.parseFloat(item.lat);
          const lon = Number.parseFloat(item.lon);

          if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
            return acc;
          }

          let boundingBox: BoundingBox | undefined;
          if (item.boundingbox) {
            const [south, north, west, east] = item.boundingbox;
            const parsedBox = [
              Number.parseFloat(south),
              Number.parseFloat(north),
              Number.parseFloat(west),
              Number.parseFloat(east),
            ] as const;

            if (parsedBox.every((value) => Number.isFinite(value))) {
              boundingBox = parsedBox;
            }
          }

          acc.push({
            id: String(item.place_id),
            displayName: item.display_name,
            lat,
            lon,
            boundingBox,
          });
          return acc;
        }, []);

        if (mappedResults.length === 0) {
          setSearchResults([]);
          setSearchError("検索結果の解析に失敗しました。");
          return null;
        }

        setSearchResults(mappedResults);
        return mappedResults;
      } catch (error) {
        console.error("[Search] performSearch error", error);
        setSearchError("検索中にエラーが発生しました。");
        return null;
      } finally {
        setSearchLoading(false);
      }
    },
    []
  );

  const handleSearchSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const results = await performSearch(searchQuery);
      if (results && results[0]) {
        flyToSearchResult(results[0]);
      }
    },
    [performSearch, searchQuery, flyToSearchResult]
  );

  useEffect(() => {
    if (!viewerReady) return;
    const viewer = viewerRef.current?.cesiumElement;
    if (!viewer) return;

    viewer.imageryLayers.removeAll();
    viewer.terrainProvider = new EllipsoidTerrainProvider();

    (async () => {
      try {
        const provider = await createWorldImageryAsync({
          style: IonWorldImageryStyle.AERIAL_WITH_LABELS,
        });
        viewer.imageryLayers.addImageryProvider(provider);
      } catch (error) {
        console.error("[Imagery] ion world imagery error", error);
      } finally {
        viewer.camera.setView({
          destination: Cartesian3.fromDegrees(
            DEFAULT_VIEW_DESTINATION.lon,
            DEFAULT_VIEW_DESTINATION.lat,
            DEFAULT_VIEW_DESTINATION.height
          ),
          orientation: DEFAULT_ORIENTATION,
        });
        viewer.scene.requestRender();
      }
    })();
  }, [viewerReady]);

  useEffect(() => {
    if (!viewerReady) return;
    const viewer = viewerRef.current?.cesiumElement;
    if (!viewer) return;

    let cancelled = false;

    const toggleBuilding = async () => {
      if (!buildingEnabled) {
        setBuildingError(null);
        setBuildingLoading(false);
        removeTileset(viewer, buildingTilesetRef);
        return;
      }

      if (buildingTilesetRef.current) return;

      setBuildingError(null);
      setBuildingLoading(true);

      try {
        const tileset = await Cesium3DTileset.fromIonAssetId(buildingAssetId, {
          show: true,
        });
        if (cancelled) {
          tileset.destroy();
          return;
        }

        buildingTilesetRef.current = viewer.scene.primitives.add(tileset);
        viewer.scene.requestRender();
      } catch (error) {
        console.error("[Layers] building tileset error", error);
        if (!cancelled) {
          setBuildingError("建物レイヤーの読み込みに失敗しました。");
        }
      } finally {
        if (!cancelled) {
          setBuildingLoading(false);
        }
      }
    };

    toggleBuilding();

    return () => {
      cancelled = true;
    };
  }, [buildingEnabled, buildingAssetId, viewerReady]);

  useEffect(() => {
    if (!viewerReady) return;
    const viewer = viewerRef.current?.cesiumElement;
    if (!viewer) return;

    let cancelled = false;

    const toggleTerrain = async () => {
      if (!terrainEnabled) {
        setTerrainError(null);
        setTerrainLoading(false);
        if (viewer.terrainProvider !== terrainProviderRef.current) {
          return;
        }

        viewer.terrainProvider = new EllipsoidTerrainProvider();
        const previousProvider = terrainProviderRef.current;
        terrainProviderRef.current = null;
        destroyTerrainProvider(previousProvider);
        viewer.scene.requestRender();
        return;
      }

      if (terrainProviderRef.current) return;

      setTerrainError(null);
      setTerrainLoading(true);

      try {
        const provider = await CesiumTerrainProvider.fromIonAssetId(
          terrainAssetId
        );
        if (cancelled) {
          destroyTerrainProvider(provider);
          return;
        }

        terrainProviderRef.current = provider;
        viewer.terrainProvider = provider;
        viewer.scene.requestRender();
      } catch (error) {
        console.error("[Layers] terrain provider error", error);
        if (!cancelled) {
          setTerrainError("地形データの読み込みに失敗しました。");
        }
      } finally {
        if (!cancelled) {
          setTerrainLoading(false);
        }
      }
    };

    toggleTerrain();

    return () => {
      cancelled = true;
    };
  }, [terrainEnabled, terrainAssetId, viewerReady]);

  useEffect(() => {
    return () => {
      const viewer = viewerRef.current?.cesiumElement;
      if (!viewer) return;

      if (buildingTilesetRef.current) {
        removeTileset(viewer, buildingTilesetRef);
      }

      if (terrainProviderRef.current) {
        viewer.terrainProvider = new EllipsoidTerrainProvider();
        const previousProvider = terrainProviderRef.current;
        terrainProviderRef.current = null;
        destroyTerrainProvider(previousProvider);
        viewer.scene.requestRender();
      }
    };
  }, []);

  return (
    <div className="relative h-screen w-full overflow-hidden bg-slate-900 text-slate-900">
      <ResiumViewer ref={handleViewerRef} className="h-full w-full" />
      <div className="pointer-events-none absolute inset-0 z-20 flex">
        <div
          className={`pointer-events-auto relative flex h-full w-80 flex-col border-r-5 border-sky-500 bg-white/95 shadow-xl backdrop-blur transition-transform duration-300 ${
            sidebarOpen ? "translate-x-0" : "-translate-x-[calc(100%)]"
          }`}
        >
          <button
            type="button"
            onClick={() => setSidebarOpen((prev) => !prev)}
            className="absolute -right-[45px] top-6 flex h-10 w-10 items-center justify-center rounded-r-lg bg-white/95 text-slate-700 shadow-lg transition hover:bg-white"
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

          <div className="flex-1 overflow-y-auto px-5 py-4 text-slate-700">
            {activeTab === "camera" && (
              <CameraTab
                form={cameraForm}
                gotoError={gotoError}
                bookmarks={cameraBookmarks}
                onChangeField={(field, value) =>
                  setCameraForm((previous) => ({
                    ...previous,
                    [field]: value,
                  }))
                }
                onSubmitMove={handleMove}
                onGoHome={handleGoHome}
                onCaptureCurrentView={handleCaptureCurrentView}
                onSaveBookmark={handleSaveCameraBookmark}
                onLoadBookmark={handleLoadCameraBookmark}
              />
            )}

            {activeTab === "layers" && (
              <LayersTab
                buildingEnabled={buildingEnabled}
                buildingLoading={buildingLoading}
                buildingError={buildingError}
                terrainEnabled={terrainEnabled}
                terrainLoading={terrainLoading}
                terrainError={terrainError}
                onChangeBuildingEnabled={setBuildingEnabled}
                onChangeTerrainEnabled={setTerrainEnabled}
              />
            )}

            {activeTab === "search" && (
              <div className="space-y-4 text-xs text-slate-500">
                <form className="space-y-3" onSubmit={handleSearchSubmit}>
                  <div>
                    <div className="mb-2 text-xs font-semibold text-slate-500">
                      建物・エリア名で検索
                    </div>
                    <input
                      value={searchQuery}
                      onChange={(event) => {
                        setSearchQuery(event.target.value);
                        setSearchError(null);
                      }}
                      className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-inner focus:border-sky-500 focus:outline-none"
                      placeholder="例: 東京タワー"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={searchLoading}
                    className="w-full rounded-md bg-sky-500 py-2 text-sm font-semibold text-white shadow transition hover:bg-sky-600"
                  >
                    {searchLoading ? "検索中..." : "入力内容で移動"}
                  </button>
                </form>

                {searchError && (
                  <p className="text-[0.7rem] text-red-500">{searchError}</p>
                )}

                {!searchError &&
                  !searchLoading &&
                  searchResults.length === 0 && (
                    <p className="text-[0.7rem] text-slate-400">
                      OpenStreetMap Nominatim を使用して検索します。
                    </p>
                  )}

                {searchResults.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-xs font-semibold text-slate-500">
                      検索結果
                    </div>
                    <div className="space-y-2">
                      {searchResults.map((result) => (
                        <button
                          key={result.id}
                          type="button"
                          onClick={() => flyToSearchResult(result)}
                          className="w-full rounded-lg border border-slate-200 px-4 py-3 text-left text-slate-600 transition hover:border-sky-300 hover:text-sky-600"
                        >
                          <span className="block text-sm font-semibold text-slate-700">
                            {result.displayName}
                          </span>
                          <span className="mt-1 block text-[0.7rem] text-slate-500">
                            {`${result.lat.toFixed(5)}, ${result.lon.toFixed(
                              5
                            )}`}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
