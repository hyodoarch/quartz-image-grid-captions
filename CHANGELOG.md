# Changelog

## 0.2.1 — 2026-09-05

- QuartzのSPA遷移後に切断済みのライトボックスが再利用され、拡大画像が表示されない問題を修正。
- SPAがライトボックスを破棄した場合に、スクロール状態とイベントリスナーを安全に復旧。

## 0.2.0 — 2026-09-05

- グリッド画像のホバー時に拡大ボタンを表示。
- 黒背景の拡大表示を追加し、背景クリック・閉じるボタン・Escキーに対応。
- キーボード操作、フォーカス復帰、タッチ端末でのボタン表示に対応。

## 0.1.0 — 2026-09-05

- Quartz v5 Transformer `ImageGridCaptions` を追加。
- Obsidian版と共通の記法・厳密な検証・高さ一定の1行レイアウト。
- Quartz標準パスAPIによる画像解決とブロック単位のエラー表示。
- 既存ImageCaptions/CrawlLinks/ObsidianFlavoredMarkdown/SyntaxHighlightingとの共存。
- SPA遷移・動的DOM・リサイズ対応、サンプルと表示比較テスト。
