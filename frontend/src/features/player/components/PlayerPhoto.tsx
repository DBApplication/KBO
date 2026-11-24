import { Portrait } from "@/components";

/** 선수 사진 (없거나 실패하면 이름 끝 두 글자). */
export function PlayerPhoto({ name, src, className }: { name: string; src: string | null | undefined; className?: string }) {
  return <Portrait name={name} src={src} alt={`${name} 선수 사진`} className={className} />;
}
