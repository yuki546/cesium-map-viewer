import { ChangeEvent, FormEvent } from "react";

export type CameraFormState = {
  lon: string;
  lat: string;
  height: string;
  heading: string;
  pitch: string;
  roll: string;
};

export type CameraBookmark = {
  id: string;
  state: CameraFormState;
  savedAt: string;
};

export type Props = {
  form: CameraFormState;
  gotoError: string;
  bookmarks: CameraBookmark[];
  onChangeField: (field: keyof CameraFormState, value: string) => void;
  onSubmitMove: (event: FormEvent<HTMLFormElement>) => void;
  onGoHome: () => void;
  onCaptureCurrentView: () => void;
  onSaveBookmark: () => void;
  onLoadBookmark: (bookmark: CameraBookmark) => void;
};

export function CameraTab({
  form,
  gotoError,
  bookmarks,
  onChangeField,
  onSubmitMove,
  onGoHome,
  onCaptureCurrentView,
  onSaveBookmark,
  onLoadBookmark,
}: Props) {
  const { lon, lat, height, heading, pitch, roll } = form;

  const handleInputChange =
    (field: keyof CameraFormState) =>
    (event: ChangeEvent<HTMLInputElement>) => {
      onChangeField(field, event.target.value);
    };

  return (
    <form className="space-y-4" onSubmit={onSubmitMove}>
      <div>
        <div className="mb-2 text-xs font-semibold text-slate-500">
          カメラ位置
        </div>
        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col text-xs">
            <span className="mb-1 text-[0.7rem] uppercase tracking-wide text-slate-500">
              Lon (経度)
            </span>
            <input
              value={lon}
              onChange={handleInputChange("lon")}
              className="rounded-md border border-slate-300 px-2 py-2 text-sm text-slate-900 shadow-inner focus:border-sky-500 focus:outline-none"
              inputMode="decimal"
            />
          </label>
          <label className="flex flex-col text-xs">
            <span className="mb-1 text-[0.7rem] uppercase tracking-wide text-slate-500">
              Lat (緯度)
            </span>
            <input
              value={lat}
              onChange={handleInputChange("lat")}
              className="rounded-md border border-slate-300 px-2 py-2 text-sm text-slate-900 shadow-inner focus:border-sky-500 focus:outline-none"
              inputMode="decimal"
            />
          </label>
          <label className="flex flex-col text-xs">
            <span className="mb-1 text-[0.7rem] uppercase tracking-wide text-slate-500">
              Height (m)
            </span>
            <input
              value={height}
              onChange={handleInputChange("height")}
              className="rounded-md border border-slate-300 px-2 py-2 text-sm text-slate-900 shadow-inner focus:border-sky-500 focus:outline-none"
              inputMode="decimal"
            />
          </label>
        </div>
      </div>

      <div>
        <div className="mb-2 text-xs font-semibold text-slate-500">向き</div>
        <div className="grid grid-cols-3 gap-3">
          <label className="flex flex-col text-xs">
            <span className="mb-1 text-[0.7rem] uppercase tracking-wide text-slate-500">
              Heading
            </span>
            <input
              value={heading}
              onChange={handleInputChange("heading")}
              className="rounded-md border border-slate-300 px-2 py-2 text-sm text-slate-900 shadow-inner focus:border-sky-500 focus:outline-none"
              inputMode="decimal"
            />
          </label>
          <label className="flex flex-col text-xs">
            <span className="mb-1 text-[0.7rem] uppercase tracking-wide text-slate-500">
              Pitch
            </span>
            <input
              value={pitch}
              onChange={handleInputChange("pitch")}
              className="rounded-md border border-slate-300 px-2 py-2 text-sm text-slate-900 shadow-inner focus:border-sky-500 focus:outline-none"
              inputMode="decimal"
            />
          </label>
          <label className="flex flex-col text-xs">
            <span className="mb-1 text-[0.7rem] uppercase tracking-wide text-slate-500">
              Roll
            </span>
            <input
              value={roll}
              onChange={handleInputChange("roll")}
              className="rounded-md border border-slate-300 px-2 py-2 text-sm text-slate-900 shadow-inner focus:border-sky-500 focus:outline-none"
              inputMode="decimal"
            />
          </label>
        </div>
      </div>

      {gotoError && <p className="text-xs text-red-500">{gotoError}</p>}

      <div className="grid grid-cols-2 gap-3">
        <button
          type="submit"
          className="rounded-md bg-sky-500 py-2 text-sm font-semibold text-white shadow transition hover:bg-sky-600"
        >
          移動
        </button>
        <button
          type="button"
          onClick={onGoHome}
          className="rounded-md border border-slate-300 py-2 text-sm font-semibold text-slate-700 transition hover:border-sky-300 hover:text-sky-600"
        >
          ホームへ
        </button>
        <button
          type="button"
          onClick={onCaptureCurrentView}
          className="col-span-2 rounded-md border border-slate-300 py-2 text-sm font-semibold text-slate-700 transition hover:border-sky-300 hover:text-sky-600"
        >
          現在の視点を読み込み
        </button>
        <button
          type="button"
          onClick={onSaveBookmark}
          className="col-span-2 rounded-md border border-dashed border-slate-300 py-2 text-sm font-semibold text-slate-700 transition hover:border-sky-500 hover:text-sky-600"
        >
          一時保存
        </button>
      </div>

      {bookmarks.length > 0 && (
        <div className="space-y-2">
          <div className="text-xs font-semibold text-slate-500">
            一時保存した視点
          </div>
          <div className="flex flex-col gap-2">
            {bookmarks.map((bookmark) => (
              <button
                key={bookmark.id}
                type="button"
                onClick={() => onLoadBookmark(bookmark)}
                className="flex flex-col rounded-md border border-slate-200 px-3 py-2 text-left text-xs text-slate-600 transition hover:border-sky-300 hover:text-slate-900"
              >
                <span className="text-[0.65rem] text-slate-400">
                  保存時刻: {bookmark.savedAt}（JST）
                </span>
                <span className="text-sm font-semibold text-slate-700">
                  Lon {bookmark.state.lon}, Lat {bookmark.state.lat}
                </span>
                <span>
                  Height {bookmark.state.height}m ・ Heading{" "}
                  {bookmark.state.heading}° ・ Pitch {bookmark.state.pitch}° ・
                  Roll {bookmark.state.roll}°
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </form>
  );
}
