import { useState } from "react";
import { safeLink } from "@/utils";

/** 인물 사진. 사진이 없거나 로딩에 실패하면 이름 끝 두 글자를 대신 보여 준다. */
export function Portrait({
  name,
  src,
  alt,
  className = "",
}: {
  name: string;
  src: string | null | undefined;
  alt: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const url = safeLink(src);
  return (
    <div className={`portrait ${className}`}>
      <span aria-hidden="true">{name.slice(-2) || "KBO"}</span>
      {url ? (
        <img
          src={url}
          width="94"
          height="118"
          loading="lazy"
          alt={alt}
          hidden={failed}
          onError={() => setFailed(true)}
        />
      ) : null}
    </div>
  );
}
