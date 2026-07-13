import { KisiKisiItem, Question } from '../types';

/**
 * Format string helper for bentuk soal
 */
export function getBentukSoalLabel(val: string): string {
  switch (val) {
    case 'pilihan_ganda_sederhana':
      return 'Pilihan Ganda Sederhana';
    case 'mcma':
      return 'Pilihan Ganda Kompleks (MCMA)';
    case 'kategori':
      return 'Pilihan Ganda Kompleks Kategori';
    default:
      return val;
  }
}

/**
 * Format string helper for level kognitif
 */
export function getLevelKognitifLabel(val: string): string {
  switch (val) {
    case 'level_1':
      return 'Pemahaman (Knowing)';
    case 'level_2':
      return 'Penerapan (Applying)';
    case 'level_3':
      return 'Penalaran (Reasoning)';
    default:
      return val;
  }
}

/**
 * Export Kisi-Kisi (Matriks Asesmen) to Excel (.xls)
 */
export function exportKisiToExcel(items: KisiKisiItem[], mataPelajaran: string) {
  const tableRows = items
    .map(
      (item) => `
    <tr>
      <td style="border: 1px solid #cccccc; padding: 8px; text-align: center;">${item.no}</td>
      <td style="border: 1px solid #cccccc; padding: 8px;">${getBentukSoalLabel(item.bentukSoal)}</td>
      <td style="border: 1px solid #cccccc; padding: 8px;">${getLevelKognitifLabel(item.levelKognitif)}</td>
      <td style="border: 1px solid #cccccc; padding: 8px;">${item.elemenMateri}</td>
      <td style="border: 1px solid #cccccc; padding: 8px;">${item.subElemenMateri}</td>
      <td style="border: 1px solid #cccccc; padding: 8px;">${item.kompetensi}</td>
      <td style="border: 1px solid #cccccc; padding: 8px;">${item.batasanCatatan || '-'}</td>
      <td style="border: 1px solid #cccccc; padding: 8px; text-align: center; font-weight: bold;">${item.jumlahSoal}</td>
    </tr>
  `
    )
    .join('');

  const totalSoal = items.reduce((sum, i) => sum + i.jumlahSoal, 0);

  const htmlContent = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <!--[if gte mso 9]>
      <xml>
        <x:ExcelWorkbook>
          <x:ExcelWorksheets>
            <x:ExcelWorksheet>
              <x:Name>Matriks Asesmen</x:Name>
              <x:WorksheetOptions>
                <x:DisplayGridlines/>
              </x:WorksheetOptions>
            </x:ExcelWorksheet>
          </x:ExcelWorksheets>
        </x:ExcelWorkbook>
      </xml>
      <![endif]-->
      <meta charset="utf-8">
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
        th { background-color: #3b82f6; color: white; font-weight: bold; }
      </style>
    </head>
    <body>
      <h2>MATRIKS ASESMEN KISI-KISI SOAL TKA SMA</h2>
      <p><b>Mata Pelajaran:</b> ${mataPelajaran}</p>
      <p><b>Tanggal Ekspor:</b> ${new Date().toLocaleDateString('id-ID')}</p>
      <br/>
      <table style="border-collapse: collapse; border: 1px solid #cccccc; width: 100%;">
        <thead>
          <tr style="background-color: #1e3a8a; color: white;">
            <th style="border: 1px solid #cccccc; padding: 10px; width: 50px;">No</th>
            <th style="border: 1px solid #cccccc; padding: 10px;">Bentuk Soal</th>
            <th style="border: 1px solid #cccccc; padding: 10px;">Tingkat Kognitif</th>
            <th style="border: 1px solid #cccccc; padding: 10px;">Elemen/Materi</th>
            <th style="border: 1px solid #cccccc; padding: 10px;">Sub-elemen/Submateri</th>
            <th style="border: 1px solid #cccccc; padding: 10px;">Kompetensi</th>
            <th style="border: 1px solid #cccccc; padding: 10px;">Batasan/Catatan</th>
            <th style="border: 1px solid #cccccc; padding: 10px; width: 80px;">Jumlah Soal</th>
          </tr>
        </thead>
        <tbody>
          ${tableRows}
          <tr style="background-color: #f3f4f6; font-weight: bold;">
            <td colspan="7" style="border: 1px solid #cccccc; padding: 8px; text-align: right;">Total Soal:</td>
            <td style="border: 1px solid #cccccc; padding: 8px; text-align: center;">${totalSoal}</td>
          </tr>
        </tbody>
      </table>
    </body>
    </html>
  `;

  const blob = new Blob([htmlContent], { type: 'application/vnd.ms-excel' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Kisi_Kisi_TKA_${mataPelajaran.replace(/\s+/g, '_')}.xls`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Export Kisi-Kisi (Matriks Asesmen) to Word (.doc)
 */
export function exportKisiToWord(items: KisiKisiItem[], mataPelajaran: string) {
  const tableRows = items
    .map(
      (item) => `
    <tr>
      <td style="border: 1px solid #000000; padding: 6px; text-align: center;">${item.no}</td>
      <td style="border: 1px solid #000000; padding: 6px;">${getBentukSoalLabel(item.bentukSoal)}</td>
      <td style="border: 1px solid #000000; padding: 6px;">${getLevelKognitifLabel(item.levelKognitif)}</td>
      <td style="border: 1px solid #000000; padding: 6px;">${item.elemenMateri}</td>
      <td style="border: 1px solid #000000; padding: 6px;">${item.subElemenMateri}</td>
      <td style="border: 1px solid #000000; padding: 6px;">${item.kompetensi}</td>
      <td style="border: 1px solid #000000; padding: 6px;">${item.batasanCatatan || '-'}</td>
      <td style="border: 1px solid #000000; padding: 6px; text-align: center;">${item.jumlahSoal}</td>
    </tr>
  `
    )
    .join('');

  const totalSoal = items.reduce((sum, i) => sum + i.jumlahSoal, 0);

  const htmlContent = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Calibri', 'Arial', sans-serif; line-height: 1.4; }
        h2 { color: #1e3a8a; text-align: center; margin-bottom: 5px; }
        .meta { font-size: 11pt; margin-bottom: 20px; }
        table { border-collapse: collapse; width: 100%; margin-top: 15px; }
        th { background-color: #f2f2f2; font-weight: bold; text-align: left; border: 1px solid #000000; padding: 8px; }
        td { border: 1px solid #000000; padding: 6px; font-size: 10pt; }
      </style>
    </head>
    <body>
      <h2>MATRIKS ASESMEN KISI-KISI SOAL TKA SMA</h2>
      <div class="meta">
        <b>Mata Pelajaran:</b> ${mataPelajaran}<br/>
        <b>Tanggal:</b> ${new Date().toLocaleDateString('id-ID')}<br/>
      </div>
      
      <table>
        <thead>
          <tr>
            <th style="width: 5%;">No</th>
            <th style="width: 15%;">Bentuk Soal</th>
            <th style="width: 15%;">Tingkat Kognitif</th>
            <th style="width: 15%;">Elemen/Materi</th>
            <th style="width: 15%;">Sub-elemen/Submateri</th>
            <th style="width: 20%;">Kompetensi</th>
            <th style="width: 10%;">Batasan/Catatan</th>
            <th style="width: 5%;">Jumlah Soal</th>
          </tr>
        </thead>
        <tbody>
          ${tableRows}
          <tr style="font-weight: bold; background-color: #fafafa;">
            <td colspan="7" style="text-align: right; border: 1px solid #000000; padding: 6px;">Total Jumlah Soal:</td>
            <td style="text-align: center; border: 1px solid #000000; padding: 6px;">${totalSoal}</td>
          </tr>
        </tbody>
      </table>
    </body>
    </html>
  `;

  const blob = new Blob([htmlContent], { type: 'application/msword' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Kisi_Kisi_TKA_${mataPelajaran.replace(/\s+/g, '_')}.doc`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Export Questions (Pembuat Soal) to Word (.doc)
 */
export function exportQuestionsToWord(questions: Question[], mataPelajaran: string) {
  const content = questions
    .map((q) => {
      const optionsHtml = q.opsi
        .map((opt) => {
          // Check if option starts with letter indicator, if not prepend
          return `<p style="margin: 3px 0 3px 20px; font-size: 11pt;">${opt}</p>`;
        })
        .join('');

      return `
      <div style="margin-bottom: 25px; page-break-inside: avoid;">
        <table style="border: 1px solid #aaaaaa; width: 100%; border-collapse: collapse; background-color: #fbfbfb; margin-bottom: 10px;">
          <tr>
            <td style="padding: 5px 10px; font-weight: bold; width: 15%; background-color: #eaeaea; border-right: 1px solid #aaaaaa;">No Soal</td>
            <td style="padding: 5px 10px; font-weight: bold; width: 85%;">${q.noSoal}</td>
          </tr>
          <tr>
            <td style="padding: 5px 10px; font-weight: bold; background-color: #eaeaea; border-right: 1px solid #aaaaaa;">Kompetensi</td>
            <td style="padding: 5px 10px; font-size: 10pt;">${q.kompetensi}</td>
          </tr>
          <tr>
            <td style="padding: 5px 10px; font-weight: bold; background-color: #eaeaea; border-right: 1px solid #aaaaaa;">Sub Kompetensi</td>
            <td style="padding: 5px 10px; font-size: 10pt;">${q.subKompetensi}</td>
          </tr>
          <tr>
            <td style="padding: 5px 10px; font-weight: bold; background-color: #eaeaea; border-right: 1px solid #aaaaaa;">Bentuk Soal</td>
            <td style="padding: 5px 10px; font-size: 10pt; font-style: italic;">${getBentukSoalLabel(q.bentukSoal)}</td>
          </tr>
        </table>

        ${q.stimulus ? `<div style="border-left: 3px solid #1e3a8a; padding-left: 10px; margin: 10px 0; font-style: italic; font-size: 11pt; background-color: #f9f9f9; padding: 8px;"><b>Stimulus:</b><br/>${q.stimulus.replace(/\n/g, '<br/>')}</div>` : ''}
        
        ${q.gambarUrl && q.gambarUrl.trim() !== '' ? `
        <div style="margin: 15px 0; text-align: center; background-color: #fafafa; padding: 10px; border: 1px solid #eeeeee; border-radius: 8px;">
          <p style="font-size: 9pt; color: #666666; margin: 0 0 5px 0; font-weight: bold;">[Ilustrasi / Grafik No. ${q.noSoal}]</p>
          ${q.gambarUrl.trim().toLowerCase().startsWith('<svg') ? q.gambarUrl : `<img src="${q.gambarUrl}" style="max-width: 400px; max-height: 250px; display: block; margin: 0 auto;"/>`}
        </div>
        ` : ''}

        <p style="margin: 10px 0; font-weight: bold; font-size: 11pt;">Pertanyaan:</p>
        <p style="margin: 5px 0 10px 0; font-size: 11pt; line-height: 1.5;">${q.soal.replace(/\n/g, '<br/>')}</p>

        ${optionsHtml ? `<div style="margin: 10px 0;">${optionsHtml}</div>` : ''}

        <p style="margin: 10px 0 5px 0; color: #15803d; font-weight: bold; font-size: 11pt;">Kunci Jawaban: <span style="background-color: #dcfce7; padding: 2px 8px; border-radius: 4px;">${q.kunciJawaban}</span></p>
        
        ${q.kataKunci ? `<p style="margin: 5px 0; font-size: 10.5pt; color: #4338ca;"><b>Kata Kunci / Konsep:</b> <span style="background-color: #e0e7ff; padding: 2px 8px; border-radius: 4px; color: #1e1b4b;">${q.kataKunci}</span></p>` : ''}
        
        <div style="margin-top: 10px; padding: 8px; border: 1px dashed #cccccc; background-color: #fafafa; font-size: 10.5pt;">
          <b style="color: #4b5563;">Pembahasan:</b><br/>
          <p style="margin: 5px 0 0 0; line-height: 1.4; color: #374151;">${q.pembahasan.replace(/\n/g, '<br/>')}</p>
        </div>
        <hr style="border: 0; border-top: 1px solid #dddddd; margin-top: 20px; margin-bottom: 20px;"/>
      </div>
    `;
    })
    .join('');

  const htmlContent = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Calibri', 'Arial', sans-serif; line-height: 1.5; color: #333333; }
        h2 { color: #1e3a8a; text-align: center; margin-bottom: 5px; }
        .meta-header { border-bottom: 2px solid #1e3a8a; padding-bottom: 10px; margin-bottom: 30px; font-size: 11pt; }
      </style>
    </head>
    <body>
      <h2>SOAL TES KEMAMPUAN AKADEMIK (TKA) SMA</h2>
      <div class="meta-header">
        <b>Mata Pelajaran:</b> ${mataPelajaran}<br/>
        <b>Jumlah Soal:</b> ${questions.length} butir<br/>
        <b>Tanggal Pembuatan:</b> ${new Date().toLocaleDateString('id-ID')}<br/>
      </div>

      ${content}
    </body>
    </html>
  `;

  const blob = new Blob([htmlContent], { type: 'application/msword' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Soal_TKA_${mataPelajaran.replace(/\s+/g, '_')}.doc`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Export Questions (Pembuat Soal) to Excel (.xls)
 */
export function exportQuestionsToExcel(questions: Question[], mataPelajaran: string) {
  const tableRows = questions
    .map(
      (q) => `
    <tr>
      <td style="border: 1px solid #cccccc; padding: 8px; text-align: center; vertical-align: top;">${q.noSoal}</td>
      <td style="border: 1px solid #cccccc; padding: 8px; vertical-align: top;">${getBentukSoalLabel(q.bentukSoal)}</td>
      <td style="border: 1px solid #cccccc; padding: 8px; vertical-align: top;">${q.kompetensi}</td>
      <td style="border: 1px solid #cccccc; padding: 8px; vertical-align: top;">${q.subKompetensi}</td>
      <td style="border: 1px solid #cccccc; padding: 8px; vertical-align: top;">${q.stimulus || '-'}</td>
      <td style="border: 1px solid #cccccc; padding: 8px; vertical-align: top;">${q.soal}</td>
      <td style="border: 1px solid #cccccc; padding: 8px; vertical-align: top;">${q.opsi.join(' | ')}</td>
      <td style="border: 1px solid #cccccc; padding: 8px; font-weight: bold; text-align: center; color: #16a34a; vertical-align: top;">${q.kunciJawaban}</td>
      <td style="border: 1px solid #cccccc; padding: 8px; vertical-align: top; font-weight: 500; color: #4338ca; vertical-align: top;">${q.kataKunci || '-'}</td>
      <td style="border: 1px solid #cccccc; padding: 8px; vertical-align: top; font-size: 9pt; color: #555555;">${q.pembahasan}</td>
    </tr>
  `
    )
    .join('');

  const htmlContent = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <!--[if gte mso 9]>
      <xml>
        <x:ExcelWorkbook>
          <x:ExcelWorksheets>
            <x:ExcelWorksheet>
              <x:Name>Daftar Soal TKA</x:Name>
              <x:WorksheetOptions>
                <x:DisplayGridlines/>
              </x:WorksheetOptions>
            </x:ExcelWorksheet>
          </x:ExcelWorksheets>
        </x:ExcelWorkbook>
      </xml>
      <![endif]-->
      <meta charset="utf-8">
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
        th { background-color: #10b981; color: white; font-weight: bold; }
      </style>
    </head>
    <body>
      <h2>DAFTAR SOAL TES KEMAMPUAN AKADEMIK (TKA) SMA</h2>
      <p><b>Mata Pelajaran:</b> ${mataPelajaran}</p>
      <p><b>Jumlah Soal:</b> ${questions.length} butir</p>
      <p><b>Tanggal Pembuatan:</b> ${new Date().toLocaleDateString('id-ID')}</p>
      <br/>
      <table style="border-collapse: collapse; border: 1px solid #cccccc; width: 100%;">
        <thead>
          <tr style="background-color: #047857; color: white;">
            <th style="border: 1px solid #cccccc; padding: 10px; width: 50px;">No Soal</th>
            <th style="border: 1px solid #cccccc; padding: 10px; width: 150px;">Bentuk Soal</th>
            <th style="border: 1px solid #cccccc; padding: 10px;">Kompetensi</th>
            <th style="border: 1px solid #cccccc; padding: 10px;">Sub Kompetensi</th>
            <th style="border: 1px solid #cccccc; padding: 10px; width: 250px;">Stimulus</th>
            <th style="border: 1px solid #cccccc; padding: 10px; width: 300px;">Pertanyaan/Soal</th>
            <th style="border: 1px solid #cccccc; padding: 10px; width: 250px;">Pilihan Jawaban (dipisah |)</th>
            <th style="border: 1px solid #cccccc; padding: 10px; width: 100px;">Kunci Jawaban</th>
            <th style="border: 1px solid #cccccc; padding: 10px; width: 150px;">Kata Kunci / Konsep</th>
            <th style="border: 1px solid #cccccc; padding: 10px; width: 350px;">Pembahasan</th>
          </tr>
        </thead>
        <tbody>
          ${tableRows}
        </tbody>
      </table>
    </body>
    </html>
  `;

  const blob = new Blob([htmlContent], { type: 'application/vnd.ms-excel' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Soal_TKA_${mataPelajaran.replace(/\s+/g, '_')}.xls`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
