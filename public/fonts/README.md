# フォント置き場

「Target 1900 randum tester」のロゴには **Yikes**（YOMAGICK 作のラウンドサンセリフ）を使います。
ライセンス上リポジトリには同梱していないので、下記から入手してこのフォルダに置いてください。

- 配布元: https://2938369882508.gumroad.com/l/yikesyomagick

置くファイル名（どれか 1 つでOK。上から優先して読み込みます）:

```
public/fonts/Yikes.woff2
public/fonts/Yikes.otf
public/fonts/Yikes.ttf
```

woff2 に変換しておくといちばん軽くなります。ファイルが無い場合は Noto Sans で表示されます。
`@font-face` の定義は `src/app/globals.css` にあります。
