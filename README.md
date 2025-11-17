# map-viewer

Next.js と Cesium を組み合わせた 3D マップビューワーです。カメラ操作・レイヤー切り替え・地名検索をサイドバーから切り替えられ、東京を初期地点として世界各地へ飛行できます。

## 主な機能

- 📍 **カメラ制御** — 経度・緯度・高度・姿勢を直接入力して任意地点へ移動。現在視点の値取得や初期位置へのリセットもワンクリックで行えます。
- 🗺️ **レイヤー管理** — Cesium Ion の 3D 建物タイルと地形タイルをオンデマンドで読み込み。不要時には破棄してメモリを解放します。
- 🔎 **地名検索** — OpenStreetMap Nominatim API で候補を取得し、検索結果をクリックすると自動で該当地域へフライします。
- 🧭 **日本語 UI** — 操作メッセージやバリデーションエラーを日本語で表示し、直感的に扱えるようにしています。

## 技術スタック

- [Next.js 16](https://nextjs.org/)
- [React 19](https://react.dev/)
- [CesiumJS](https://cesium.com/platform/cesiumjs/) + [Resium](https://resium.reearth.io/)
- [Tailwind CSS 4 (preview)](https://tailwindcss.com/blog/tailwindcss-v4-alpha)

## セットアップ

1. 依存関係をインストールします。
   ```bash
   npm install
   ```
2. Cesium の静的アセットを `public/cesium` にコピーします。
   ```bash
   npm run copy-cesium
   ```
3. Cesium Ion のアクセストークンと（必要に応じて）アセット ID を `.env.local` に設定します。
   ```bash
   NEXT_PUBLIC_CESIUM_ION_TOKEN=<your-ion-token>
   # オプション: デフォルト 3D 建物 (96188) / 地形 (75343) のアセット ID を上書き
   NEXT_PUBLIC_ION_ASSET_ID_BUILDINGS=<ion-asset-id>
   NEXT_PUBLIC_ION_ASSET_ID_TERRAIN=<ion-asset-id>
   ```

## 開発用スクリプト

| コマンド              | 説明                                                                                                                                                  |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run dev`         | 開発サーバーを `http://localhost:3000` で起動します。                                                                                                 |
| `npm run build`       | 本番ビルドを生成します。ビルド前に `prebuild` により `npm run copy-cesium` が自動実行され、Cesium の静的アセットが `public/cesium` にコピーされます。 |
| `npm run start`       | 本番ビルドをローカルで実行します。                                                                                                                    |
| `npm run lint`        | ESLint で静的解析を実行します。                                                                                                                       |
| `npm run copy-cesium` | Cesium の静的アセットを `public/cesium` にコピーします（通常は `npm run build` 実行時に自動で実行されますが、手動で実行することもできます）。         |

## 使い方のヒント

- サイドバー左上のタブで「カメラ」「レイヤー」「検索」を切り替えられます。サイドバー自体も折りたたみ可能です。
- 建物・地形レイヤーは読み込みに数秒かかることがあります。ローディングインジケーターとエラーメッセージで状態を確認できます。
- 検索は Nominatim 公開 API を利用しているため、必要に応じてレートリミット対策や独自インスタンスの利用を検討してください。

## ライセンスとクレジット

- Cesium Ion アセットを使用する際は、Cesium の[利用規約](https://www.cesium.com/platform/cesium-ion/terms/)に従ってください。
- OpenStreetMap データは [OpenStreetMap Contributors](https://www.openstreetmap.org/copyright) によって提供されています。

## プロジェクト構成

- `app/` — Next.js App Router エントリーポイント。
- `components/` — Cesium ビューアーやヘッダーなどの UI コンポーネント。
- `public/cesium/` — `npm run copy-cesium` で配置する Cesium の静的ファイル。
- `scripts/` — Cesium アセットをコピーするユーティリティスクリプト。

開発やカスタマイズの際は Issue や Pull Request でお気軽にご相談ください。
