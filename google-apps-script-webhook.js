/**
 * =========================================================================
 * GOOGLE APPS SCRIPT WEBHOOK: LOLOS KERJA MASTER DATABASE (V2 - REALTIME EMAIL)
 * =========================================================================
 * Arsitektur: Dimitri HQ (PT Xavortree Digital Solution & PT Fleek Group)
 * Versi: 2.0.0 (Presisi Kolom Sesuai Template Spreadsheet + Auto Send Email)
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
    // Format tanggal Indonesia: YYYY-MM-DD HH:mm:ss
    var formattedDate = Utilities.formatDate(now, "Asia/Jakarta", "yyyy-MM-dd HH:mm:ss");

    if (action === 'REGISTER_OR_LOGIN_USER') {
      var sheet = ss.getSheetByName('Users') || ss.insertSheet('Users');
      if (sheet.getLastRow() === 0) {
        sheet.appendRow(['Timestamp', 'Nama Lengkap', 'Email Akun', 'Tier Paket', 'Sisa Kuota', 'Status Akun', 'Avatar URL']);
      }

      var rows = sheet.getDataRange().getValues();
      var foundIndex = -1;
      for (var i = 1; i < rows.length; i++) {
        // Cek kolom email (kolom 2 atau 3)
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
      
      // URUTAN PERSIS SESUAI HEADER SPREADSHEET DIMITRI:
      // Kolom A: Nama Pelamar (data.applicantName)
      // Kolom B: Email Pelamar (data.applicantEmail)
      // Kolom C: Perusahaan Target (data.targetCompany)
      // Kolom D: Posisi Dilamar (data.position)
      // Kolom E: Email HRD (data.recruiterEmail)
      // Kolom F: Tanggal Kirim (formattedDate)
      // Kolom G: Status Pengiriman ('TERKIRIM') -> Cocok dengan Dropdown Validasi Data
      // Kolom H: Catatan HRD (Subjek / Keterangan ATS)
      
      var catatanAts = data.subject || 'CV ATS Terlampir';

      sheet.appendRow([
        data.applicantName || 'Dimitri Ahmad',
        data.applicantEmail || 'dimitriahmad000@gmail.com',
        data.targetCompany,
        data.position,
        data.recruiterEmail,
        formattedDate,
        'TERKIRIM',
        catatanAts
      ]);

      // (OPSIONAL) Kirim email fisik via Gmail jika ada parameter sendRealEmail: true
      if (data.sendRealEmail && data.recruiterEmail && data.body) {
        try {
          MailApp.sendEmail({
            to: data.recruiterEmail,
            subject: data.subject || ('Lamaran Pekerjaan: ' + data.position + ' - ' + data.applicantName),
            body: data.body,
            name: data.applicantName || 'Dimitri Ahmad',
            replyTo: data.applicantEmail
          });
        } catch(mailErr) {
          console.warn('Mail send log:', mailErr);
        }
      }

      return ContentService.createTextOutput(JSON.stringify({ status: 'SUCCESS', message: 'Blast log saved with correct columns' }))
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
  var sheetBlast = ss.getSheetByName('BlastLogs');
  var blastCount = sheetBlast ? Math.max(0, sheetBlast.getLastRow() - 1) : 0;

  return ContentService.createTextOutput(JSON.stringify({
    status: 'ONLINE',
    service: 'Lolos Kerja Google Sheets Headless Database API v2',
    totalUsers: usersCount,
    totalTransactions: txCount,
    totalBlastLogs: blastCount,
    owner: 'Dimitri Ahmad (Dimitri HQ)'
  })).setMimeType(ContentService.MimeType.JSON);
}
