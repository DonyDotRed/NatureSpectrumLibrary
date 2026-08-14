# Security Notes

## 현재 구현

- 배포 폴더에는 원본 XLSX와 평문 JSON을 포함하지 않습니다.
- 데이터는 AES-256-GCM으로 암호화됩니다.
- PBKDF2-HMAC-SHA-256, 310,000 iterations로 비밀번호에서 키를 유도합니다.
- salt와 IV는 암호화 시 무작위 생성합니다.
- 비밀번호는 `app.js`에 하드코딩하지 않습니다.
- 복호화된 데이터는 JavaScript 메모리에만 존재합니다.

## 중요한 한계

GitHub Pages는 정적 호스팅이므로 일반적인 서버 세션 로그인이나 서버 측 비밀번호 검증을 제공하지 않습니다. 암호화 payload는 평문 데이터 노출을 줄이지만, 공격자는 ciphertext를 내려받아 오프라인 비밀번호 추측을 시도할 수 있습니다.

초기 비밀번호가 짧은 경우 실제 보안이 필요한 배포에서는 반드시 긴 passphrase로 변경하십시오.

## 재암호화

```bash
python tools/xlsx_to_json.py input.xlsx data.raw.json
NSL_PASSWORD='a-long-random-passphrase' node tools/encrypt_dataset.mjs data.raw.json site/assets/data/library.enc.json
rm data.raw.json
```

Windows PowerShell:

```powershell
python tools/xlsx_to_json.py input.xlsx data.raw.json
$env:NSL_PASSWORD="a-long-random-passphrase"
node tools/encrypt_dataset.mjs data.raw.json site/assets/data/library.enc.json
Remove-Item data.raw.json
```

## 더 강한 접근 제어

조직용 GitHub Enterprise Cloud의 private Pages access control, 사내 reverse proxy/VPN, Cloudflare Access 등 서버 측 인증 계층을 검토하십시오.
