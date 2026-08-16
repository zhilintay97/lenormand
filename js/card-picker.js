// ---------- 抓拽式挑牌组件（塔罗 / 雷诺曼共用）----------
// 一排扇形背面牌，用手指/鼠标"抓着拨"，拖到哪停哪（带惯性 + 归位）。
// 位移小于阈值算"点选"，点一张选一张，选够 N 张才能翻牌。
// 复刻 june-tarot 问题占卜的手感：coverflow 弧形卡组，不是滚动条。
//
// 用法：
//   CardPicker.mount(container, {
//     cards,        // 已定好的牌数组（洗好、含正逆位）；第 i 格 => cards[i]
//     count,        // 要选几张
//     hintText,     // 顶部提示，如 "从 78 张中任选 3 张"
//     buildBack,    // 可选：() => Element，自定义牌背；默认金色牌背
//     onReveal,     // (chosen[]) => void，翻牌时回调，chosen 按点选顺序
//   });
//
// 无第三方依赖。触控 + 鼠标 + 键盘（←/→ 拨动，空格/回车选中间那张）。

(function () {
  "use strict";

  // 手感参数（对齐 june-tarot：Xs=48 间距、弧形下沉、±6°倾斜、coverflow）
  const STEP = 48;          // 拖多少 px 换一张
  const FRICTION = 0.94;    // 惯性衰减
  const SNAP_K = 0.18;      // 归位弹性
  const TAP_MOVE = 8;       // 位移小于此值算点选（px）
  const TAP_MS = 400;       // 且时间短
  const VISIBLE = 8.5;      // 偏移超过这个的牌隐藏

  function clamp(n, a, l) { return Math.min(Math.max(n, a), l); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  // 卡片 i 相对当前中心 active 的"环形有符号偏移"（可无限循环拨动）
  function offsetOf(i, active, n) {
    if (n <= 0) return 0;
    const o = i - active;
    return o - Math.round(o / n) * n;
  }

  // 照搬 june 的 HD()：把偏移量换成一组视觉参数
  function transformFor(off) {
    const a = Math.abs(off);
    const l = clamp(a, 0, 1), o = clamp((a - 1) / 3, 0, 1), c = clamp((a - 4) / 4, 0, 1);
    const scale = a <= 1 ? lerp(1, 0.88, l) : a <= 4 ? lerp(0.88, 0.72, o) : lerp(0.72, 0.6, c);
    const bright = a <= 1 ? lerp(1, 0.75, l) : a <= 4 ? lerp(0.75, 0.45, o) : lerp(0.45, 0.28, c);
    const blur = a <= 1 ? lerp(0, 0.28, l) : a <= 4 ? lerp(0.28, 1, o) : lerp(1, 2, c);
    const g = clamp(a / 8, 0, 1);
    return {
      x: off * STEP,
      y: a * 6.4 + Math.pow(a, 1.22) * 1.15,
      z: Math.round(92 - g * 190),
      rotate: clamp(off * 0.72, -6, 6),
      rotateY: clamp(off * -5.4, -31, 31),
      scale: scale,
      brightness: bright,
      blur: blur,
      zIndex: 200 - Math.round(a * 6),
      visible: a <= VISIBLE,
    };
  }

  function defaultBack() {
    const el = document.createElement("div");
    el.className = "pcard-back";
    el.innerHTML = '<div class="pback-frame"><span class="pback-mark">✴</span></div>';
    return el;
  }

  function prefersReducedMotion() {
    return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  let pickerSeq = 0; // 每次 mount 自增，用来生成页面内唯一的选项 id（可能多个挑牌器共存）

  function mount(container, opts) {
    const cards = opts.cards || [];
    const n = cards.length;
    const count = opts.count || 1;
    const buildBack = opts.buildBack || defaultBack;
    const reduced = prefersReducedMotion();
    const uid = "cp" + (++pickerSeq) + "-";

    container.innerHTML = "";
    container.classList.add("picker");

    const hint = document.createElement("p");
    hint.className = "picker-hint";
    const baseHint = opts.hintText || `从 ${n} 张中任选 ${count} 张`;
    container.appendChild(hint);

    const viewport = document.createElement("div");
    viewport.className = "card-carousel-viewport";
    viewport.tabIndex = 0;
    viewport.setAttribute("role", "listbox");
    viewport.setAttribute("aria-label", "抓着牌堆左右拨动，点一张选一张");
    container.appendChild(viewport);

    const track = document.createElement("div");
    track.className = "card-carousel";
    viewport.appendChild(track);

    const actions = document.createElement("div");
    actions.className = "picker-actions";
    const revealBtn = document.createElement("button");
    revealBtn.type = "button";
    revealBtn.className = "btn";
    revealBtn.disabled = true;
    actions.appendChild(revealBtn);
    container.appendChild(actions);

    // 建 n 张背面牌
    const picked = [];               // 选中的格子下标，按点选顺序
    const slots = [];
    for (let i = 0; i < n; i++) {
      const slot = document.createElement("div");
      slot.className = "carousel-card";
      slot.id = uid + i;
      slot.dataset.slot = String(i);
      slot.setAttribute("role", "option");
      slot.setAttribute("aria-selected", "false");
      slot.appendChild(buildBack());
      track.appendChild(slot);
      slots.push(slot);
    }

    let active = 0;        // 当前中心（浮点）
    let vel = 0;           // 惯性速度（张/帧）
    let dragging = false;
    let raf = 0;
    let activePointerId = null;  // 只认第一根手指，避免多点触控互相打架
    let downCard = null;         // 按下时命中的牌（指针捕获后 up.target 不可靠，见 onUp）

    function updateHint() {
      hint.textContent = `${baseHint} · 已选 ${picked.length}/${count}`;
      revealBtn.textContent = `翻牌（${picked.length}/${count}）`;
      revealBtn.disabled = picked.length !== count;
    }
    updateHint();

    function render() {
      for (let i = 0; i < n; i++) {
        const off = offsetOf(i, active, n);
        const t = transformFor(off);
        const slot = slots[i];
        if (!t.visible) {
          slot.style.opacity = "0";
          slot.style.pointerEvents = "none";
          slot.style.visibility = "hidden";
          continue;
        }
        slot.style.visibility = "visible";
        slot.style.pointerEvents = "auto";
        const chosen = picked.indexOf(i) >= 0;
        const lift = chosen ? -26 : 0;
        slot.style.transform =
          `translate(-50%,-50%) translateZ(${t.z}px) translateX(${t.x}px) ` +
          `translateY(${t.y + lift}px) rotateY(${t.rotateY}deg) rotate(${t.rotate}deg) scale(${t.scale})`;
        slot.style.zIndex = String(chosen ? 300 : t.zIndex);
        slot.style.opacity = "1";
        slot.style.filter = `brightness(${chosen ? 1.15 : t.brightness}) blur(${chosen ? 0 : t.blur}px)`;
        slot.classList.toggle("chosen", chosen);
        slot.setAttribute("aria-selected", chosen ? "true" : "false");
      }
      // 让读屏跟到当前居中的那张（listbox 语义）
      const centered = ((Math.round(active) % n) + n) % n;
      viewport.setAttribute("aria-activedescendant", uid + centered);
    }
    render();

    function stopRaf() { if (raf) { cancelAnimationFrame(raf); raf = 0; } }

    function coast() {
      if (dragging) return;
      active += vel;
      vel *= FRICTION;
      if (Math.abs(vel) < 0.015) {
        const target = Math.round(active);
        active += (target - active) * SNAP_K;
        if (Math.abs(target - active) < 0.0015) {
          active = target;
          render();
          stopRaf();
          return;
        }
      }
      render();
      raf = requestAnimationFrame(coast);
    }
    function snapNow() {
      stopRaf();
      active = Math.round(active);
      render();
    }

    function toggle(i) {
      const at = picked.indexOf(i);
      if (at >= 0) {
        picked.splice(at, 1);
      } else if (picked.length < count) {
        picked.push(i);
      } else {
        return; // 已选满
      }
      updateHint();
      render();
    }

    // ---- 指针拖拽 ----
    let startX = 0, startActive = 0, moved = false, downT = 0;
    let lastX = 0, lastT = 0, lastDx = 0, lastDt = 1;

    function onDown(clientX, ev) {
      stopRaf();
      dragging = true;
      moved = false;
      startX = lastX = clientX;
      startActive = active;
      downT = lastT = (ev && ev.timeStamp) || performance.now();
      // pointerdown 的 e.target 还是真正被点到的牌（此刻尚未发生指针捕获），先记下来
      downCard = ev && ev.target && ev.target.closest ? ev.target.closest("[data-slot]") : null;
      viewport.setAttribute("data-dragging", "1");
    }
    function onMove(clientX, ev) {
      if (!dragging) return;
      const dx = clientX - startX;
      if (Math.abs(dx) > TAP_MOVE) moved = true;
      const now = (ev && ev.timeStamp) || performance.now();
      lastDx = clientX - lastX;
      lastDt = Math.max(1, now - lastT);
      lastX = clientX; lastT = now;
      active = startActive - dx / STEP;  // 往左拖 => 往后翻
      render();
    }
    function onUp(clientX, clientY) {
      if (!dragging) return;
      dragging = false;
      viewport.removeAttribute("data-dragging");
      if (!moved) {
        // 点选命中：指针捕获后 pointerup.target 会被重定向到 viewport，不能再用 e.target。
        // 优先用按下时记下的那张牌，兜底用坐标命中。
        let card = downCard;
        if (!card) {
          const el = document.elementFromPoint(clientX, clientY);
          card = el && el.closest ? el.closest("[data-slot]") : null;
        }
        if (card) toggle(Number(card.dataset.slot));
        snapNow();
        return;
      }
      if (reduced) { snapNow(); return; }
      // 惯性：把最后的指针速度换成张/帧
      const vpx = lastDx / lastDt;            // px/ms
      vel = clamp(-vpx * 16 / STEP, -2.4, 2.4); // 张/帧（约 60fps）
      stopRaf();
      raf = requestAnimationFrame(coast);
    }

    viewport.addEventListener("pointerdown", (e) => {
      if (e.button !== undefined && e.button !== 0) return;
      if (activePointerId !== null) return;      // 已有一根手指在操作，忽略后来的手指
      activePointerId = e.pointerId;
      onDown(e.clientX, e);
      // 捕获放在最后并容错：合成事件/旧环境下 setPointerCapture 可能抛错，
      // 不能因此挡掉拖拽本身。
      try { viewport.setPointerCapture(e.pointerId); } catch (_) {}
    });
    viewport.addEventListener("pointermove", (e) => {
      if (activePointerId !== null && e.pointerId !== activePointerId) return;
      onMove(e.clientX, e);
    });
    viewport.addEventListener("pointerup", (e) => {
      if (activePointerId !== null && e.pointerId !== activePointerId) return;
      onUp(e.clientX, e.clientY);
      activePointerId = null;
      try { viewport.releasePointerCapture(e.pointerId); } catch (_) {}
    });
    viewport.addEventListener("pointercancel", (e) => {
      if (activePointerId !== null && e.pointerId !== activePointerId) return;
      dragging = false; activePointerId = null;
      viewport.removeAttribute("data-dragging"); snapNow();
    });

    // 键盘：←/→ 拨动，空格/回车选中当前中心那张
    viewport.addEventListener("keydown", (e) => {
      if (e.key === "ArrowLeft") { stopRaf(); active = Math.round(active) - 1; render(); e.preventDefault(); }
      else if (e.key === "ArrowRight") { stopRaf(); active = Math.round(active) + 1; render(); e.preventDefault(); }
      else if (e.key === " " || e.key === "Enter") {
        const i = ((Math.round(active) % n) + n) % n;
        toggle(i); e.preventDefault();
      }
    });

    revealBtn.addEventListener("click", () => {
      if (picked.length !== count) return;
      const chosen = picked.map((i) => cards[i]);
      if (opts.onReveal) opts.onReveal(chosen);
    });
  }

  window.CardPicker = { mount: mount };
})();
