/* Tobpage · 普客网主题脚本（vanilla JS，零依赖） */
(function () {
  'use strict';

  /* ---------- 开场动画（大圣驾筋斗云 · 两段式） ----------
     播放规则（2026-11-08 改版）：只在首页渲染（baseof 以 .IsHome 判断）、每次打开首页都播，无会话抑制；
     内页根本没有 #preloader 节点。第一段 v11「在飞」=加载中；
     window load（=抵达天门）后 crossfade 到第二段 v12「指南天门」收尾，停留约 500ms 再整体淡出移除。
     纪律：v11 至少展示 800ms 才切；load 不来时最迟 1.9s 强制进收尾拍；3s 硬上限必退场。
     baseof 内联兜底与此同口径（主脚本没加载时兜底走时序）。 */
  var pre = document.getElementById('preloader');
  if (pre) {
    var plT0 = Date.now();
    var plArrived = false;
    var plDone = false;
    var dismissPre = function () {
      if (plDone) return;
      plDone = true;
      if (!pre.parentNode) return;
      pre.classList.add('pl-done');
      setTimeout(function () { if (pre.parentNode) pre.parentNode.removeChild(pre); }, 650);
    };
    var arrivePre = function () {
      if (plArrived || plDone) return;
      plArrived = true;
      pre.classList.add('pl-arrive');
      setTimeout(dismissPre, 500); /* 收尾图停留一拍再退场 */
    };
    var maybeArrive = function () {
      var left = 800 - (Date.now() - plT0); /* 第一段至少展示 800ms，两拍都看得见 */
      if (left <= 0) arrivePre();
      else setTimeout(arrivePre, left);
    };
    if (document.documentElement.classList.contains('show-preloader')) {
      if (document.readyState === 'complete') maybeArrive();
      else window.addEventListener('load', maybeArrive);
      setTimeout(maybeArrive, 1900); /* load 迟到：最迟 1.9s 强制抵达 */
      setTimeout(dismissPre, 3000);  /* 硬上限：3 秒内必退场 */
    } else if (pre.parentNode) {
      pre.parentNode.removeChild(pre); /* 不播的页面直接移除，不留 DOM */
    }
  }

  /* ---------- 深浅色切换（引导脚本在 baseof <head> 里先行定调，防闪烁） ---------- */
  var toggle = document.getElementById('theme-toggle');
  if (toggle) {
    toggle.addEventListener('click', function () {
      var html = document.documentElement;
      var next = html.dataset.theme === 'dark' ? 'light' : 'dark';
      html.dataset.theme = next;
      try { localStorage.setItem('tobpage-theme', next); } catch (e) {}
    });
  }

  /* ---------- 移动端菜单 ---------- */
  var navToggle = document.getElementById('nav-toggle');
  var nav = document.getElementById('site-nav');
  if (navToggle && nav) {
    navToggle.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }

  /* ---------- 栏目下拉：移动端手风琴（桌面端走 CSS hover/focus） ----------
     窄屏下第一次点父栏目只展开子菜单（并收起其他已展开的），已展开时再点才跳转到分类索引分组。 */
  var dropParents = document.querySelectorAll('.has-drop > .nav-parent');
  Array.prototype.forEach.call(dropParents, function (link) {
    link.addEventListener('click', function (e) {
      if (!window.matchMedia('(max-width: 720px)').matches) return;
      var li = link.parentElement;
      if (li.classList.contains('open')) return;
      e.preventDefault();
      Array.prototype.forEach.call(document.querySelectorAll('.has-drop.open'), function (o) {
        if (o !== li) o.classList.remove('open');
      });
      li.classList.add('open');
    });
  });

  /* ---------- 本站已运行天数（起算日由站点 params.tobpage.startDate 配置，页脚元素带 data-start 才渲染；上线当天记为第 1 天） ---------- */
  var up = document.getElementById('site-uptime-days');
  if (up && up.dataset.start) {
    var parts = String(up.dataset.start).split('-');
    var start = new Date(+parts[0], (+parts[1] || 1) - 1, +parts[2] || 1);
    var now = new Date();
    var today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    var days = Math.floor((today - start) / 86400000) + 1;
    if (days > 0) up.textContent = days;
  }

  /* ---------- 阅读进度条 + 回到顶部 ---------- */
  var bar = document.getElementById('reading-progress');
  var toTop = document.getElementById('back-to-top');
  var ticking = false;
  function onScroll() {
    var h = document.documentElement;
    var max = h.scrollHeight - h.clientHeight;
    var y = h.scrollTop || document.body.scrollTop;
    if (bar) bar.style.width = (max > 0 ? (y / max) * 100 : 0) + '%';
    if (toTop) toTop.classList.toggle('show', y > h.clientHeight * 0.6);
    ticking = false;
  }
  window.addEventListener('scroll', function () {
    if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
  }, { passive: true });
  onScroll();
  if (toTop) {
    toTop.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* ---------- TOC 滚动高亮（scrollspy） ---------- */
  var tocLinks = Array.prototype.slice.call(document.querySelectorAll('.toc-body a[href^="#"]'));
  if (tocLinks.length) {
    var headingOf = tocLinks.map(function (a) {
      var id = decodeURIComponent(a.getAttribute('href').slice(1));
      return document.getElementById(id);
    });
    var spyTick = false;
    function spy() {
      var pos = window.scrollY + 120;
      var current = -1;
      headingOf.forEach(function (el, i) {
        if (el && el.offsetTop <= pos) current = i;
      });
      tocLinks.forEach(function (a, i) {
        a.classList.toggle('toc-active', i === current);
      });
      spyTick = false;
    }
    window.addEventListener('scroll', function () {
      if (!spyTick) { spyTick = true; requestAnimationFrame(spy); }
    }, { passive: true });
    spy();
  }

  /* ---------- 代码块一键复制 ---------- */
  Array.prototype.forEach.call(document.querySelectorAll('.post-content pre'), function (pre) {
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'copy-btn';
    btn.textContent = '复制';
    btn.setAttribute('aria-label', '复制代码');
    btn.addEventListener('click', function () {
      var code = pre.querySelector('code');
      var text = (code || pre).innerText || '';
      var done = function () {
        btn.textContent = '已复制';
        btn.classList.add('copied');
        setTimeout(function () { btn.textContent = '复制'; btn.classList.remove('copied'); }, 1600);
      };
      var fallback = function () {
        var ta = document.createElement('textarea');
        ta.value = text;
        ta.setAttribute('readonly', '');
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        try { document.execCommand('copy'); } catch (err) {}
        document.body.removeChild(ta);
        done();
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done, fallback);
      } else {
        fallback();
      }
    });
    pre.appendChild(btn);
  });

  /* ---------- 正文图片灯箱（点击放大、上一篇/下一篇式翻看；真外链图片不拦截） ---------- */
  var lb = null, lbImgs = [], lbIdx = 0;
  function lbBuild() {
    lb = document.createElement('div');
    lb.className = 'lightbox';
    lb.hidden = true;
    lb.setAttribute('role', 'dialog');
    lb.setAttribute('aria-modal', 'true');
    lb.setAttribute('aria-label', '图片查看');
    lb.innerHTML =
      '<button type="button" class="lb-btn lb-close" aria-label="关闭">×</button>' +
      '<button type="button" class="lb-btn lb-prev" aria-label="上一张">‹</button>' +
      '<img class="lb-img" alt="">' +
      '<button type="button" class="lb-btn lb-next" aria-label="下一张">›</button>' +
      '<div class="lb-bar"><span class="lb-caption"></span><span class="lb-count"></span></div>';
    document.body.appendChild(lb);
    lb.querySelector('.lb-close').addEventListener('click', lbClose);
    lb.querySelector('.lb-prev').addEventListener('click', function () { lbShow(lbIdx - 1); });
    lb.querySelector('.lb-next').addEventListener('click', function () { lbShow(lbIdx + 1); });
    lb.addEventListener('click', function (e) { if (e.target === lb) lbClose(); });
  }
  function lbShow(i) {
    if (!lbImgs.length) return;
    lbIdx = ((i % lbImgs.length) + lbImgs.length) % lbImgs.length;
    var im = lbImgs[lbIdx];
    var stage = lb.querySelector('.lb-img');
    stage.src = im.currentSrc || im.src;
    stage.alt = im.alt || '';
    lb.querySelector('.lb-caption').textContent = im.alt || '';
    var multi = lbImgs.length > 1;
    lb.querySelector('.lb-count').textContent = multi ? (lbIdx + 1) + ' / ' + lbImgs.length : '';
    lb.querySelector('.lb-prev').style.display = multi ? '' : 'none';
    lb.querySelector('.lb-next').style.display = multi ? '' : 'none';
  }
  function lbOpen(img) {
    if (!lb) lbBuild();
    var box = img.closest('.post-content');
    if (!box) return;
    lbImgs = Array.prototype.slice.call(box.querySelectorAll('img'));
    if (!lbImgs.length) return;
    lb.hidden = false;
    document.body.style.overflow = 'hidden';
    lbShow(lbImgs.indexOf(img));
    document.addEventListener('keydown', lbKeys);
  }
  function lbClose() {
    if (!lb || lb.hidden) return;
    lb.hidden = true;
    document.body.style.overflow = '';
    document.removeEventListener('keydown', lbKeys);
  }
  function lbKeys(e) {
    if (e.key === 'Escape') lbClose();
    else if (e.key === 'ArrowLeft') lbShow(lbIdx - 1);
    else if (e.key === 'ArrowRight') lbShow(lbIdx + 1);
  }
  document.addEventListener('click', function (e) {
    var t = e.target;
    if (!t || t.tagName !== 'IMG' || !t.closest || !t.closest('.post-content')) return;
    var link = t.closest('a');
    if (link && link.href !== (t.currentSrc || t.src)) return; /* 包着真链接的图片：放行跳转，不开灯箱 */
    e.preventDefault();
    lbOpen(t);
  });

  /* ---------- 标签页（shortcode .tb-tabs）：把平铺面板收成选项卡 ---------- */
  Array.prototype.forEach.call(document.querySelectorAll('.tb-tabs'), function (box) {
    var panels = Array.prototype.slice.call(box.querySelectorAll(':scope > .tb-tab-panel'));
    if (!panels.length) return;
    var bar = document.createElement('div');
    bar.className = 'tb-tab-bar';
    bar.setAttribute('role', 'tablist');
    panels.forEach(function (panel, i) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'tb-tab-btn';
      b.setAttribute('role', 'tab');
      b.textContent = panel.getAttribute('data-tab-title') || ('标签 ' + (i + 1));
      b.addEventListener('click', function () { activate(i); });
      bar.appendChild(b);
    });
    box.insertBefore(bar, panels[0]);
    box.classList.add('js-enabled');
    function activate(i) {
      panels.forEach(function (p, j) { p.classList.toggle('active', j === i); });
      Array.prototype.forEach.call(bar.children, function (b, j) {
        b.classList.toggle('active', j === i);
        b.setAttribute('aria-selected', j === i ? 'true' : 'false');
      });
    }
    activate(0);
  });

  /* ---------- 本地搜索（/search/ 页：拉取 /index.json 全量索引，前端过滤） ---------- */
  var input = document.getElementById('search-input');
  var resultsEl = document.getElementById('search-results');
  var hintEl = document.getElementById('search-hint');
  if (input && resultsEl) {
    var indexData = null;
    var loading = false;

    function loadIndex() {
      if (indexData || loading) return;
      loading = true;
      fetch(input.dataset.index || '/index.json')
        .then(function (r) { return r.json(); })
        .then(function (data) { indexData = data; loading = false; runSearch(); })
        .catch(function () {
          loading = false;
          if (hintEl) hintEl.textContent = '搜索索引加载失败，请稍后重试。';
        });
    }

    function esc(s) {
      return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
      });
    }

    function snippet(text, q) {
      if (!text) return '';
      var i = text.toLowerCase().indexOf(q);
      if (i < 0) return esc(text.slice(0, 110)) + '…';
      var from = Math.max(0, i - 42);
      return (from > 0 ? '…' : '') + esc(text.slice(from, i + q.length + 68)) + '…';
    }

    function runSearch() {
      var q = input.value.trim().toLowerCase();
      if (!q) {
        resultsEl.innerHTML = '';
        if (hintEl) hintEl.textContent = '在全部文章的标题、正文、分类与标签里搜索。';
        return;
      }
      if (!indexData) { loadIndex(); return; }
      var hits = indexData.filter(function (p) {
        var bag = (p.title + ' ' + (p.summary || '') + ' ' + (p.content || '') + ' ' +
          (p.categories || []).join(' ') + ' ' + (p.tags || []).join(' ')).toLowerCase();
        return bag.indexOf(q) >= 0;
      });
      if (hintEl) hintEl.textContent = '共找到 ' + hits.length + ' 篇相关文章。';
      resultsEl.innerHTML = hits.map(function (p) {
        return '<a class="search-result" href="' + esc(p.permalink) + '">' +
          '<time>' + esc(p.date) + '</time>' +
          '<h3>' + esc(p.title) + '</h3>' +
          '<p>' + snippet(p.content || p.summary || '', q) + '</p></a>';
      }).join('');
    }

    input.addEventListener('input', runSearch);
    input.addEventListener('focus', loadIndex);
    // 支持 /search/?q=关键词 直达
    var q0 = new URLSearchParams(window.location.search).get('q');
    if (q0) { input.value = q0; loadIndex(); }
  }
})();
