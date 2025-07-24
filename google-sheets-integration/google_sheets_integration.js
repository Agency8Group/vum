/**
 * ===== Google Apps Script - 메시지 전송 시스템 =====
 * 
 * 핵심 기능:
 * 1. HTML 폼에서 메시지 받기
 * 2. 메시지를 Google Sheets에 저장
 * 3. CORS 설정 및 에러 처리
 * 
 * ===== 필수 설정 (절대 지우지 마세요!) =====
 * - doPost(): POST 요청 처리 (핵심!)
 * - doOptions(): CORS preflight 처리 (핵심!)
 * - createResponse(): CORS 헤더 설정 (핵심!)
 */

/**
 * ===== 웹 앱 배포용 함수 (절대 지우지 마세요!) =====
 * HTML 페이지를 반환합니다.
 */
function doGet() {
  return HtmlService.createHtmlOutputFromFile('index.html')
    .setTitle('메시지 전송')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/**
 * ===== 핵심: POST 요청 처리 함수 (절대 수정하지 마세요!) =====
 * HTML 폼에서 전송된 메시지를 받아서 Google Sheets에 저장합니다.
 */
function doPost(e) {
  // 로그 기록 시작
  Logger.log("=== 메시지 수신 시작 ===");
  Logger.log("요청 시간: " + new Date().toString());
  
  try {
    // ===== 1. POST 데이터 파싱 (절대 수정하지 마세요!) =====
    const postData = e.postData.contents;
    Logger.log("받은 데이터: " + postData);
    
    const data = JSON.parse(postData);
    Logger.log("파싱된 데이터: " + JSON.stringify(data));
    
    // ===== 2. 데이터 유효성 검사 (필드 추가 시 여기서 수정) =====
    if (!data.message) {
      throw new Error("메시지가 누락되었습니다.");
    }
    
    // ===== 추가 필드 검사 예시 (필요시 주석 해제) =====
    // if (!data.name) {
    //   throw new Error("이름이 누락되었습니다.");
    // }
    // if (!data.email) {
    //   throw new Error("이메일이 누락되었습니다.");
    // }
    
    // ===== 3. Google Sheets에 메시지 저장 =====
    const result = saveToSheet(data);
    
    // ===== 4. 성공 응답 반환 =====
    Logger.log("=== 메시지 저장 성공 ===");
    return createResponse({
      success: true,
      message: "메시지가 성공적으로 저장되었습니다.",
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    // ===== 5. 에러 처리 및 응답 =====
    Logger.log("=== 에러 발생 ===");
    Logger.log("에러 내용: " + error.toString());
    
    return createResponse({
      success: false,
      message: "메시지 저장 중 오류가 발생했습니다: " + error.message
    });
  }
}

/**
 * ===== 메시지를 Google Sheets에 저장하는 함수 =====
 * 시트 이름과 컬럼 구조를 여기서 수정할 수 있습니다.
 */
function saveToSheet(data) {
  try {
    // 활성 스프레드시트 가져오기
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    
    // ===== 시트 이름 설정 (필요시 수정) =====
    const sheetName = '메시지';  // ← 시트 이름을 여기서 변경
    
    // 시트 가져오기 (없으면 생성)
    let sheet = spreadsheet.getSheetByName(sheetName);
    if (!sheet) {
      sheet = spreadsheet.insertSheet(sheetName);
      
      // ===== 헤더 설정 (필드 추가 시 여기서 수정) =====
      const headers = ['타임스탬프', '메시지'];  // ← 컬럼 헤더를 여기서 수정
      
      // ===== 추가 필드 헤더 예시 (필요시 주석 해제) =====
      // const headers = ['타임스탬프', '이름', '이메일', '메시지'];
      
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      
      // 헤더 스타일링
      sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
      sheet.getRange(1, 1, 1, headers.length).setBackground('#f0f0f0');
    }
    
    // ===== 데이터 행 구성 (필드 추가 시 여기서 수정) =====
    const rowData = [
      new Date(),           // A열: 타임스탬프
      data.message || ''    // B열: 메시지
    ];
    
    // ===== 추가 필드 데이터 예시 (필요시 주석 해제) =====
    // const rowData = [
    //   new Date(),           // A열: 타임스탬프
    //   data.name || '',      // B열: 이름
    //   data.email || '',     // C열: 이메일
    //   data.message || ''    // D열: 메시지
    // ];
    
    sheet.appendRow(rowData);
    
    Logger.log("메시지 저장 완료: " + JSON.stringify(rowData));
    return true;
    
  } catch (error) {
    Logger.log("시트 저장 에러: " + error.toString());
    throw new Error("Google Sheets 저장 실패: " + error.message);
  }
}

/**
 * ===== 핵심: JSON 응답 생성 함수 (절대 수정하지 마세요!) =====
 * CORS 헤더를 설정하여 브라우저에서 접근할 수 있게 합니다.
 */
function createResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON)
    .setHeader('Access-Control-Allow-Origin', '*')           // ← CORS 핵심!
    .setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')  // ← CORS 핵심!
    .setHeader('Access-Control-Allow-Headers', 'Content-Type');       // ← CORS 핵심!
}

/**
 * ===== 핵심: OPTIONS 요청 처리 (절대 수정하지 마세요!) =====
 * CORS preflight 요청을 처리합니다.
 */
function doOptions(e) {
  return ContentService.createTextOutput('')
    .setHeader('Access-Control-Allow-Origin', '*')           // ← CORS 핵심!
    .setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')  // ← CORS 핵심!
    .setHeader('Access-Control-Allow-Headers', 'Content-Type')        // ← CORS 핵심!
    .setHeader('Access-Control-Max-Age', '86400');                    // ← CORS 캐시!
}

/**
 * ===== 테스트용 함수 =====
 * 수동으로 메시지 저장을 테스트할 수 있습니다.
 */
function testSaveMessage() {
  const testData = {
    message: "테스트 메시지입니다.",
    timestamp: new Date().toISOString()
  };
  
  // ===== 추가 필드 테스트 예시 (필요시 주석 해제) =====
  // const testData = {
  //   name: "테스트 사용자",
  //   email: "test@example.com",
  //   message: "테스트 메시지입니다.",
  //   timestamp: new Date().toISOString()
  // };
  
  try {
    const result = saveToSheet(testData);
    Logger.log("테스트 성공: " + result);
    return result;
  } catch (error) {
    Logger.log("테스트 실패: " + error.toString());
    return false;
  }
}

/**
 * ===== 현재 시트 상태 확인 함수 =====
 * 시트가 제대로 생성되었는지 확인할 수 있습니다.
 */
function checkSheetStatus() {
  try {
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const sheetName = '메시지';  // ← 시트 이름을 여기서 확인
    const sheet = spreadsheet.getSheetByName(sheetName);
    
    if (!sheet) {
      Logger.log("'" + sheetName + "' 시트가 존재하지 않습니다.");
      return false;
    }
    
    const lastRow = sheet.getLastRow();
    Logger.log("현재 메시지 수: " + lastRow);
    
    if (lastRow > 0) {
      const headers = sheet.getRange('A1:B1').getValues()[0];  // ← 컬럼 수를 여기서 수정
      Logger.log("헤더: " + headers.join(', '));
    }
    
    return true;
  } catch (error) {
    Logger.log("시트 상태 확인 실패: " + error.toString());
    return false;
  }
}

/**
 * ===== 배포 설정 확인 함수 =====
 * 현재 배포 상태를 확인할 수 있습니다.
 */
function checkDeployment() {
  Logger.log("=== 배포 설정 확인 ===");
  Logger.log("스크립트 ID: " + ScriptApp.getScriptId());
  Logger.log("현재 사용자: " + Session.getActiveUser().getEmail());
  Logger.log("스프레드시트 ID: " + SpreadsheetApp.getActiveSpreadsheet().getId());
  Logger.log("=====================");
}

/**
 * ===== 추가 기능 예시 (필요시 주석 해제) =====
 */

/*
// 이메일 알림 기능
function sendEmailNotification(data) {
  const recipient = "admin@example.com";
  const subject = "새 메시지 수신";
  const body = `
    새 메시지가 수신되었습니다.
    
    메시지: ${data.message}
    시간: ${new Date().toLocaleString()}
  `;
  
  MailApp.sendEmail(recipient, subject, body);
}

// 데이터 백업 기능
function backupData() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('메시지');
  const data = sheet.getDataRange().getValues();
  
  // 백업 시트 생성
  const backupSheet = SpreadsheetApp.getActiveSpreadsheet().insertSheet('백업_' + new Date().toISOString().split('T')[0]);
  backupSheet.getRange(1, 1, data.length, data[0].length).setValues(data);
}

// 데이터 정리 기능
function cleanupOldData() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('메시지');
  const lastRow = sheet.getLastRow();
  
  // 30일 이상 된 데이터 삭제
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - 30);
  
  for (let i = lastRow; i > 1; i--) {
    const dateValue = sheet.getRange(i, 1).getValue();
    if (dateValue < cutoffDate) {
      sheet.deleteRow(i);
    }
  }
}
*/ 