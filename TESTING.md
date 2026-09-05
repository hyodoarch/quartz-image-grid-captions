# 検証記録

実施日: 2026-09-05 / Windows / Node.js 24.16.0 / Microsoft Edge headless。

`npm run check`:

- 型検査・本番バンドル・型定義の生成。
- 49テスト成功。共通parser/layoutの40ケース、キャプション互換1ケース、Quartz変換・URL・エラー・通常画像維持・HTMLエスケープ・リソース出力の8ケース。

`npm run test:integration -- ../quartz-blog ../obsidian-image-grid-captions`:

- 作業フォルダ内の実プラグイン `SyntaxHighlighting`、`ObsidianFlavoredMarkdown`、`ImageCaptions`、`CrawlLinks` と組み合わせてMarkdownからHTMLまで変換。
- 通常画像の既存キャプションと、通常コードのハイライトが維持されることを確認。
- 角括弧付きキャプションの復元と二重figureの防止を確認。
- 幅160/320/800/1000で、Quartz出力とObsidian用rendererの画像寸法・altが一致。
- SPAのDOM置換後も再初期化され、幅変更に追従。
- 共通TypeScriptファイルとCSSが両版で同一であることを検証。

共有rendererにはObsidian側で実ブラウザ64ケースのレイアウト検証も実施しています。比較画像は [docs/comparison.png](docs/comparison.png) に保存しています。

## 未確認範囲

既存サイトへのインストール・サイト全体のビルド・公開は未実施です。実プラグインを組み合わせたunifiedパイプラインと実ブラウザでの結合テストを行っています。Quartz v4、Obsidian実アプリ・モバイル実機、各テーマ固有のCSSとの最終確認は未実施です。
