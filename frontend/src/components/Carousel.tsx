import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";

/**
 * 가로로 넘기는 카드 목록. 양 끝 화살표로 한 화면씩 넘기고, 처음·끝에서는 해당 화살표를 숨긴다.
 * 터치 화면에서는 손가락으로 밀어 넘긴다 (스크롤 스냅).
 */
export function Carousel({ label, children }: { label: string; children: ReactNode }) {
  const track = useRef<HTMLDivElement>(null);
  const [edge, setEdge] = useState({ start: true, end: true });

  const update = useCallback(() => {
    const el = track.current;
    if (!el) return;
    setEdge({
      start: el.scrollLeft <= 1,
      end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 1,
    });
  }, []);

  // 창 크기가 바뀌면 넘길 내용이 생기거나 없어지므로 화살표 상태를 다시 계산한다.
  useEffect(() => {
    update();
    const el = track.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, [update]);

  const move = (direction: -1 | 1) => {
    const el = track.current;
    el?.scrollBy({ left: direction * el.clientWidth, behavior: "smooth" });
  };

  return (
    <div className="carousel" role="region" aria-roledescription="carousel" aria-label={label}>
      <div className="carousel-track" ref={track} onScroll={update}>
        {children}
      </div>
      {edge.start ? null : (
        <button className="carousel-button prev" aria-label="이전" onClick={() => move(-1)}>
          <span aria-hidden="true">‹</span>
        </button>
      )}
      {edge.end ? null : (
        <button className="carousel-button next" aria-label="다음" onClick={() => move(1)}>
          <span aria-hidden="true">›</span>
        </button>
      )}
    </div>
  );
}
