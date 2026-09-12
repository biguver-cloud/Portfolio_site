// ============================================================
// このファイル = ページの「動き」をまとめたもの
// （ボタンを押す・スクロールする などに反応して画面を変える）
//
//  0. 「動きを減らす」設定（OS側の指定）を一箇所でまとめて判定する
//  1. スクロールでヘッダーの見た目を変える
//  2. スマホのメニューを開け閉めする
//  3. スクロールで文字や画像をじわっと表示する
//  4. メニューのリンクで、その場所へなめらかに移動する
//  5. いま読んでいる場所を上のメニューで示す
//  6. スキルの棒グラフを伸ばして見せる
//  7. 数字を 0 から目標の数まで数え上げる
//  8. 「受託開発実績」の各項目を開け閉めする
//  9. トップの背景画像をスクロールに合わせて少し動かす
// 10. 趣味ギャラリーの画像を大きく表示する
// 11. Works の作品を、使った技術で絞り込む
// 12. ダーク / ライトのテーマを切り替える
// 13. 一定量スクロールしたら「トップへ戻る」ボタンを出す
// ============================================================


// ============================
// 0. 「動きを減らす」設定を一箇所でまとめて判定する
// （OS / ブラウザの「視差効果を減らす」設定。以前は各機能がそれぞれ
//    window.matchMedia(...) を書いていたが、ここに集約する）
// ============================
const reduceMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
const prefersReducedMotion = () => reduceMotionQuery.matches;

// ============================
// 1. 少し下にスクロールしたら、ヘッダーの見た目を変える
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
onScroll();

// ============================
// 2. スマホのメニューを、ボタンで開け閉めする
// ============================
const navToggle = document.getElementById('navToggle');
const nav = document.getElementById('nav');

navToggle.addEventListener('click', () => {
    navToggle.classList.toggle('active');
    nav.classList.toggle('open');
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
// 3. スクロールでその部分が画面に入ったら、文字や画像をじわっと表示する
// （見た目の変化は CSS 側。一度出したらそれっきり）
// ============================
const fadeTargets = document.querySelectorAll('.fade-in, .fade-in-up');

const io = new IntersectionObserver(
    (entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                io.unobserve(entry.target);
            }
        });
    },
    {
        threshold: 0.14,
        rootMargin: '0px 0px -60px 0px',
    }
);

// 「動きを減らす」設定なら、スクロールを待たず最初から全部表示する
const showAllFadeTargetsInstantly = () => {
    io.disconnect();
    fadeTargets.forEach((el) => el.classList.add('is-visible'));
};

if (prefersReducedMotion()) {
    showAllFadeTargetsInstantly();
} else {
    fadeTargets.forEach((el) => io.observe(el));
}

// ページを開いたあとで設定が変わった場合も追従する
reduceMotionQuery.addEventListener('change', (e) => {
    if (e.matches) showAllFadeTargetsInstantly();
});

// トップ画面の中身は、スクロールを待たず最初から表示する
window.addEventListener('load', () => {
    document.querySelectorAll('.hero .fade-in').forEach((el) => {
        el.classList.add('is-visible');
    });
});

// ============================
// 4. メニューのリンクを押したら、その場所までなめらかに移動する
// （固定ヘッダーに隠れないよう、ヘッダーの高さぶん上で止める）
// ============================
document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', (e) => {
        const targetId = anchor.getAttribute('href');
        if (targetId.length <= 1) return;

        const target = document.querySelector(targetId);
        if (!target) return;

        e.preventDefault();

        const headerHeight = header.offsetHeight;
        const targetPosition =
            target.getBoundingClientRect().top + window.pageYOffset - headerHeight + 1;

        window.scrollTo({
            top: targetPosition,
            behavior: prefersReducedMotion() ? 'auto' : 'smooth',
        });
    });
});

// ============================
// 5. いま読んでいる場所を、上のメニューで示す（下線が動く）
// ============================
const spyLinks = Array.from(document.querySelectorAll('.nav-list a[href^="#"]'));

if (spyLinks.length) {
    const spySections = spyLinks
        .map((link) => document.getElementById(link.getAttribute('href').slice(1)))
        .filter(Boolean);

    const inView = new Set();
    let spyLock = false;
    let spyLockTimer = null;

    // 指定した場所のメニュー項目だけに印を付ける
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

    // いま画面に見えている場所から、印を付ける項目を決める
    const updateFromView = () => {
        if (spyLock) return;
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
            // 画面の上のほうだけを「今ここ」の判定対象にする
            rootMargin: '-40% 0px -55% 0px',
            threshold: 0,
        }
    );

    spySections.forEach((section) => spyObserver.observe(section));

    // 一番下まで来たら、最後の項目に印を付ける
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

    // メニューから飛んでいる最中は、途中で下線がチラつかないよう固定する
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
// 6. スキル欄の棒グラフを、画面に入ったら伸ばして見せる
// （伸ばす長さは、各行に書いた data-level の数値ぶん）
// ============================
const skillBlocks = document.querySelectorAll('.skill-block');

if (skillBlocks.length) {
    // 「動きを減らす」設定の人にはアニメーションを見せない
    const reduceMotion = prefersReducedMotion();

    const fillSkillBars = (block) => {
        block.querySelectorAll('.skill-row').forEach((row, i) => {
            const fill = row.querySelector('.skill-row-bar-fill');
            if (!fill) return;

            // data-level を 0〜100 の範囲におさめる
            const level = Math.min(100, Math.max(0, parseFloat(row.dataset.level) || 0));

            if (reduceMotion) {
                fill.style.width = `${level}%`;
                return;
            }

            // 行ごとに少しずつ遅らせて、順番に伸びるようにする
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
// 7. 数字を 0 から目標の数まで数え上げて表示する
// （目標の数は data-count-to に書いてある。画面に入ったら1回だけ動く）
// ============================
const countTargets = document.querySelectorAll('.count-up');

if (countTargets.length) {
    const reduceMotionCount = prefersReducedMotion();

    const runCountUp = (el) => {
        const target = parseFloat(el.dataset.countTo);
        if (!Number.isFinite(target)) return;

        if (reduceMotionCount) {
            el.textContent = target;
            return;
        }

        const duration = 900; // 何ミリ秒かけて数えるか
        const start = performance.now();

        const step = (now) => {
            const progress = Math.min(1, (now - start) / duration);
            // 最初は速く、終わりに近づくほどゆっくりにする
            const eased = 1 - Math.pow(1 - progress, 3);
            el.textContent = Math.round(target * eased);

            if (progress < 1) {
                requestAnimationFrame(step);
            } else {
                el.textContent = target; // 最後は必ず正確な数にする
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
        // 桁が増えても前後の文がずれないよう、あらかじめ幅を取っておく
        const digits = String(parseFloat(el.dataset.countTo) || 0).length;
        el.style.minWidth = `${digits}ch`;
        countObserver.observe(el);
    });
}

// ============================
// 8. 「受託開発実績」の各項目を、見出しクリックで開け閉めする
// （高さを 0 ⇔ 中身の高さ で切り替えてスライドさせる）
// ============================
const expItems = document.querySelectorAll('.exp-item');

expItems.forEach((item) => {
    const summary = item.querySelector('.exp-summary');
    const body = item.querySelector('.exp-body');

    if (!summary || !body) return;

    summary.addEventListener('click', () => {
        const isOpen = item.classList.contains('open');

        if (isOpen) {
            // 閉じる
            body.style.maxHeight = body.scrollHeight + 'px';
            void body.offsetHeight; // いったんブラウザに高さを計算させる
            body.style.maxHeight = '0px';
            item.classList.remove('open');
            summary.setAttribute('aria-expanded', 'false');
        } else {
            // 開く
            body.style.maxHeight = body.scrollHeight + 'px';
            item.classList.add('open');
            summary.setAttribute('aria-expanded', 'true');

            // 開ききったら高さの固定を外す（あとで中身が変わっても崩れない）
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

// 画面の幅が変わったら、開いている項目の高さ固定を外して崩れを防ぐ
window.addEventListener('resize', () => {
    document.querySelectorAll('.exp-item.open .exp-body').forEach((body) => {
        body.style.maxHeight = 'none';
    });
});

// ============================
// 9. トップの大きな背景画像を、スクロールに合わせて少し動かす（奥行きを出す）
// ============================
const heroBg = document.querySelector('.hero-bg');
if (heroBg) {
    let ticking = false;
    window.addEventListener(
        'scroll',
        () => {
            // 「動きを減らす」設定なら、視差効果はかけない（毎回チェックするので
            // ページを開いたあとの設定変更にもその場で追従する）
            if (prefersReducedMotion()) return;

            if (!ticking) {
                window.requestAnimationFrame(() => {
                    const y = window.scrollY;
                    if (y < window.innerHeight) { // トップ画面が見えている間だけ
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
// 10. 画像をクリックで大きく表示する（ライトボックス）
// 趣味ギャラリーと Works の実績画像を、それぞれ独立した一組として扱う
// （閉じる: ×ボタン / 背景クリック / Esc　　前後の画像: ◂ ▸ ボタン / ← → キー）
// ============================

// 1組ぶんのライトボックス（オーバーレイと開閉・前後移動）を組み立てる
const createLightbox = (slides, ariaLabel) => {
    let lastFocused = null; // 開く前に選ばれていた場所（閉じたら戻す）
    let current = 0;        // いま表示している画像の番号

    // 拡大表示する黒い画面を組み立てて、ページに追加する
    const overlay = document.createElement('div');
    overlay.className = 'lightbox';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', ariaLabel);
    overlay.innerHTML =
        '<button class="lightbox-close" type="button" aria-label="閉じる">&times;</button>' +
        '<button class="lightbox-nav lightbox-prev" type="button" aria-label="前の画像">&#8249;</button>' +
        '<figure class="lightbox-figure">' +
        '<img class="lightbox-img" src="" alt="">' +
        '<figcaption class="lightbox-caption"></figcaption>' +
        '</figure>' +
        '<button class="lightbox-nav lightbox-next" type="button" aria-label="次の画像">&#8250;</button>';
    document.body.appendChild(overlay);

    const imgEl = overlay.querySelector('.lightbox-img');
    const captionEl = overlay.querySelector('.lightbox-caption');
    const closeBtn = overlay.querySelector('.lightbox-close');
    const prevBtn = overlay.querySelector('.lightbox-prev');
    const nextBtn = overlay.querySelector('.lightbox-next');
    const focusables = [closeBtn, prevBtn, nextBtn];

    // いまの番号の画像を画面に表示する
    const render = () => {
        const slide = slides[current];
        imgEl.src = slide.src;
        imgEl.alt = slide.alt;
        captionEl.textContent = slide.alt;
    };

    // 前後の画像へ（端まで行ったら反対側へ回る）
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
            // Tab の移動先を、× ◂ ▸ の3つのボタンの中だけに閉じ込める
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
        lastFocused = document.activeElement;
        render();
        overlay.classList.add('is-open');
        document.body.style.overflow = 'hidden'; // 後ろのページはスクロールさせない
        document.addEventListener('keydown', onKeydown);
        closeBtn.focus();
    }

    function close() {
        overlay.classList.remove('is-open');
        document.body.style.overflow = '';
        document.removeEventListener('keydown', onKeydown);
        if (lastFocused) lastFocused.focus();
    }

    closeBtn.addEventListener('click', close);
    prevBtn.addEventListener('click', () => step(-1));
    nextBtn.addEventListener('click', () => step(1));
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) close(); // 画像の外側（黒い部分）をクリックしたら閉じる
    });

    return { open };
};

// トリガー要素（クリック元）をライトボックスに結びつける
// ボタンはクリックだけで十分だが、素の <img> はキーボードで
// 開けるよう tabindex / role / Enter・Space を追加で付与する
const wireLightboxTriggers = (triggers, lightbox) => {
    triggers.forEach((el, i) => {
        el.addEventListener('click', () => lightbox.open(i));

        if (el.tagName === 'IMG') {
            el.classList.add('lightbox-trigger');
            el.tabIndex = 0;
            el.setAttribute('role', 'button');
            el.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    lightbox.open(i);
                }
            });
        }
    });
};

// 趣味ギャラリー（切り絵作品）
const hobbyTriggers = Array.from(document.querySelectorAll('.hobby-item'));

if (hobbyTriggers.length) {
    const hobbySlides = hobbyTriggers.map((btn) => {
        const img = btn.querySelector('img');
        return { src: img ? img.src : '', alt: img ? img.alt : '' };
    });
    const hobbyLightbox = createLightbox(hobbySlides, '切り絵作品の拡大表示');
    wireLightboxTriggers(hobbyTriggers, hobbyLightbox);
}

// Works の実績画像（Portfolio カードの2枚 + Development Experience の2枚。
// デモ動画は独自の再生 UI を持つため対象外）
const worksTriggers = Array.from(
    document.querySelectorAll('.work-thumb img, .exp-demo-row img')
);

if (worksTriggers.length) {
    const worksSlides = worksTriggers.map((img) => ({ src: img.src, alt: img.alt }));
    const worksLightbox = createLightbox(worksSlides, 'Works作品の拡大表示');
    wireLightboxTriggers(worksTriggers, worksLightbox);
}

// ============================
// 11. Works の作品を、使った技術で絞り込んで表示する
// （タブを選ぶと、その技術を使った作品だけ表示。ほかは隠す）
// ============================
const worksFilter = document.querySelector('.works-filter');
const worksGrid = document.querySelector('.works-grid');

if (worksFilter && worksGrid) {
    const tabs = Array.from(worksFilter.querySelectorAll('.works-filter-tab'));
    const cards = Array.from(worksGrid.querySelectorAll('.work-card'));

    // 選ばれたタグに合う作品だけ表示する（'all' は全部表示）
    const applyFilter = (filter) => {
        cards.forEach((card) => {
            const tags = (card.dataset.tags || '').split(/\s+/);
            const match = filter === 'all' || tags.includes(filter);
            card.hidden = !match;
            if (match) {
                // もう一度出てくる作品は、軽い表示アニメをやり直す
                card.classList.remove('is-enter');
                void card.offsetWidth;
                card.classList.add('is-enter');
            }
        });
    };

    // 押されたタブを選択状態にして、絞り込みを実行する
    const selectTab = (tab) => {
        tabs.forEach((t) => {
            const active = t === tab;
            t.classList.toggle('is-active', active);
            t.setAttribute('aria-selected', active ? 'true' : 'false');
            t.tabIndex = active ? 0 : -1;
        });
        applyFilter(tab.dataset.filter);
    };

    worksFilter.addEventListener('click', (e) => {
        const tab = e.target.closest('.works-filter-tab');
        if (tab) selectTab(tab);
    });

    // 矢印キーや Home / End でもタブを切り替えられるようにする
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

// ============================
// 12. ダーク / ライトのテーマを切り替える（選んだテーマはブラウザに保存）
// （最初のテーマ適用は <head> の先読みスクリプトが済ませている）
// ============================
const themeToggle = document.getElementById('themeToggle');

if (themeToggle) {
    const root = document.documentElement;
    const darkMedia = window.matchMedia('(prefers-color-scheme: dark)');

    const isDark = () => root.dataset.theme === 'dark';

    // ボタンの状態表示（押されている = ダーク）を今のテーマに合わせる
    const reflectButton = () => {
        themeToggle.setAttribute('aria-pressed', isDark() ? 'true' : 'false');
    };

    const applyTheme = (theme) => {
        if (!prefersReducedMotion()) {
            // 切り替えの一瞬だけ色をなめらかに変える
            root.classList.add('theme-transition');
            window.setTimeout(() => root.classList.remove('theme-transition'), 400);
        }
        root.dataset.theme = theme;
        root.style.colorScheme = theme;
        reflectButton();
    };

    reflectButton();

    themeToggle.addEventListener('click', () => {
        const next = isDark() ? 'light' : 'dark';
        try {
            localStorage.setItem('theme', next);
        } catch (e) {
            // 保存できなくても、その場の切り替えは効かせる
        }
        applyTheme(next);
    });

    // 自分でまだ選んでいない間は、OS の設定変更に追従する
    darkMedia.addEventListener('change', (e) => {
        let saved = null;
        try {
            saved = localStorage.getItem('theme');
        } catch (err) {
            saved = null;
        }
        if (saved !== 'dark' && saved !== 'light') {
            applyTheme(e.matches ? 'dark' : 'light');
        }
    });
}

// ============================
// 13. 一定量スクロールしたら「トップへ戻る」ボタンを出す
// ============================
const backToTop = document.getElementById('backToTop');

if (backToTop) {
    // ビューポート高さの1.5倍を超えてスクロールしたら表示する
    const showThreshold = () => window.innerHeight * 1.5;

    const updateVisibility = () => {
        backToTop.classList.toggle('is-visible', window.scrollY > showThreshold());
    };

    let ticking = false;
    window.addEventListener(
        'scroll',
        () => {
            if (!ticking) {
                window.requestAnimationFrame(() => {
                    updateVisibility();
                    ticking = false;
                });
                ticking = true;
            }
        },
        { passive: true }
    );
    updateVisibility(); // 読み込み時点のスクロール位置も反映

    backToTop.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
    });
}
