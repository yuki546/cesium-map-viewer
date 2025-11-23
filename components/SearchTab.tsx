import { FormEvent } from "react";

type SearchResultItem = {
  id: string;
  displayName: string;
  lat: number;
  lon: number;
};

export type SearchTabProps = {
  query: string;
  loading: boolean;
  error: string | null;
  results: SearchResultItem[];
  onChangeQuery: (value: string) => void;
  onSubmitSearch: (event: FormEvent<HTMLFormElement>) => void;
  onSelectResult: (id: string) => void;
};

export function SearchTab({
  query,
  loading,
  error,
  results,
  onChangeQuery,
  onSubmitSearch,
  onSelectResult,
}: SearchTabProps) {
  return (
    <div className="space-y-4 text-xs text-slate-500">
      {/* 検索フォーム */}
      <form className="space-y-3" onSubmit={onSubmitSearch}>
        <div>
          <div className="mb-2 text-xs font-semibold text-slate-500">
            建物・エリア名で検索
          </div>
          <input
            value={query}
            onChange={(event) => {
              onChangeQuery(event.target.value);
            }}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-inner focus:border-sky-500 focus:outline-none"
            placeholder="例: 東京タワー"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-sky-500 py-2 text-sm font-semibold text-white shadow transition hover:bg-sky-600"
        >
          {loading ? "検索中..." : "入力内容で移動"}
        </button>
      </form>
      {/* エラーメッセージ */}
      {error && <p className="text-[0.7rem] text-red-500">{error}</p>}

      {!error && !loading && results.length === 0 && (
        <p className="text-[0.7rem] text-slate-400">
          OpenStreetMap Nominatim を使用して検索します。
        </p>
      )}

      {/* 検索結果リスト */}
      {results.length > 0 && (
        <div className="space-y-2">
          <div className="text-xs font-semibold text-slate-500">検索結果</div>
          <div className="space-y-2">
            {results.map((result) => (
              <button
                key={result.id}
                type="button"
                onClick={() => onSelectResult(result.id)}
                className="w-full rounded-lg border border-slate-200 px-4 py-3 text-left text-slate-600 transition hover:border-sky-300 hover:text-sky-600"
              >
                <span className="block text-sm font-semibold text-slate-700">
                  {result.displayName}
                </span>
                <span className="mt-1 block text-[0.7rem] text-slate-500">
                  {`${result.lat.toFixed(5)}, ${result.lon.toFixed(5)}`}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
