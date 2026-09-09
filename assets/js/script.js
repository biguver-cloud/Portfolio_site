// ============================================================
// portfolio-site : 画面の動き（インタラクション）をまとめたファイル
// ------------------------------------------------------------
//  1. ヘッダー            : スクロールすると背景・影を付ける
//  2. モバイルメニュー     : ハンバーガーボタンで開閉
//  3. フェードイン         : スクロールで各要素をふわっと表示
//  4. スムーススクロール   : ナビのページ内リンクを滑らかに移動
//  5. スクロールスパイ     : 今見ているセクションをナビでハイライト
//  6. スキルバー           : Skills の棒グラフを伸ばすアニメ
//  7. カウントアップ       : 数字を 0 から目標値まで数える
//  8. 経歴アコーディオン   : 受託開発実績の詳細を開閉
//  9. パララックス         : ヒーロー背景を少しずらして奥行きを出す
// 10. ライトボックス       : 趣味ギャラリーの画像を拡大表示
// 11. Works フィルタ       : 作品カードを技術タグで絞り込み
//
// 共通の考え方:
//  - 「スクロールで画面に入ったか」の判定は IntersectionObserver を使う
//  - 見た目のアニメは基本 CSS 側。JS はクラスや style を付け外しするだけ
//  - prefers-reduced-motion（動きを減らす OS 設定）に配慮する
// ============================================================


// ============================
// 1. ヘッダー : スクロールで見た目を切り替え
// ----------------------------
// 少し下にスクロールしたら <header> に "scrolled" クラスを付ける。
// （背景・影・高さの変化は CSS 側）
// ============================
const header = document.getElementById('header');

const onScroll = () => {
    if (window.scrollY > 30) {
        header.classList.add('scrolled');
    } else {
        header.classList.remove('scrolled');
    }
};

window.addEventListener('scroll', onScroll, { passive: true });
onScroll(); // 読み込み時点のスクロール位置も反映しておく

// ============================
// 2. モバイルメニュー : ハンバーガーボタンで開閉
// ----------------------------
// ボタンで nav を開閉。開いている間は背面(body)のスクロールを固定。
// ============================
const navToggle = document.getElementById('navToggle');
const nav = document.getElementById('nav');

navToggle.addEventListener('click', () => {
    navToggle.classList.toggle('active'); // ボタンを×印に変形（CSS）
    nav.classList.toggle('open');         // メニューをスライド表示（CSS）
    document.body.style.overflow = nav.classList.contains('open') ? 'hidden' : '';
});

// メニュー内のリンクを押したら、メニューを閉じる
document.querySelectorAll('.nav-list a').forEach((link) => {
    link.addEventListener('click', () => {
        navToggle.classList.remove('active');
        nav.classList.remove('open');
        document.body.style.overflow = '';
    });
});

// ============================
// 3. フェードイン : スクロールで要素をふわっと表示
// ----------------------------
// class="fade-in" / "fade-in-up" の要素が画面に入ったら "is-visible" を付ける
// （フェード＆スライドは CSS 側）。一度表示したら監視をやめる。
// ============================
const fadeTargets = document.querySelectorAll('.fade-in, .fade-in-up');

const io = new IntersectionObserver(
    (entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                io.unobserve(entry.target); // 表示済みは監視解除
            }
        });
    },
    {
        threshold: 0.14,                 // 14% 見えたら発火
        rootMargin: '0px 0px -60px 0px', // 画面下端の少し手前で発火
    }
);

fadeTargets.forEach((el) => io.observe(el));

// ヒーロー内の要素は、スクロールを待たずページ読み込み時に表示する
window.addEventListener('load', () => {
    document.querySelectorAll('.hero .fade-in').forEach((el) => {
        el.classList.add('is-visible');
    });
});

// ============================
// 4. スムーススクロール : ページ内リンクを滑らかに移動
// ----------------------------
// href="#..." のリンククリックで対象セクションへスクロール。
// 固定ヘッダーに隠れないよう、ヘッダーの高さぶん上にずらす。
// ============================
document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', (e) => {
        const targetId = anchor.getAttribute('href');
        if (targetId.length <= 1) return; // href="#" だけのものは無視

        const target = document.querySelector(targetId);
        if (!target) return;

        e.preventDefault();

        const headerHeight = header.offsetHeight;
        const targetPosition =
            target.getBoundingClientRect().top + window.pageYOffset - headerHeight + 1;

        window.scrollTo({
            top: targetPosition,
            behavior: 'smooth',
        });
    });
});

// ============================
// 5. スクロールスパイ : 今見ているセクションをナビでハイライト
// ----------------------------
// 各セクションを監視し、画面上部あたりを横切っているセクションの
// ナビリンクに "is-active" / aria-current を付ける。
//  - 複数該当時はページ上側のセクションを優先
//  - 最下部までスクロールしたら最後のリンクを強制的に選択
//  - ナビをクリックした直後は、スムーススクロールが終わるまで
//    ハイライトを固定して途中のちらつきを防ぐ（spyLock）
// ============================
const spyLinks = Array.from(document.querySelectorAll('.nav-list a[href^="#"]'));

if (spyLinks.length) {
    const spySections = spyLinks
        .map((link) => document.getElementById(link.getAttribute('href').slice(1)))
        .filter(Boolean);

    const inView = new Set();   // いま判定バンドに入っているセクション id の集合
    let spyLock = false;        // クリックスクロール中は true（監視結果で上書きしない）
    let spyLockTimer = null;

    // 指定 id のリンクだけを active にする
    const setActiveLink = (id) => {
        spyLinks.forEach((link) => {
            const isActive = link.getAttribute('href') === `#${id}`;
            link.classList.toggle('is-active', isActive);
            if (isActive) {
                link.setAttribute('aria-current', 'true');
            } else {
                link.removeAttribute('aria-current');
            }
        });
    };

    // いま見えているセクションから active を決める
    const updateFromView = () => {
        if (spyLock) return;
        // ドキュメント順で最初に見えているもの＝一番上のセクション
        const active = spySections.find((section) => inView.has(section.id));
        setActiveLink(active ? active.id : null);
    };

    const spyObserver = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    inView.add(entry.target.id);
                } else {
                    inView.delete(entry.target.id);
                }
            });
            updateFromView();
        },
        {
            // 画面の上寄りだけを判定バンドにする（上40%・下55%を除外＝残り約5%）。
            // セクションの上端が画面の約40%まで来たタイミングで切り替わる。
            rootMargin: '-40% 0px -55% 0px',
            threshold: 0,
        }
    );

    spySections.forEach((section) => spyObserver.observe(section));

    // 最後のセクションが短いと判定バンドに届かないことがあるので、
    // ページ最下部まで来たら最後のリンクを active にする保険。
    let bottomTicking = false;
    const checkBottom = () => {
        if (spyLock || !spySections.length) return;
        const atBottom =
            window.innerHeight + window.scrollY >=
            document.documentElement.scrollHeight - 2;
        if (atBottom) {
            setActiveLink(spySections[spySections.length - 1].id);
        }
    };
    window.addEventListener(
        'scroll',
        () => {
            if (!bottomTicking) {
                window.requestAnimationFrame(() => {
                    checkBottom();
                    bottomTicking = false;
                });
                bottomTicking = true;
            }
        },
        { passive: true }
    );

    // ナビのクリック時: 目的地を即 active にし、スクロールが落ち着くまでロック。
    // scrollend イベント、無ければ 700ms のタイマーでロック解除する。
    const releaseSpyLock = () => {
        spyLock = false;
        if (spyLockTimer) {
            clearTimeout(spyLockTimer);
            spyLockTimer = null;
        }
        updateFromView();
    };

    spyLinks.forEach((link) => {
        link.addEventListener('click', () => {
            const id = link.getAttribute('href').slice(1);
            if (!document.getElementById(id)) return;
            setActiveLink(id);
            spyLock = true;
            if (spyLockTimer) clearTimeout(spyLockTimer);
            spyLockTimer = setTimeout(releaseSpyLock, 700);
            window.addEventListener('scrollend', releaseSpyLock, { once: true });
        });
    });
}

// ============================
// 6. スキルバー : Skills の棒グラフを data-level まで伸ばす
// ----------------------------
// カテゴリ(.skill-block)が画面に入ったら、その中の各行の
// data-level(0〜100) を棒(.skill-row-bar-fill)の width に反映。
// 行ごとに 0.1 秒ずつ遅らせて順番に伸ばす。一度きり。
//  - prefers-reduced-motion 時はアニメなしで即最終幅
// ============================
const skillBlocks = document.querySelectorAll('.skill-block');

if (skillBlocks.length) {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const fillSkillBars = (block) => {
        block.querySelectorAll('.skill-row').forEach((row, i) => {
            const fill = row.querySelector('.skill-row-bar-fill');
            if (!fill) return;

            // data-level を 0〜100 の範囲に丸める
            const level = Math.min(100, Math.max(0, parseFloat(row.dataset.level) || 0));

            if (reduceMotion) {
                fill.style.width = `${level}%`;
                return;
            }

            // 行ごとにずらし、次フレームで width を変えて CSS transition を再生させる
            fill.style.transitionDelay = `${i * 0.1}s`;
            requestAnimationFrame(() => {
                fill.style.width = `${level}%`;
            });
        });
    };

    const skillObserver = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) return;
                fillSkillBars(entry.target);
                skillObserver.unobserve(entry.target);
            });
        },
        { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
    );

    skillBlocks.forEach((block) => skillObserver.observe(block));
}

// ============================
// 7. カウントアップ : 数字を 0 から目標値まで数える
// ----------------------------
// class="count-up" data-count-to="31" の要素が画面に入ったら
// 0 → 31 を約 0.9 秒でアニメーション表示（ease-out）。一度きり。
//  - prefers-reduced-motion 時は即最終値
//  - 桁数ぶんの幅を先に確保して、周りの文がずれないようにする
// ============================
const countTargets = document.querySelectorAll('.count-up');

if (countTargets.length) {
    const reduceMotionCount = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const runCountUp = (el) => {
        const target = parseFloat(el.dataset.countTo);
        if (!Number.isFinite(target)) return;

        if (reduceMotionCount) {
            el.textContent = target;
            return;
        }

        const duration = 900; // ミリ秒
        const start = performance.now();

        const step = (now) => {
            const progress = Math.min(1, (now - start) / duration);
            // ease-out: 最初は速く、最後はゆっくり止まる
            const eased = 1 - Math.pow(1 - progress, 3);
            el.textContent = Math.round(target * eased);

            if (progress < 1) {
                requestAnimationFrame(step);
            } else {
                el.textContent = target; // 最後は必ず正確な値に
            }
        };

        requestAnimationFrame(step);
    };

    const countObserver = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) return;
                runCountUp(entry.target);
                countObserver.unobserve(entry.target);
            });
        },
        { threshold: 0.6 }
    );

    countTargets.forEach((el) => {
        // 最終桁数ぶんの幅を先に確保しておき、値が増えても（9→10→31）
        // 周囲のテキストがずれないようにする。
        const digits = String(parseFloat(el.dataset.countTo) || 0).length;
        el.style.minWidth = `${digits}ch`;
        countObserver.observe(el);
    });
}

// ============================
// 8. 経歴アコーディオン : 受託開発実績の詳細を開閉
// ----------------------------
// 見出し(.exp-summary)クリックで本文(.exp-body)を開閉。
// 高さ 0 ⇔ 中身の高さ(scrollHeight) を切り替えてスライドさせる。
// 開ききったら max-height:none に戻し、画面幅が変わっても崩れないようにする。
// ============================
const expItems = document.querySelectorAll('.exp-item');

expItems.forEach((item) => {
    const summary = item.querySelector('.exp-summary');
    const body = item.querySelector('.exp-body');

    if (!summary || !body) return;

    summary.addEventListener('click', () => {
        const isOpen = item.classList.contains('open');

        if (isOpen) {
            // 閉じる: いったん現在の高さを指定してから 0 へ（transition の開始値をつくる）
            body.style.maxHeight = body.scrollHeight + 'px';
            // 強制リフロー
            void body.offsetHeight;
            body.style.maxHeight = '0px';
            item.classList.remove('open');
            summary.setAttribute('aria-expanded', 'false');
        } else {
            // 開く: 中身の高さまで広げる
            body.style.maxHeight = body.scrollHeight + 'px';
            item.classList.add('open');
            summary.setAttribute('aria-expanded', 'true');

            // 開ききったら固定値を外す（後で中身がリサイズされても対応できるように）
            body.addEventListener(
                'transitionend',
                function handler() {
                    if (item.classList.contains('open')) {
                        body.style.maxHeight = 'none';
                    }
                    body.removeEventListener('transitionend', handler);
                },
                { once: true }
            );
        }
    });
});

// 画面リサイズ時、開いている項目の高さ固定を解除して崩れを防ぐ
window.addEventListener('resize', () => {
    document.querySelectorAll('.exp-item.open .exp-body').forEach((body) => {
        body.style.maxHeight = 'none';
    });
});

// ============================
// 9. パララックス : ヒーロー背景をゆっくりずらす
// ----------------------------
// スクロール量に応じて背景画像を少し下方向へ動かし、奥行きを出す。
// scroll ごとに requestAnimationFrame でまとめて処理（負荷対策）。
// ============================
const heroBg = document.querySelector('.hero-bg');
if (heroBg) {
    let ticking = false;
    window.addEventListener(
        'scroll',
        () => {
            if (!ticking) {
                window.requestAnimationFrame(() => {
                    const y = window.scrollY;
                    if (y < window.innerHeight) { // ヒーローが見えている間だけ動かす
                        heroBg.style.transform = `translateY(${y * 0.25}px) scale(1.05)`;
                    }
                    ticking = false;
                });
                ticking = true;
            }
        },
        { passive: true }
    );
}

// ============================
// 10. ライトボックス : 趣味ギャラリーの画像を拡大表示
// ----------------------------
// サムネイル(.hobby-item ボタン)クリックで、暗い全画面オーバーレイに
// 拡大画像を表示する。オーバーレイは JS でこの場で組み立てる。
//  - 閉じる            : ×ボタン / 背景クリック / Esc
//  - 前後移動          : ◂ ▸ ボタン / ← → キー（端で循環）
//  - フォーカストラップ : Tab が × ◂ ▸ の3ボタン内だけを回る
//  - 閉じたら開く前の要素へフォーカスを戻す
//  - 開いている間は背面スクロールを固定
// ============================
const hobbyTriggers = Array.from(document.querySelectorAll('.hobby-item'));

if (hobbyTriggers.length) {
    // 各サムネイルの画像URLと alt を配列にしておく
    const slides = hobbyTriggers.map((btn) => {
        const img = btn.querySelector('img');
        return { src: img ? img.src : '', alt: img ? img.alt : '' };
    });

    let lastFocused = null; // 開く前にフォーカスがあった要素（閉じたら戻す）
    let current = 0;        // いま表示中のスライド番号

    // --- オーバーレイの DOM を生成して body に追加 ---
    const overlay = document.createElement('div');
    overlay.className = 'lightbox';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', '切り絵作品の拡大表示');
    overlay.innerHTML =
        '<button class="lightbox-close" type="button" aria-label="閉じる">&times;</button>' +
        '<button class="lightbox-nav lightbox-prev" type="button" aria-label="前の作品">&#8249;</button>' +
        '<figure class="lightbox-figure">' +
        '<img class="lightbox-img" src="" alt="">' +
        '<figcaption class="lightbox-caption"></figcaption>' +
        '</figure>' +
        '<button class="lightbox-nav lightbox-next" type="button" aria-label="次の作品">&#8250;</button>';
    document.body.appendChild(overlay);

    const imgEl = overlay.querySelector('.lightbox-img');
    const captionEl = overlay.querySelector('.lightbox-caption');
    const closeBtn = overlay.querySelector('.lightbox-close');
    const prevBtn = overlay.querySelector('.lightbox-prev');
    const nextBtn = overlay.querySelector('.lightbox-next');
    const focusables = [closeBtn, prevBtn, nextBtn]; // フォーカストラップの対象

    // いまのスライドを画面に反映する
    const render = () => {
        const slide = slides[current];
        imgEl.src = slide.src;
        imgEl.alt = slide.alt;
        captionEl.textContent = slide.alt;
    };

    // 前後に移動（末尾→先頭、先頭→末尾で循環）
    const step = (dir) => {
        current = (current + dir + slides.length) % slides.length;
        render();
    };

    // 開いている間のキー操作
    const onKeydown = (e) => {
        if (e.key === 'Escape') {
            close();
        } else if (e.key === 'ArrowLeft') {
            step(-1);
        } else if (e.key === 'ArrowRight') {
            step(1);
        } else if (e.key === 'Tab') {
            // フォーカスを × ◂ ▸ の3ボタン内で循環させる
            const first = focusables[0];
            const last = focusables[focusables.length - 1];
            if (e.shiftKey && document.activeElement === first) {
                e.preventDefault();
                last.focus();
            } else if (!e.shiftKey && document.activeElement === last) {
                e.preventDefault();
                first.focus();
            }
        }
    };

    function open(index) {
        current = index;
        lastFocused = document.activeElement; // 戻り先を覚えておく
        render();
        overlay.classList.add('is-open');
        document.body.style.overflow = 'hidden'; // 背面スクロールを固定
        document.addEventListener('keydown', onKeydown);
        closeBtn.focus();
    }

    function close() {
        overlay.classList.remove('is-open');
        document.body.style.overflow = '';
        document.removeEventListener('keydown', onKeydown);
        if (lastFocused) lastFocused.focus(); // フォーカスを元の要素へ
    }

    // --- イベント登録 ---
    hobbyTriggers.forEach((btn, i) => {
        btn.addEventListener('click', () => open(i));
    });
    closeBtn.addEventListener('click', close);
    prevBtn.addEventListener('click', () => step(-1));
    nextBtn.addEventListener('click', () => step(1));
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) close(); // 画像の外側（背景）クリックで閉じる
    });
}

// ============================
// 11. Works フィルタ : 作品カードを技術タグで絞り込み
// ----------------------------
// タブ（All / Python / ...）をクリックまたは矢印キーで選ぶと、
// data-tags に一致する .work-card だけ表示し、他は hidden にする。
// 再表示されるカードは is-enter クラスで軽くフェードインさせる。
//  - ARIA tabs パターン : role=tab / aria-selected / ロービング tabindex
//  - ← → （↑ ↓）でタブ移動＋即フィルタ、Home / End で端へ
// ============================
const worksFilter = document.querySelector('.works-filter');
const worksGrid = document.querySelector('.works-grid');

if (worksFilter && worksGrid) {
    const tabs = Array.from(worksFilter.querySelectorAll('.works-filter-tab'));
    const cards = Array.from(worksGrid.querySelectorAll('.work-card'));

    // 指定タグでカードを絞り込む（'all' は全表示）
    const applyFilter = (filter) => {
        cards.forEach((card) => {
            const tags = (card.dataset.tags || '').split(/\s+/);
            const match = filter === 'all' || tags.includes(filter);
            card.hidden = !match;
            if (match) {
                // 再表示されるカードは入場アニメを再生し直す
                card.classList.remove('is-enter');
                void card.offsetWidth; // 強制リフロー（アニメ再スタート用）
                card.classList.add('is-enter');
            }
        });
    };

    // タブの選択状態を更新してから絞り込みを実行する
    const selectTab = (tab) => {
        tabs.forEach((t) => {
            const active = t === tab;
            t.classList.toggle('is-active', active);
            t.setAttribute('aria-selected', active ? 'true' : 'false');
            t.tabIndex = active ? 0 : -1; // 選択中のタブだけ Tab で入れる
        });
        applyFilter(tab.dataset.filter);
    };

    worksFilter.addEventListener('click', (e) => {
        const tab = e.target.closest('.works-filter-tab');
        if (tab) selectTab(tab);
    });

    // 矢印キー / Home / End でタブ移動（移動先を即フィルタ）
    worksFilter.addEventListener('keydown', (e) => {
        const idx = tabs.indexOf(document.activeElement);
        if (idx === -1) return;

        let next = -1;
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
            next = (idx + 1) % tabs.length;
        } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
            next = (idx - 1 + tabs.length) % tabs.length;
        } else if (e.key === 'Home') {
            next = 0;
        } else if (e.key === 'End') {
            next = tabs.length - 1;
        }

        if (next === -1) return;
        e.preventDefault();
        tabs[next].focus();
        selectTab(tabs[next]);
    });
}
