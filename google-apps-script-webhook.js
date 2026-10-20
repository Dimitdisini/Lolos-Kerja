/**
 * =========================================================================
 * GOOGLE APPS SCRIPT WEBHOOK: LOLOS KERJA MASTER DATABASE (V2.1 - SECURED)
 * =========================================================================
 * Arsitektur: Dimitri HQ (PT Xavortree Digital Solution & PT Fleek Group)
 * Versi: 2.1.0 (Token Authenticated & Safe Variable Scoping)
 * =========================================================================
 */

// Secret token for authenticated webhook calls (Set this in Script Properties in production)
var EXPECTED_WEBHOOK_SECRET = PropertiesService.getScriptProperties().getProperty('WEBHOOK_SECRET') || 'LK_SECURE_TOKEN_2026';

function doPost(e) {
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(10000)) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'ERROR', message: 'Server busy, lock acquisition failed' }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  try {
    if (!e || !e.postData || !e.postData.contents) {
      return ContentService.createTextOutput(JSON.stringify({ status: 'ERROR', message: 'No payload provided' }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    var rawData = e.postData.contents;
    var data = JSON.parse(rawData);
    
    // 1. AUTHENTICATION TOKEN VERIFICATION (Anti-Open Relay)
    if (!data.token || data.token !== EXPECTED_WEBHOOK_SECRET) {
      return ContentService.createTextOutput(JSON.stringify({ status: 'ERROR', message: 'Unauthorized webhook call: Invalid security token' }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    var action = data.action;
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var now = new Date();
    var formattedDate = Utilities.formatDate(now, "Asia/Jakarta", "yyyy-MM-dd HH:mm:ss");

    if (action === 'REGISTER_OR_LOGIN_USER') {
      var sheet = ss.getSheetByName('Users') || ss.insertSheet('Users');
      if (sheet.getLastRow() === 0) {
        sheet.appendRow(['Timestamp', 'Nama Lengkap', 'Email Akun', 'Tier Paket', 'Sisa Kuota', 'Status Akun', 'Avatar URL']);
      }

      var rows = sheet.getDataRange().getValues();
      var foundIndex = -1;
      for (var i = 1; i < rows.length; i++) {
        var rowEmail = rows[i][2] ? rows[i][2].toString().toLowerCase() : (rows[i][1] ? rows[i][1].toString().toLowerCase() : '');
        if (rowEmail === data.email.toLowerCase()) {
          foundIndex = i + 1;
          break;
        }
      }

      if (foundIndex > 0) {
        sheet.getRange(foundIndex, 1).setValue(formattedDate);
        sheet.getRange(foundIndex, 2).setValue(data.name || rows[foundIndex - 1][1]);
        if (data.tier) sheet.getRange(foundIndex, 4).setValue(data.tier);
        if (data.quota !== undefined) sheet.getRange(foundIndex, 5).setValue(data.quota);
        if (data.status) sheet.getRange(foundIndex, 6).setValue(data.status);
      } else {
        sheet.appendRow([
          formattedDate,
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
        sheet.appendRow(['Timestamp', 'Order ID', 'Nama Pelamar', 'Email', 'Paket', 'Nominal', 'Metode Bayar', 'Status']);
      }

      sheet.appendRow([
        formattedDate,
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
      var nextLogId = 'BLG-' + (sheet.getLastRow() + 10000);
      var userIdentifier = data.applicantEmail || data.applicantName || 'USR-1001';
      var catatanAts = data.subject || 'CV ATS Terlampir';

      sheet.appendRow([
        nextLogId,
        userIdentifier,
        data.targetCompany || '-',
        data.position || '-',
        data.recruiterEmail || '-',
        formattedDate,
        'TERKIRIM',
        catatanAts
      ]);

      // SCOPED EMAIL VARIABLES (Anti ReferenceError)
      var emailSentStatus = false;
      var emailError = '';
      var emailSubject = data.subject || ('Lamaran Pekerjaan: ' + (data.position || '') + ' - ' + (data.applicantName || 'Dimitri Ahmad'));
      var emailBody = data.body || ('Yth. Tim Rekrutmen ' + (data.targetCompany || '') + ',\n\nTerlampir surat lamaran dan CV saya untuk posisi ' + (data.position || '') + '.\n\nHormat saya,\n' + (data.applicantName || 'Dimitri Ahmad'));

      if (data.sendRealEmail && data.recruiterEmail) {
        try {
          GmailApp.sendEmail(data.recruiterEmail, emailSubject, emailBody, {
            name: data.applicantName || 'Dimitri Ahmad',
            replyTo: data.applicantEmail || 'dimitriahmad000@gmail.com'
          });
          emailSentStatus = true;
        } catch(mailErr) {
          try {
            MailApp.sendEmail({
              to: data.recruiterEmail,
              subject: emailSubject,
              body: emailBody,
              name: data.applicantName || 'Dimitri Ahmad',
              replyTo: data.applicantEmail || 'dimitriahmad000@gmail.com'
            });
            emailSentStatus = true;
          } catch(fallbackErr) {
            emailError = fallbackErr.toString();
            console.error('MailApp send error:', fallbackErr);
          }
        }
      }

      return ContentService.createTextOutput(JSON.stringify({ 
        status: 'SUCCESS', 
        message: 'Blast log saved',
        logId: nextLogId,
        emailSent: emailSentStatus,
        emailError: emailError
      })).setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService.createTextOutput(JSON.stringify({ status: 'ERROR', message: 'Unknown action' }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'ERROR', message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}
