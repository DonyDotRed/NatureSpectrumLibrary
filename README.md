# NatureSpectrumLibrary

GitHub Pages에서 실행되는 정적 감마 핵종 탐색 웹 애플리케이션입니다. 첨부된 Energy-Axis Nuclide Library Excel의 13개 시트 내용을 암호화 데이터셋으로 서비스합니다.

## 제공 기능

- Password-gated encrypted dataset
- Energy Finder: 관측 에너지 → 근접 후보 Top 10
- MASTER 183 gamma-line explorer
- Detector Lab: FWHM(E), ΔE/FWHM separation
- Energy-band sheets 03–06
- Origin genealogy + NUREG-1465 content
- Chemical forms F01–F22
- Sample matrix / Integration matrix
- Half-life calculator
- 46 references
- Full 13-sheet Workbook Browser
- Light / Dark themes
- Search, filter, sort, favorites, CSV export
- Responsive layout + keyboard shortcuts

## 접근 비밀번호

비밀번호 값은 저장소 파일에 기록하지 않습니다. 사용자가 별도로 알고 있는 초기 비밀번호로 현재 암호화 payload가 생성되어 있습니다. 실제 운영 전 긴 passphrase로 변경하십시오.

## Local preview

```bash
python -m http.server 8000 -d site
```

Then open `http://localhost:8000`.

## Documentation

- `docs/NatureSpectrumLibrary_DESIGN_SPEC.md`
- `docs/USER_GUIDE.md`
- `docs/SECURITY.md`
- `docs/DEPLOY_GITHUB_PAGES.md`

## Windows convenience

Double-click `START_LOCAL_SERVER.bat` for local preview.

To rebuild the encrypted dataset:

```powershell
powershell -ExecutionPolicy Bypass -File tools/rebuild_dataset.ps1 -ExcelPath "C:\path\library.xlsx" -Password "your-long-passphrase"
```
