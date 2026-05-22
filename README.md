# Portfolio Site

## 🎯 概要

未経験からAIエンジニアを目指すポートフォリオサイトです。  
HTML / CSS / JavaScript のみで構成したシングルページサイトで、自己紹介・職務経歴・スキルセット・制作実績・趣味を掲載しています。

---

## 🎓 目的

- エンジニア転向の意思と経緯を伝えるポートフォリオとして制作
- HTML / CSS / JavaScript の基礎力を実践的に習得・証明する
- 採用担当者・クライアントへの第一印象となる「名刺」として活用する

---

## 🚀 デプロイ

| 項目 | 内容 |
|---|---|
| ホスティング | Cloudflare Workers |
| URL | https://long-firefly-b5db.biguver.workers.dev/ |

---

## ✨ 工夫した点

- **デザイン** — サンシャインイエロー（`#F2C12E`）をアクセントカラーに採用し、CSS カスタムプロパティと可変フォントで一貫したスタイルを管理
- **ヒーロー背景** — 自分で撮影した地元の風景写真を使用し、既製素材にない個性と温度感を演出
- **スキルバー** — `IntersectionObserver` でスクロール連動アニメーション、2段階のレベル表記で直感的に伝達
- **切り絵ギャラリー** — スキル・実績では伝わりにくい人となりを補足するため、趣味作品をギャラリー形式で掲載

---

## 📁 ディレクトリ構成

```
demosite/
├── index.html              # メインHTML（全セクション）
├── .gitignore
├── README.md
└── assets/
    ├── css/
    │   └── style.css       # 全スタイル（変数・レイアウト・アニメーション・レスポンシブ）
    ├── js/
    │   └── script.js       # インタラクション（ナビ・スクロール・アコーディオン・パララックス）
    └── images/
        ├── about/          # プロフィール画像
        ├── hero/           # ヒーロー背景画像
        ├── hobby/          # 趣味（切り絵）画像
        └── works/          # 制作実績画像・動画
```

---

## 🛠️ 技術スタック

| カテゴリ | 技術 |
|---|---|
| マークアップ | HTML5 |
| スタイリング | CSS3（カスタムプロパティ・Grid・Flexbox・アニメーション） |
| スクリプト | JavaScript（Vanilla ES6+） |
| フォント | Google Fonts（Fraunces / Noto Sans JP / Noto Serif JP） |
| アニメーション | IntersectionObserver API / requestAnimationFrame |
| レスポンシブ | メディアクエリ（PC / タブレット / スマホ対応） |
| フォーム | Formspree |
| ホスティング | Cloudflare Workers |
| バージョン管理 | Git / GitHub |

---

## 👤 Author

- GitHub: [@biguver-cloud](https://github.com/biguver-cloud)
- X (Twitter): [@Dev_sh22143](https://x.com/Dev_sh22143)