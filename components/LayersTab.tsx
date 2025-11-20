export type LayersTabProps = {
  buildingEnabled: boolean;
  buildingLoading: boolean;
  buildingError: string | null;
  terrainEnabled: boolean;
  terrainLoading: boolean;
  terrainError: string | null;
  onChangeBuildingEnabled: (enabled: boolean) => void;
  onChangeTerrainEnabled: (enabled: boolean) => void;
};

export function LayersTab({
  buildingEnabled,
  buildingLoading,
  buildingError,
  terrainEnabled,
  terrainLoading,
  terrainError,
  onChangeBuildingEnabled,
  onChangeTerrainEnabled,
}: LayersTabProps) {
  return (
    <div className="space-y-4 text-xs text-slate-500">
      <div className="space-y-3">
        {/* 建物レイヤー */}
        <label className="flex items-start justify-between gap-4 border border-slate-200 px-4 py-3 text-left">
          <span className="flex-1">
            <span className="block text-sm font-semibold text-slate-700">
              建物レイヤー
            </span>
            <span className="mt-1 block text-[0.7rem] text-slate-500">
              Japan 3D Building Data
            </span>
            {buildingError && (
              <span className="mt-2 block text-[0.7rem] text-red-500">
                {buildingError}
              </span>
            )}
            {buildingLoading && !buildingError && (
              <span className="mt-2 block text-[0.7rem] text-slate-400">
                読み込み中...
              </span>
            )}
          </span>
          <input
            type="checkbox"
            checked={buildingEnabled}
            onChange={(event) => onChangeBuildingEnabled(event.target.checked)}
            disabled={buildingLoading}
            className="mt-1 h-5 w-5 accent-sky-500"
          />
        </label>

        {/* 地形データ */}
        <label className="flex items-start justify-between gap-4 border border-slate-200 px-4 py-3 text-left">
          <span className="flex-1">
            <span className="block text-sm font-semibold text-slate-700">
              地形データ
            </span>
            <span className="mt-1 block text-[0.7rem] text-slate-500">
              Japan Regional Terrain
            </span>
            {terrainError && (
              <span className="mt-2 block text-[0.7rem] text-red-500">
                {terrainError}
              </span>
            )}
            {terrainLoading && !terrainError && (
              <span className="mt-2 block text-[0.7rem] text-slate-400">
                読み込み中...
              </span>
            )}
          </span>
          <input
            type="checkbox"
            checked={terrainEnabled}
            onChange={(event) => onChangeTerrainEnabled(event.target.checked)}
            disabled={terrainLoading}
            className="mt-1 h-5 w-5 accent-sky-500"
          />
        </label>
      </div>
    </div>
  );
}
