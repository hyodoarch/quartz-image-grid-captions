# Image Grid Captions サンプル

このファイルと `images/` を同じ階層に置いて使用してください。

## 1. 横画像2枚

```image-grid-captions
columns: 2
gap: 8
![[images/landscape.png|横画像A]]
![[images/landscape.png|横画像B]]
```

## 2. 縦＋横（gap省略）

```image-grid-captions
columns: 2
![[images/portrait.png|縦画像]]
![[images/landscape.png|横画像]]
```

## 3. 縦＋横＋縦、長いキャプション

```image-grid-captions
columns: 3
![[images/portrait.png|外観]]
![[images/landscape.png|長いキャプションが複数行に折り返されても、画像の高さは揃い、全体が切り取られずに表示されます。]]
![[images/portrait.png]]
```

## 4. 4枚、gap 20

```image-grid-captions
columns: 4
gap: 20
![[images/portrait.png|縦]]
![[images/square.png|正方形]]
![[images/landscape.png|横]]
![[images/portrait.png|縦]]
```

## 5. gap 0

```image-grid-captions
columns: 2
gap: 0
![[images/portrait.png|隙間なし]]
![[images/landscape.png]]
```

## 6. gap 4

```image-grid-captions
columns: 2
gap: 4
![[images/portrait.png|4px]]
![[images/landscape.png]]
```

## 7. 意図的なエラー：画像数不一致

```image-grid-captions
columns: 3
![[images/portrait.png]]
![[images/landscape.png]]
```

## 8. 意図的なエラー：画像なし

```image-grid-captions
columns: 2
![[missing-photo.png]]
![[images/landscape.png]]
```

## 9. 通常画像（既存Image Captionsの担当）

![[images/square.png|通常画像のキャプション]]

幅を変えて画像高さ・gap・縦横比を確認してください。エラー行以外の画像は表示を維持します。
