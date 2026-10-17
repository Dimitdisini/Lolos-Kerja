/**
 * =========================================================================
 * GOOGLE APPS SCRIPT WEBHOOK: LOLOS KERJA MASTER DATABASE
 * =========================================================================
 * Arsitektur: Dimitri HQ (PT Xavortree Digital Solution & PT Fleek Group)
 * Versi: 1.0.0 (Production Headless Sheet API)
 *
 * CARA SETUP:
 * 1. Buka https://sheets.new di akun Google Dimitri
 * 2. Beri nama Spreadsheet: "Lolos Kerja Master Database"
 * 3. Buat 3 Sheet (Tab di bawah):
 *    - Sheet 1: "Users"
 *      Header baris 1: Timestamp | Name | Email | Tier | Quota | Status | Avatar
 *    - Sheet 2: "Transactions"
 *      Header baris 1: Timestamp | OrderId | Name | Email | Plan | Amount | Method | Status
 *    - Sheet 3: "BlastLogs"
 *      Header baris 1: Timestamp | ApplicantName | ApplicantEmail | TargetCompany | RecruiterEmail | Position | Subject | Status
 * 4. Klik menu Extensions -> Apps Script
 * 5. Hapus kode bawaan, lalu paste SELURUH kode di bawah ini.
 * 6. Klik tombol "Deploy" (kanan atas) -> "New deployment"
 * 7. Pilih tipe: "Web app"
 *    - Execute as: "Me (dimitri.ahmad@gmail.com)"
 *    - Who has access: "Anyone" (PENTING agar web Vercel bisa kirim data)
 * 8. Klik "Deploy" -> Salin "Web App URL" (akhiran /exec).
 * =========================================================================
 */

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(10000);

  try {
    var rawData = e.postData.contents;
    var data = JSON.parse(rawData);
    var action = data.action;
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var now = new Date();

    if (action === 'REGISTER_OR_LOGIN_USER') {
      var sheet = ss.getSheetByName('Users') || ss.insertSheet('Users');
      if (sheet.getLastRow() === 0) {
        sheet.appendRow(['Timestamp', 'Name', 'Email', 'Tier', 'Quota', 'Status', 'Avatar']);
      }

      // Cek apakah email sudah terdaftar
      var rows = sheet.getDataRange().getValues();
      var foundIndex = -1;
      for (var i = 1; i < rows.length; i++) {
        if (rows[i][2] && rows[i][2].toString().toLowerCase() === data.email.toLowerCase()) {
          foundIndex = i + 1;
          break;
        }
      }

      if (foundIndex > 0) {
        // Update user
        sheet.getRange(foundIndex, 1).setValue(now);
        sheet.getRange(foundIndex, 2).setValue(data.name || rows[foundIndex - 1][1]);
        if (data.tier) sheet.getRange(foundIndex, 4).setValue(data.tier);
        if (data.quota !== undefined) sheet.getRange(foundIndex, 5).setValue(data.quota);
        if (data.status) sheet.getRange(foundIndex, 6).setValue(data.status);
      } else {
        // Insert new user
        sheet.appendRow([
          now,
          data.name || 'Pelamar Baru',
          data.email,
          data.tier || 'FREE',
          data.quota !== undefined ? data.quota : 0,
          data.status || 'Active',
          data.avatar || ''
        ]);
      }

      return ContentService.createTextOutput(JSON.stringify({ status: 'SUCCESS', message: 'User data synced' }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    else if (action === 'RECORD_TRANSACTION') {
      var sheet = ss.getSheetByName('Transactions') || ss.insertSheet('Transactions');
      if (sheet.getLastRow() === 0) {
        sheet.appendRow(['Timestamp', 'OrderId', 'Name', 'Email', 'Plan', 'Amount', 'Method', 'Status']);
      }

      sheet.appendRow([
        now,
        data.orderId,
        data.name,
        data.email,
        data.plan,
        data.amount,
        data.method || 'QRIS Livin Mandiri',
        data.status || 'SETTLED'
      ]);

      return ContentService.createTextOutput(JSON.stringify({ status: 'SUCCESS', message: 'Transaction recorded' }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    else if (action === 'RECORD_BLAST_LOG') {
      var sheet = ss.getSheetByName('BlastLogs') || ss.insertSheet('BlastLogs');
      if (sheet.getLastRow() === 0) {
        sheet.appendRow(['Timestamp', 'ApplicantName', 'ApplicantEmail', 'TargetCompany', 'RecruiterEmail', 'Position', 'Subject', 'Status']);
      }

      sheet.appendRow([
        now,
        data.applicantName,
        data.applicantEmail,
        data.targetCompany,
        data.recruiterEmail,
        data.position,
        data.subject,
        data.status || 'SENT_INBOX'
      ]);

      return ContentService.createTextOutput(JSON.stringify({ status: 'SUCCESS', message: 'Blast log saved' }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService.createTextOutput(JSON.stringify({ status: 'ERROR', message: 'Unknown action' }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'ERROR', error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

function doGet(e) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheetUsers = ss.getSheetByName('Users');
  var usersCount = sheetUsers ? Math.max(0, sheetUsers.getLastRow() - 1) : 0;
  var sheetTx = ss.getSheetByName('Transactions');
  var txCount = sheetTx ? Math.max(0, sheetTx.getLastRow() - 1) : 0;

  return ContentService.createTextOutput(JSON.stringify({
    status: 'ONLINE',
    service: 'Lolos Kerja Google Sheets Headless Database API',
    totalUsers: usersCount,
    totalTransactions: txCount,
    owner: 'Dimitri Ahmad (Dimitri HQ)'
  })).setMimeType(ContentService.MimeType.JSON);
}
