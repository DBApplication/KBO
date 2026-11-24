import { useEffect, useRef, useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { choicesQuery } from "@/entities/record";
import { teamShort } from "@/entities/team";
import { useUrl } from "@/shared/lib";
import { Empty, SectionTitle } from "@/shared/ui";

/** 입력이 멈추고 delay 뒤의 값. */
function useDebounced<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

/**
 * 주소의 시즌·기록 종류에서 기록이 있는 선수를 이름으로 찾아 고르는 창.
 * excludeId(반대쪽에 이미 고른 선수)는 고를 수 없다.
 */
export function PlayerPicker({
  open,
  excludeId,
  onClose,
  onSelect,
}: {
  open: boolean;
  excludeId: number | undefined;
  onClose: () => void;
  onSelect: (playerId: number) => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const { kind, season } = useUrl();
  const [text, setText] = useState("");
  const keyword = useDebounced(text, 200);
  // 입력하는 동안에는 이전 결과를 그대로 보여 준다.
  const choices = useQuery({
    ...choicesQuery(kind, season, keyword),
    enabled: open,
    placeholderData: keepPreviousData,
  });

  useEffect(() => {
    const dialog = ref.current!;
    if (open) {
      setText("");
      if (!dialog.open) dialog.showModal();
    } else if (dialog.open) dialog.close();
  }, [open]);

  const rows = choices.data?.content;
  return (
    <dialog
      ref={ref}
      aria-labelledby="picker-title"
      onClose={onClose}
      // 창 바깥(배경)을 누르면 닫는다.
      onClick={(e) => e.target === ref.current && ref.current.close()}
    >
      {open ? (
        <>
          <SectionTitle title={<span id="picker-title">비교할 선수 선택</span>}>
            <button aria-label="닫기" onClick={() => ref.current?.close()}>
              닫기
            </button>
          </SectionTitle>
          <input
            type="search"
            aria-label="선수 또는 팀 이름"
            placeholder="선수 또는 팀 이름"
            autoFocus
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <div className="pick-list">
            {choices.isError ? (
              <Empty title="선수 목록을 불러오지 못했습니다." />
            ) : rows && !rows.length ? (
              <Empty title="조건에 맞는 선수가 없습니다." />
            ) : (
              (rows ?? []).map(({ player, team }) => {
                const same = excludeId === player.id;
                return (
                  <button
                    key={player.id}
                    disabled={same}
                    onClick={() => {
                      ref.current?.close();
                      onSelect(player.id);
                    }}
                  >
                    <strong>{player.name}</strong>
                    <span>
                      {teamShort(team)} · {same ? "이미 선택됨" : player.position || "포지션 미제공"}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </>
      ) : null}
    </dialog>
  );
}
