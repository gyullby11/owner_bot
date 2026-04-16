# HTTPS 배포 가이드

이 문서는 EC2에서 `nginx + certbot`으로 HTTPS를 붙이는 순서입니다.

## 1. 사전 조건

- EC2에서 앱이 이미 떠 있어야 합니다.
- 도메인이 EC2 퍼블릭 IP를 가리켜야 합니다.
- 보안 그룹에서 `80`, `443` 포트가 열려 있어야 합니다.
- `backend/.env.prod`가 준비되어 있어야 합니다.

## 2. 도메인 값 수정

아래 파일에서 `example.com`, `www.example.com`을 실제 도메인으로 바꿉니다.

- `deploy/nginx/init.conf`
- `deploy/nginx/https.conf`

그리고 인증서 경로도 대표 도메인 기준으로 맞춥니다.

```nginx
ssl_certificate /etc/letsencrypt/live/example.com/fullchain.pem;
ssl_certificate_key /etc/letsencrypt/live/example.com/privkey.pem;
```

## 3. 초기 HTTP + 인증용 nginx 실행

```bash
docker compose -f docker-compose.https-init.yml up -d --build backend nginx
```

확인:

```bash
curl http://localhost/health
```

## 4. certbot으로 인증서 발급

```bash
docker compose -f docker-compose.https-init.yml run --rm certbot certonly \
  --webroot \
  -w /var/www/certbot \
  -d example.com \
  -d www.example.com \
  --email your-email@example.com \
  --agree-tos \
  --no-eff-email
```

## 5. HTTPS compose로 전환

```bash
docker compose -f docker-compose.https-init.yml down
docker compose -f docker-compose.https.yml up -d --build
```

확인:

```bash
curl -I http://example.com
curl -I https://example.com
```

## 6. 인증서 갱신

수동 갱신:

```bash
docker compose -f docker-compose.https.yml run --rm certbot renew
docker compose -f docker-compose.https.yml restart nginx
```

## 7. 주의할 점

- `backend/.env.prod`는 EC2 안에서만 생성합니다.
- 처음 발급할 때는 도메인 DNS가 먼저 EC2를 가리켜야 합니다.
- `https.conf`의 인증서 경로는 첫 번째 대표 도메인 기준입니다.
