# Quartz Image Grid Captions 0.2.0

Obsidian版 Image Grid Captions と同一の fenced code block で、画像を高さ一定・トリミングなしの1行に表示する **Quartz v5 Transformer** です。関数名とTransformer名は `ImageGridCaptions` です。

## 導入

Quartzの `quartz.config.yaml` の `plugins` に追加します。

```yaml
  - source: github:hyodoarch/quartz-image-grid-captions
    enabled: true
    order: 70
```

その後、Quartzプロジェクト内でプラグインをインストールします。

```sh
npx quartz plugin install --from-config quartz-image-grid-captions
```

ローカルでプラグインを開発する場合は、Node.js 22以降でビルドし、相対パスを指定できます。

```sh
npm ci
npm run check
```

```yaml
  - source: ../quartz-image-grid-captions
    enabled: true
    order: 70
```

相対パスはQuartzプロジェクトを基準にしてください。

TypeScript設定を直接利用する環境では、ビルド済みエントリから `ImageGridCaptions` をimportしてtransformers配列に追加できます。

```ts
import { ImageGridCaptions } from "../quartz-image-grid-captions/dist/index.js"
// transformers: [...既存のTransformer, ImageGridCaptions()]
```

配布 `.tgz` はnpm形式のパッケージです。ソースフォルダには設定例とサンプル画像も含みます。Quartz v4への組み込みは未検証です。

## 順序と共存

**ObsidianFlavoredMarkdown、ImageCaptions、CrawlLinks、SyntaxHighlighting の後**に配置してください。既存環境の順序20・30・35・60に対し、推奨値は70です。

Markdown段階で専用コードブロックをプレースホルダーに置換するので、HTML段階のSyntaxHighlightingには渡りません。HTML段階では既存画像処理の後にfigure/img/figcaptionを生成し、二重キャプションやURLの二重変換を避けます。

既存 `quartz-image-captions` v0.2.0 が角括弧付きキャプションをコードブロック内でも一時エンコードする挙動に対応します。通常画像の処理は変更せず、このプラグインからの必須依存もありません。

## 記法

````markdown
```image-grid-captions
columns: 3
gap: 8

![[images/portrait.png|外観]]
![[images/landscape.png|長い説明は画像の幅に合わせて折り返します。]]
![[images/portrait.png]]
```
````

- 識別子は **`image-grid-captions` のみ**。`image-grid` は処理しません。
- `columns`: 必須。2・3・4で、画像数との一致が必須。
- `gap`: 省略時8px。単位なし、非負の安全な整数。
- 1行1画像。`|` 後はプレーンテキストのキャプション。長い説明は折り返し、追加の `|` によるサイズ・位置指定はエラー。
- キャプションがあればaltにも設定し、なければファイル名を使用。
- ローカル png、jpg/jpeg、webp、gif、bmp、avif、svg が対象。外部URL、動画、アンカーは非対応。GIF/SVG専用処理はありません。
- 未知・重複パラメータ、画像数不一致、不正な値、見つからない画像はブロック単位のエラー。

## 画像URL

Quartzの `@quartz-community/utils/path` の `transformLink` と `resolveRelative` を使用します。解決方式は **shortest**。ファイル名のみのリンク、フォルダ付きリンク、日本語や空白を含む名前をQuartzのslug規則で解決し、公開対象 `ctx.allSlugs` に存在することを検査します。

同名ファイルが複数ある場合はQuartzの標準フォールバックに従います。Obsidianの同名解決と完全一致する保証はないため、表示を一致させるには `images/photo.jpg` のようなVaultルート基準の一意なパスを指定してください。Quartzで公開されない画像は利用できません。

ビルド時にURLの存在を検証し、公開後の404やデコード不能もクライアント側でブロック単位のエラーにします。プラグイン独自の外部通信・telemetryはありません。

## 表示とリサイズ

画像読み込み後、自然な縦横比から共通高さを計算し、ResizeObserverで幅の変更に追従します。固定gapで1行を維持し、トリミングしません。gap合計以下の幅では一時エラーを表示し、幅が戻れば復帰します。フォントと色はテーマを継承します。

画像寸法取得とレスポンシブ描画にはJavaScriptが必要です。QuartzのSPA遷移と動的に追加されたDOMにも対応します。

## 画像の拡大表示

グリッド内の画像にマウスを重ねると、右上に拡大ボタンが表示されます。ボタンを押すと画像を黒い背景の上に縦横比を保ったまま拡大表示します。背景、右上の閉じるボタン、または `Esc` キーで閉じられます。タッチ端末では拡大ボタンを常時表示します。

この機能の対象は `image-grid-captions` ブロック内の画像だけです。通常のMarkdown画像や `quartz-image-captions` の表示・操作には影響しません。

## 検証・開発

```sh
npm run check
# 既存QuartzとObsidian版を使った結合・表示比較（Edgeが必要）
npm run test:integration -- ../quartz-blog ../obsidian-image-grid-captions
```

共通parser/layout/rendererとCSSは両リポジトリに同梱し、結合テストで内容の一致を検査します。独立配布のため、実行時に兄弟リポジトリは不要です。

サンプルは `examples/demo.md`、検証結果・未確認範囲は [TESTING.md](TESTING.md) を参照してください。
