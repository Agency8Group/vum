# 메시지 전송 시스템 설정 가이드

## 📋 개요
HTML 폼에서 메시지를 입력하면 Google Sheets에 저장하는 시스템입니다.

## 🚀 필수 설정 순서

### 1단계: Google Apps Script 프로젝트 생성
1. https://script.google.com 접속
2. "새 프로젝트" 클릭
3. `google_sheets_integration.js` 내용을 **전체 복사**하여 붙여넣기
4. 저장 (Ctrl+S)

### 2단계: Google Sheets 생성
1. https://sheets.google.com 접속
2. "빈 스프레드시트" 생성
3. 스프레드시트 이름 설정

### 3단계: 웹 앱 배포
1. Google Apps Script에서 "배포" → "새 배포" → "웹 앱"
2. 권한 설정 후 URL 복사

### 4단계: HTML 연결
1. `index.html`에서 `SCRIPT_URL` 업데이트
2. 테스트

## 🔧 핵심 작동 원리

### 1. HTML에서 메시지 수집
```javascript
const payload = {
    message: formData.get('message'),
    timestamp: new Date().toISOString()
};
```

### 2. fetch API로 Google Apps Script 호출 (핵심!)
```javascript
const response = await fetch(SCRIPT_URL, {
    method: 'POST',
    mode: 'no-cors',  // ← 이게 핵심! CORS 오류 무시
    headers: {
        'Content-Type': 'text/plain',  // ← 이게 핵심! Google Apps Script가 받을 수 있는 형식
    },
    body: JSON.stringify(payload)
});
```

### 3. Google Apps Script에서 doPost 함수 처리
```javascript
function doPost(e) {
    const data = JSON.parse(e.postData.contents);
    const result = saveToSheet(data);
    return createResponse({ success: true, message: "성공" });
}
```

### 4. Google Sheets에 메시지 저장
```javascript
function saveToSheet(data) {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('메시지');
    const rowData = [
        new Date(),           // 타임스탬프
        data.message || ''    // 메시지
    ];
    sheet.appendRow(rowData);
}
```

### 5. CORS 설정 (핵심!)
```javascript
return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON)
    .setHeader('Access-Control-Allow-Origin', '*')           // ← CORS 핵심!
    .setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')  // ← CORS 핵심!
    .setHeader('Access-Control-Allow-Headers', 'Content-Type');       // ← CORS 핵심!
```

## ❌ API가 작동하지 않는 주요 이유

### 1. CORS 문제 (가장 중요!)
**문제**: `mode: "no-cors"` 설정이 없으면 CORS 오류 발생
**해결**: 반드시 `mode: "no-cors"` 사용

### 2. Content-Type 불일치
**문제**: `application/json`으로 전송하면 Google Apps Script가 받지 못함
**해결**: 반드시 `text/plain` 사용

### 3. 배포 설정 문제
**문제**: 웹 앱으로 배포되지 않음
**해결**: 올바른 배포 설정 및 권한 승인

### 4. 스프레드시트 권한 문제
**문제**: 스프레드시트에 쓰기 권한 없음
**해결**: 스프레드시트 공유 설정 확인

## 🛠️ 문제 해결 방법

### 1. 로그 확인
```javascript
// Google Apps Script에서 실행
function checkLogs() {
    Logger.log("테스트 로그");
    console.log("콘솔 로그");
}
```

### 2. 배포 상태 확인
```javascript
function checkDeployment() {
    Logger.log("스크립트 ID: " + ScriptApp.getScriptId());
    Logger.log("현재 사용자: " + Session.getActiveUser().getEmail());
}
```

### 3. 시트 연결 확인
```javascript
function checkSheetStatus() {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('메시지');
    Logger.log("시트 존재: " + (sheet ? "예" : "아니오"));
}
```

## 📝 최소한의 작동 코드

### HTML (핵심 부분)
```html
<form id="dataForm">
    <textarea name="message" required></textarea>
    <button type="submit">전송</button>
</form>

<script>
document.getElementById('dataForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const payload = {
        message: formData.get('message'),
        timestamp: new Date().toISOString()
    };
    
    const response = await fetch('YOUR_SCRIPT_URL', {
        method: 'POST',
        mode: 'no-cors',  // ← 핵심!
        headers: { 'Content-Type': 'text/plain' },  // ← 핵심!
        body: JSON.stringify(payload)
    });
    
    alert('성공!');
    e.target.reset();
});
</script>
```

### Google Apps Script (핵심 부분)
```javascript
function doPost(e) {
    try {
        const data = JSON.parse(e.postData.contents);
        const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('메시지');
        
        if (!sheet) {
            sheet = SpreadsheetApp.getActiveSpreadsheet().insertSheet('메시지');
            sheet.getRange('A1:B1').setValues([['타임스탬프', '메시지']]);
        }
        
        sheet.appendRow([new Date(), data.message]);
        
        return ContentService.createTextOutput(JSON.stringify({ success: true }))
            .setMimeType(ContentService.MimeType.JSON)
            .setHeader('Access-Control-Allow-Origin', '*');  // ← 핵심!
    } catch (error) {
        return ContentService.createTextOutput(JSON.stringify({ success: false, error: error.message }))
            .setMimeType(ContentService.MimeType.JSON)
            .setHeader('Access-Control-Allow-Origin', '*');  // ← 핵심!
    }
}

function doOptions(e) {
    return ContentService.createTextOutput('')
        .setHeader('Access-Control-Allow-Origin', '*')  // ← 핵심!
        .setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')  // ← 핵심!
        .setHeader('Access-Control-Allow-Headers', 'Content-Type');  // ← 핵심!
}
```

## ✅ 성공적인 연동을 위한 체크리스트

- [ ] Google Apps Script 프로젝트 생성 완료
- [ ] Google Sheets 생성 및 연결 완료
- [ ] 웹 앱 배포 완료 (올바른 권한 설정)
- [ ] HTML 파일의 SCRIPT_URL 업데이트 완료
- [ ] `mode: "no-cors"` 설정 완료
- [ ] `Content-Type: "text/plain"` 설정 완료
- [ ] CORS 헤더 설정 완료
- [ ] 테스트 실행 및 검증 완료

## 🔄 필드 추가 방법

### HTML에서 필드 추가
```html
<!-- 추가 필드 예시 -->
<div class="form-group">
    <label for="name">이름</label>
    <input type="text" id="name" name="name" placeholder="이름을 입력하세요">
</div>
```

### JavaScript에서 데이터 수집 추가
```javascript
const payload = {
    message: formData.get('message'),
    name: formData.get('name'),  // ← 추가
    timestamp: new Date().toISOString()
};
```

### Google Apps Script에서 처리 추가
```javascript
// 유효성 검사 추가
if (!data.name) {
    throw new Error("이름이 누락되었습니다.");
}

// 헤더 수정
const headers = ['타임스탬프', '이름', '메시지'];

// 데이터 행 수정
const rowData = [
    new Date(),
    data.name || '',
    data.message || ''
];
```

이 가이드를 따라하면 안정적인 메시지 전송 시스템을 구축할 수 있습니다! 