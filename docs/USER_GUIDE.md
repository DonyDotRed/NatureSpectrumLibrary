# NatureSpectrumLibrary 사용자 가이드

## 시작

1. 웹사이트를 엽니다.
2. 사용자에게 별도로 전달된 초기 비밀번호를 입력합니다.
3. 데이터 복호화가 성공하면 Overview가 표시됩니다.

> 초기 비밀번호가 짧다면 실제 배포 전 더 긴 passphrase로 재암호화하는 것을 권장합니다.

## 가장 권장하는 사용 순서

1. **Energy Finder**: 관측 에너지와 허용오차 입력
2. 후보 행 클릭 → 해당 핵종의 다른 감마선 확인
3. **Origins**: 발생원 맥락 확인
4. **Chemical Forms**: 화학형태와 시료 분배·전처리 확인
5. **Sample Matrix**: 실제 시료에서의 타당성 확인
6. **Detector Lab**: 장비 분해능으로 두 선이 실제 분리 가능한지 검토
7. 시간 변화가 있으면 **Half-life Lab** 사용
8. **References** 및 최신 핵데이터로 최종 재검증

## 편의 기능

- `Ctrl/Cmd + K`: 전역 검색
- `/`: 검색창 포커스
- `Esc`: 상세 패널 닫기
- Light/Dark 테마 저장
- MASTER 행 즐겨찾기(localStorage)
- 필터 결과 CSV 저장
- Workbook Browser에서 13개 시트 원본 셀 보기

## 로컬 실행

보안 정책상 `file://`로 직접 열지 말고 간단한 HTTP 서버를 사용하십시오.

```bash
python -m http.server 8000 -d site
```

브라우저에서 `http://localhost:8000`을 엽니다.
