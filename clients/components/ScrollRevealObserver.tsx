import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

/* Trigger when element is within ~100px of viewport (animations run as you scroll up or down) */
const VIEW_MARGIN = "0px 0px 100px 0px";
const THRESHOLD = 0.05;
const BOTTOM_MARGIN_PX = 100;

/** Check if element is in or near the viewport (for first-load visibility) */
function isInViewport(el: Element): boolean {
  const rect = el.getBoundingClientRect();
  const top = rect.top;
  const bottom = rect.bottom;
  const vh = window.innerHeight;
  return top < vh + BOTTOM_MARGIN_PX && bottom > -BOTTOM_MARGIN_PX;
}

function observeReveals() {
  const els = document.querySelectorAll(".scroll-reveal, .section-reveal");
  if (els.length === 0) return null;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("in-view");
        } else {
          entry.target.classList.remove("in-view");
        }
      });
    },
    { rootMargin: VIEW_MARGIN, threshold: THRESHOLD }
  );

  els.forEach((el) => {
    observer.observe(el);
    if (isInViewport(el)) el.classList.add("in-view");
  });
  return observer;
}

/** Observe section connectors for scroll-flow: add connector-in-view when in viewport */
function observeConnectors() {
  const els = document.querySelectorAll(".section-connector");
  if (els.length === 0) return null;
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("connector-in-view");
        } else {
          entry.target.classList.remove("connector-in-view");
        }
      });
    },
    { rootMargin: "80px 0px 80px 0px", threshold: 0 }
  );
  els.forEach((el) => {
    observer.observe(el);
    if (isInViewport(el)) el.classList.add("connector-in-view");
  });
  return observer;
}

export function ScrollRevealObserver() {
  const location = useLocation();
  const observerRef = useRef<IntersectionObserver | null>(null);
  const connectorObserverRef = useRef<IntersectionObserver | null>(null);
  const scrollRef = useRef({ y: 0, dir: 0, raf: 0 });

  /* Scroll position and direction for dynamic transitions (CSS vars + data attribute) */
  useEffect(() => {
    const doc = document.documentElement;
    let lastY = window.scrollY;
    let lastDir: "up" | "down" | null = null;

    const onScroll = () => {
      scrollRef.current.raf = scrollRef.current.raf || requestAnimationFrame(update);
    };
    const update = () => {
      scrollRef.current.raf = 0;
      const y = window.scrollY;
      const dir: "up" | "down" = y > lastY ? "down" : "up";
      doc.style.setProperty("--scroll-y", String(y));
      if (dir !== lastDir) {
        lastDir = dir;
        doc.setAttribute("data-scroll-direction", dir);
      }
      lastY = y;
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    update();

    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(scrollRef.current.raf);
      doc.style.removeProperty("--scroll-y");
      doc.removeAttribute("data-scroll-direction");
    };
  }, []);

  useEffect(() => {
    const run = () => {
      observerRef.current?.disconnect();
      observerRef.current = null;
      observerRef.current = observeReveals();

      connectorObserverRef.current?.disconnect();
      connectorObserverRef.current = null;
      connectorObserverRef.current = observeConnectors();
    };

    run();
    
    const timeouts: ReturnType<typeof setTimeout>[] = [];
    timeouts.push(setTimeout(run, 100));
    timeouts.push(setTimeout(run, 800));

    // MutationObserver to catch lazy-loaded components as they mount
    const mutObserver = new MutationObserver(() => {
      run();
    });
    mutObserver.observe(document.body, { childList: true, subtree: true });

    const onResize = () => run();
    const onLoad = () => run();
    window.addEventListener("resize", onResize);
    window.addEventListener("load", onLoad);
    if (document.readyState === "complete") onLoad();

    return () => {
      timeouts.forEach((id) => clearTimeout(id));
      window.removeEventListener("resize", onResize);
      window.removeEventListener("load", onLoad);
      mutObserver.disconnect();
      observerRef.current?.disconnect();
      observerRef.current = null;
      connectorObserverRef.current?.disconnect();
      connectorObserverRef.current = null;
    };
  }, [location.pathname]);

  return null;
}
