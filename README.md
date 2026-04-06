# owner_bot
# 사장봇 (SajangBot)
AI 기반 소상공인 마케팅 콘텐츠 자동 생성 SaaS

---

## 📌 시작하기

### 1. 클론
git clone https://github.com/gyullby11/owner_bot.git

cd owner_bot

### 2. 환경변수 세팅
cd backend
cp .env.example .env

→ .env 열어서 본인 OPENAI_API_KEY 직접 입력해줘
→ platform.openai.com 가입 후 API keys에서 발급 가능
→ 신규 가입 시 무료 크레딧 제공됨!

### 3. 실행
docker compose up
- 백엔드: http://localhost:8000
- API 문서: http://localhost:8000/docs

---

## 🌿 브랜치 규칙

| 브랜치 | 용도 | 직접 push |
|--------|------|-----------|
| main | 최종 배포 | ❌ 금지 |
| dev | 통합 개발 | ❌ 금지 |
| feature/기능명 | 개인 개발 | ✅ 가능 |

---

## 🔄 작업 순서 (매번)

### 작업 시작
git checkout dev

git pull origin dev

git checkout -b feature/기능이름

### 작업 완료 후
git add .
git commit -m "feat: 작업내용"
git push origin feature/기능이름

→ GitHub에서 PR 올리기 (base: dev)

→ 가영이 확인 후 머지

---

## ✍️ 커밋 메시지 규칙

| 태그 | 의미 |
|------|------|
| feat | 새 기능 |
| fix | 버그 수정 |
| docs | 문서 수정 |
| style | 코드 포맷 |
| refactor | 리팩토링 |

---

## ❌ 절대 금지

- main, dev에 직접 push
- .env 파일 커밋 (API 키 노출)

---

## 👥 팀원

| 이름 | 역할 |
|------|------|
| 유가영 | PM + AI/DevOps |
| 박동제 | Backend 1 |
| 이제민 | Frontend |
| 김정원 | Backend 2 / Infra |
| 유동주 | 기본 HTML 구성 + React 생성 |
