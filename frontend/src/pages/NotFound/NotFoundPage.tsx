import { Empty, NextLink } from "@/components";
import { ROUTES } from "@/constants";
import { to } from "@/utils";

/** 없는 주소. */
export function NotFoundPage() {
  return (
    <div className="wrap">
      <Empty title="페이지를 찾을 수 없습니다.">
        <NextLink to={to(ROUTES.HOME)}>홈으로</NextLink>
      </Empty>
    </div>
  );
}
