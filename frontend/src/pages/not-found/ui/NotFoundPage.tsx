import { to } from "@/shared/lib";
import { Empty, NextLink } from "@/shared/ui";

/** 없는 주소. */
export function NotFoundPage() {
  return (
    <div className="wrap">
      <Empty title="페이지를 찾을 수 없습니다.">
        <NextLink to={to("home")}>홈으로</NextLink>
      </Empty>
    </div>
  );
}
