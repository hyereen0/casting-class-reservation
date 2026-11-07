# Cloudflare Pages 배포

## 연결

1. Cloudflare 대시보드에서 **Workers & Pages → Create → Pages → Connect to Git**을 선택하고 GitHub 저장소 `hyereen0/casting-class-reservation`을 연결합니다.
2. Framework preset은 **None**, Build command는 비워 두고 Build output directory는 `.`으로 설정합니다. 저장소의 `wrangler.toml`이 Pages 출력 디렉터리를 지정합니다.
3. 프로젝트의 **Settings → Variables and Secrets**에서 Production과 Preview 환경 모두 다음 값을 추가합니다.
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` — 반드시 Secret으로 저장하고 브라우저 코드에 넣지 않습니다.
4. 배포가 끝나면 Cloudflare가 제공하는 `*.pages.dev` 주소에서 아래 항목을 확인합니다.

## 배포 후 확인

- 로그인 및 예약 목록 조회
- 예약 생성, 취소 및 입·퇴실 상태 변경
- 관리자 계정의 학생 계정 생성, 목록, 비밀번호 초기화 및 삭제
- 모바일 화면과 서비스 워커 캐시

사진 기능은 사용하지 않는 상태이며 Pages Functions에 사진 API를 배포하지 않습니다. 앱은 예약별 사진 조회 API를 호출하지 않습니다.

모든 항목이 정상 동작하는 것을 확인한 뒤에만 도메인 DNS를 새 Pages 프로젝트로 변경하세요. Vercel 프로젝트는 이전 검증이 끝날 때까지 삭제하거나 유료 플랜으로 전환할 필요가 없습니다.
