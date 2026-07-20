import { KisiKisiItem, Question, JadwalItem } from '../types';

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
      <td style="border: 1px solid #cccccc; padding: 8px; font-size: 9.5pt;">
        ${[
          item.konteksLokal && item.konteksLokal.length > 0 ? `Konteks: ${item.konteksLokal.join(', ')}` : '',
          item.konteksNusantara ? `Kustom Konteks: ${item.konteksNusantara}` : '',
          item.stimulusKonten && item.stimulusKonten.length > 0 ? `Stimulus: ${item.stimulusKonten.join(', ')}` : '',
          item.stimulusTambahan ? `Kustom Stimulus: ${item.stimulusTambahan}` : '',
          item.kualitasChecklist && item.kualitasChecklist.length > 0 ? `Standar Mutu: ${item.kualitasChecklist.join(', ')}` : ''
        ].filter(Boolean).join(' | ') || '-'}
      </td>
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
            <th style="border: 1px solid #cccccc; padding: 10px; min-width: 250px;">Konteks & Stimulus</th>
            <th style="border: 1px solid #cccccc; padding: 10px; width: 80px;">Jumlah Soal</th>
          </tr>
        </thead>
        <tbody>
          ${tableRows}
          <tr style="background-color: #f3f4f6; font-weight: bold;">
            <td colspan="8" style="border: 1px solid #cccccc; padding: 8px; text-align: right;">Total Soal:</td>
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
export function exportKisiToWord(items: KisiKisiItem[], mataPelajaran: string, pageSize: string = 'A4') {
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
      <td style="border: 1px solid #000000; padding: 6px; font-size: 9pt;">
        ${[
          item.konteksLokal && item.konteksLokal.length > 0 ? `Konteks: ${item.konteksLokal.join(', ')}` : '',
          item.konteksNusantara ? `Kustom Konteks: ${item.konteksNusantara}` : '',
          item.stimulusKonten && item.stimulusKonten.length > 0 ? `Stimulus: ${item.stimulusKonten.join(', ')}` : '',
          item.stimulusTambahan ? `Kustom Stimulus: ${item.stimulusTambahan}` : '',
          item.kualitasChecklist && item.kualitasChecklist.length > 0 ? `Standar Mutu: ${item.kualitasChecklist.join(', ')}` : ''
        ].filter(Boolean).join(' | ') || '-'}
      </td>
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
        @page {
          size: ${pageSize === 'F4' ? '21.5cm 33cm' : '21cm 29.7cm'};
          margin: 1.5cm 1.5cm 1.5cm 1.5cm;
        }
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
            <th style="width: 12%;">Bentuk Soal</th>
            <th style="width: 12%;">Tingkat Kognitif</th>
            <th style="width: 12%;">Elemen/Materi</th>
            <th style="width: 12%;">Sub-elemen/Submateri</th>
            <th style="width: 15%;">Kompetensi</th>
            <th style="width: 10%;">Batasan/Catatan</th>
            <th style="width: 18%;">Konteks & Stimulus</th>
            <th style="width: 5%;">Jumlah Soal</th>
          </tr>
        </thead>
        <tbody>
          ${tableRows}
          <tr style="font-weight: bold; background-color: #fafafa;">
            <td colspan="8" style="text-align: right; border: 1px solid #000000; padding: 6px;">Total Jumlah Soal:</td>
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
export function exportQuestionsToWord(questions: Question[], mataPelajaran: string, pageSize: string = 'A4') {
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
        @page {
          size: ${pageSize === 'F4' ? '21.5cm 33cm' : '21cm 29.7cm'};
          margin: 2cm 2cm 2cm 2cm;
        }
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

/**
 * Helper to convert Simple Markdown to styled HTML for Word Export
 */
export function markdownToHtmlForWord(markdown: string): string {
  if (!markdown) return '';
  
  // Split into paragraphs/blocks
  const blocks = markdown.split(/\n\n+/);
  
  const converted = blocks.map(block => {
    let trimmed = block.trim();
    if (!trimmed) return '';
    
    // Headings
    if (trimmed.startsWith('# ')) {
      return `<h1 style="font-family: 'Times New Roman', 'Georgia', serif; font-size: 16pt; color: #111827; border-bottom: 2pt solid #111827; padding-bottom: 4px; margin-top: 24pt; margin-bottom: 12pt; font-weight: normal; text-transform: none; line-height: 1.3;">${trimmed.slice(2)}</h1>`;
    }
    if (trimmed.startsWith('## ')) {
      return `<h2 style="font-family: 'Times New Roman', 'Georgia', serif; font-size: 14pt; color: #1f2937; margin-top: 18pt; margin-bottom: 10pt; font-weight: normal; border-left: 3.5pt solid #1f2937; padding-left: 8pt; line-height: 1.3;">${trimmed.slice(3)}</h2>`;
    }
    if (trimmed.startsWith('### ')) {
      return `<h3 style="font-family: 'Times New Roman', 'Georgia', serif; font-size: 12pt; color: #374151; margin-top: 14pt; margin-bottom: 8pt; font-weight: normal; font-style: italic; line-height: 1.3;">${trimmed.slice(4)}</h3>`;
    }
    
    // Blockquote
    if (trimmed.startsWith('> ')) {
      const cleanText = trimmed.replace(/^>\s?/gm, '').trim();
      return `<div style="border-left: 3pt solid #4b5563; background-color: #f9fafb; padding: 10pt 15pt; margin: 12pt 0; font-style: italic; color: #374151; font-family: 'Times New Roman', serif; font-size: 11.5pt; text-align: justify; line-height: 1.5;">${parseInlineMarkdown(cleanText)}</div>`;
    }
    
    // Lists (bulleted)
    if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
      const lines = trimmed.split('\n');
      const itemsHtml = lines.map(line => {
        const itemText = line.replace(/^[*-\s]+/, '').trim();
        return `<li style="font-family: 'Times New Roman', serif; font-size: 12pt; margin-bottom: 6pt; line-height: 1.5; text-align: justify; color: #111827;">${parseInlineMarkdown(itemText)}</li>`;
      }).join('');
      return `<ul style="margin-top: 8pt; margin-bottom: 8pt; padding-left: 24pt; list-style-type: disc;">${itemsHtml}</ul>`;
    }
    
    // Lists (numbered)
    if (/^\d+\.\s/.test(trimmed)) {
      const lines = trimmed.split('\n');
      const itemsHtml = lines.map(line => {
        const itemText = line.replace(/^\d+\.\s+/, '').trim();
        return `<li style="font-family: 'Times New Roman', serif; font-size: 12pt; margin-bottom: 6pt; line-height: 1.5; text-align: justify; color: #111827;">${parseInlineMarkdown(itemText)}</li>`;
      }).join('');
      return `<ol style="margin-top: 8pt; margin-bottom: 8pt; padding-left: 24pt;">${itemsHtml}</ol>`;
    }
    
    // Normal paragraph
    return `<p style="font-family: 'Times New Roman', serif; font-size: 12pt; line-height: 1.5; margin-top: 0; margin-bottom: 10pt; text-align: justify; color: #111827; text-indent: 0.5in;">${parseInlineMarkdown(trimmed)}</p>`;
  }).join('\n');
  
  return converted;
}

function parseInlineMarkdown(text: string): string {
  let formatted = text;
  // Bold **text**
  formatted = formatted.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  // Italic *text*
  formatted = formatted.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  // Inline Code `code`
  formatted = formatted.replace(/`([^`]+)`/g, '<code style="background-color: #f3f4f6; padding: 2px 4px; font-family: Consolas, monospace; font-size: 10pt; color: #b91c1c; border: 1px solid #e5e7eb; border-radius: 3px;">$1</code>');
  return formatted;
}

/**
 * Export single Ringkasan Materi to Word (.doc)
 */
export function exportMateriToWord(kisi: any, content: string, mataPelajaran: string, pageSize: string = 'A4') {
  const parsedHtml = markdownToHtmlForWord(content);
  
  const htmlContent = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta charset="utf-8">
      <style>
        @page {
          size: ${pageSize === 'F4' ? '21.5cm 33cm' : '21cm 29.7cm'};
          margin-top: 4cm;
          margin-bottom: 3cm;
          margin-left: 4cm;
          margin-right: 3cm;
        }
        body { 
          font-family: 'Times New Roman', serif; 
          line-height: 1.5; 
          color: #111827; 
        }
        .header-kop { 
          text-align: center;
          border-bottom: 4px double #111827; 
          padding-bottom: 15px; 
          margin-bottom: 30px; 
        }
        .meta-table { 
          width: 100%; 
          border-collapse: collapse; 
          margin-bottom: 25px; 
          border: 1px solid #111827;
        }
        .meta-table td { 
          border: 1px solid #111827; 
          padding: 8px 12px; 
          font-size: 11pt; 
          color: #111827; 
          font-family: 'Times New Roman', serif;
        }
        .title { 
          color: #111827; 
          font-family: 'Times New Roman', serif; 
          font-size: 16pt; 
          font-weight: normal; 
          margin: 0 0 5px 0; 
          text-transform: none;
        }
        .subtitle { 
          font-size: 11pt; 
          font-style: italic;
          color: #374151; 
          margin: 0; 
        }
      </style>
    </head>
    <body>
      <div class="header-kop">
        <h1 class="title">Bahan Ajar / Modul Pembelajaran</h1>
        <p class="subtitle">Kurikulum Merdeka - Standar Bahan Ajar Sekolah Menengah Atas</p>
      </div>
      
      <table class="meta-table">
        <tr style="background-color: #f3f4f6;">
          <td style="width: 30%; font-weight: bold;">Mata Pelajaran</td>
          <td style="width: 70%; font-weight: bold; color: #111827;">${mataPelajaran.toUpperCase()}</td>
        </tr>
        <tr>
          <td style="font-weight: bold;">Elemen / Capaian</td>
          <td>${kisi.elemenMateri}</td>
        </tr>
        <tr>
          <td style="font-weight: bold;">Sub-Elemen / Materi Pokok</td>
          <td>${kisi.subElemenMateri}</td>
        </tr>
        <tr>
          <td style="font-weight: bold;">Target Kompetensi Dasar</td>
          <td>${kisi.kompetensi}</td>
        </tr>
        <tr>
          <td style="font-weight: bold;">Tingkat Kemampuan Kognitif</td>
          <td>${getLevelKognitifLabel(kisi.levelKognitif)}</td>
        </tr>
        <tr>
          <td style="font-weight: bold;">Tanggal Penyusunan / Ekspor</td>
          <td>${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</td>
        </tr>
      </table>
      
      <div style="margin-top: 15px;">
        ${parsedHtml}
      </div>
    </body>
    </html>
  `;

  const blob = new Blob([htmlContent], { type: 'application/msword' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `MODUL_AJAR_No_${kisi.no}_${kisi.elemenMateri.replace(/[^a-zA-Z0-9]/g, '_')}.doc`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Export all Ringkasan Materi to Word (.doc) in a single document
 */
export function exportAllMateriToWord(items: any[], materials: Record<string, string>, mataPelajaran: string, pageSize: string = 'A4') {
  const compiledContent = items
    .filter(item => !!materials[item.id])
    .map((item, index) => {
      const parsedHtml = markdownToHtmlForWord(materials[item.id]);
      const pageBreak = index > 0 ? '<br clear="all" style="page-break-before: always; mso-special-character: line-break;" />' : '';
      
      return `
        ${pageBreak}
        <div style="border-bottom: 2px solid #111827; padding-bottom: 8px; margin-bottom: 20px; background-color: #f9fafb; padding: 12px 15px; border-left: 5px solid #111827;">
          <h2 style="font-family: 'Times New Roman', serif; font-size: 14pt; color: #111827; margin: 0 0 6px 0; font-weight: normal; text-transform: none;">Modul ${item.no}: ${item.elemenMateri}</h2>
          <p style="font-size: 11pt; color: #111827; margin: 0; font-family: 'Times New Roman', serif;"><b>Sub-Materi Pokok:</b> ${item.subElemenMateri}</p>
          <p style="font-size: 11pt; color: #111827; margin: 3px 0 0 0; font-family: 'Times New Roman', serif;"><b>Kompetensi:</b> ${item.kompetensi} | <b>Level:</b> ${getLevelKognitifLabel(item.levelKognitif)}</p>
        </div>
        
        <div style="margin-top: 15px; margin-bottom: 30px;">
          ${parsedHtml}
        </div>
      `;
    })
    .join('\n');

  const htmlContent = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta charset="utf-8">
      <style>
        @page {
          size: ${pageSize === 'F4' ? '21.5cm 33cm' : '21cm 29.7cm'};
          margin-top: 4cm;
          margin-bottom: 3cm;
          margin-left: 4cm;
          margin-right: 3cm;
        }
        body { 
          font-family: 'Times New Roman', serif; 
          line-height: 1.5; 
          color: #111827; 
        }
        .header-kop { 
          border-bottom: 4px double #111827; 
          padding-bottom: 15px; 
          margin-bottom: 35px; 
          text-align: center; 
        }
        .title { 
          color: #111827; 
          font-family: 'Times New Roman', serif; 
          font-size: 18pt; 
          font-weight: normal; 
          margin: 0 0 5px 0; 
          text-transform: none;
        }
        .subtitle { 
          font-size: 11pt; 
          font-style: italic;
          color: #374151; 
          margin: 0; 
        }
      </style>
    </head>
    <body>
      <div class="header-kop">
        <h1 class="title">Kumpulan Modul Ajar dan Bahan Ajar Lengkap</h1>
        <p class="subtitle">Mata Pelajaran: <b>${mataPelajaran}</b></p>
        <p style="font-size: 10pt; color: #4b5563; margin: 5px 0 0 0; font-family: 'Times New Roman', serif;">Diekspor secara otomatis pada ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
      </div>
      
      <div style="margin-top: 20px;">
        ${compiledContent}
      </div>
    </body>
    </html>
  `;

  const blob = new Blob([htmlContent], { type: 'application/msword' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Kumpulan_Modul_Ajar_${mataPelajaran.replace(/\s+/g, '_')}.doc`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Export Jadwal Rencana Pembelajaran to Excel (.xls)
 */
export function exportJadwalToExcel(items: JadwalItem[], mataPelajaran: string) {
  const tableRows = items
    .map(
      (item) => `
    <tr>
      <td style="border: 1px solid #cccccc; padding: 8px; text-align: center; font-weight: bold; background-color: #f8fafc;">${item.bulan}</td>
      <td style="border: 1px solid #cccccc; padding: 8px; text-align: center;">Minggu ke-${item.mingguKe}</td>
      <td style="border: 1px solid #cccccc; padding: 8px; font-weight: 500;">${item.elemenMateri}</td>
      <td style="border: 1px solid #cccccc; padding: 8px; color: #475569;">${item.subElemenMateri}</td>
      <td style="border: 1px solid #cccccc; padding: 8px; font-style: italic;">${item.kompetensi}</td>
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
              <x:Name>Jadwal Pembelajaran</x:Name>
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
        th { background-color: #4f46e5; color: white; font-weight: bold; }
      </style>
    </head>
    <body>
      <h2>TABEL JADWAL RENCANA PEMBELAJARAN TKA KELAS XII</h2>
      <p><b>Mata Pelajaran:</b> ${mataPelajaran}</p>
      <p><b>Periode Pembelajaran:</b> Juli, Agustus, September dan Oktober</p>
      <p><b>Tanggal Ekspor:</b> ${new Date().toLocaleDateString('id-ID')}</p>
      <br/>
      <table style="border-collapse: collapse; border: 1px solid #cccccc; width: 100%;">
        <thead>
          <tr style="background-color: #4f46e5; color: white;">
            <th style="border: 1px solid #cccccc; padding: 10px; width: 120px;">Bulan</th>
            <th style="border: 1px solid #cccccc; padding: 10px; width: 120px;">Minggu Ke-</th>
            <th style="border: 1px solid #cccccc; padding: 10px; width: 220px;">Elemen / Materi</th>
            <th style="border: 1px solid #cccccc; padding: 10px; width: 280px;">Sub-elemen / Submateri</th>
            <th style="border: 1px solid #cccccc; padding: 10px; width: 350px;">Kompetensi yang Diuji</th>
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
  a.download = `Jadwal_Pembelajaran_TKA_Kelas_XII_${mataPelajaran.replace(/\s+/g, '_')}.xls`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Export Jadwal Rencana Pembelajaran to Word (.doc)
 */
export function exportJadwalToWord(items: JadwalItem[], mataPelajaran: string, pageSize: string = 'A4') {
  const tableRows = items
    .map(
      (item) => `
    <tr>
      <td style="border: 1px solid #000000; padding: 8px; text-align: center; font-weight: bold; background-color: #f1f5f9;">${item.bulan}</td>
      <td style="border: 1px solid #000000; padding: 8px; text-align: center;">Minggu ke-${item.mingguKe}</td>
      <td style="border: 1px solid #000000; padding: 8px; font-weight: bold;">${item.elemenMateri}</td>
      <td style="border: 1px solid #000000; padding: 8px;">${item.subElemenMateri}</td>
      <td style="border: 1px solid #000000; padding: 8px; font-style: italic;">${item.kompetensi}</td>
    </tr>
  `
    )
    .join('');

  const htmlContent = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta charset="utf-8">
      <style>
        @page {
          size: ${pageSize === 'F4' ? '21.5cm 33cm' : '21cm 29.7cm'};
          margin: 1.5cm 1.5cm 1.5cm 1.5cm;
        }
        body { font-family: 'Calibri', 'Arial', sans-serif; line-height: 1.4; }
        h2 { color: #4f46e5; text-align: center; margin-bottom: 5px; }
        .meta { font-size: 11pt; margin-bottom: 20px; }
        table { border-collapse: collapse; width: 100%; margin-top: 15px; }
        th { background-color: #e2e8f0; font-weight: bold; border: 1px solid #000000; padding: 8px; text-align: center; }
        td { border: 1px solid #000000; padding: 8px; font-size: 10pt; }
      </style>
    </head>
    <body>
      <h2>TABEL JADWAL RENCANA PEMBELAJARAN TKA KELAS XII</h2>
      <div class="meta">
        <b>Mata Pelajaran:</b> ${mataPelajaran}<br/>
        <b>Periode Pembelajaran:</b> Juli, Agustus, September dan Oktober<br/>
        <b>Tanggal Pembuatan:</b> ${new Date().toLocaleDateString('id-ID')}<br/>
      </div>
      
      <table>
        <thead>
          <tr>
            <th style="width: 15%;">Bulan</th>
            <th style="width: 15%;">Minggu Ke-</th>
            <th style="width: 20%;">Elemen / Materi</th>
            <th style="width: 25%;">Sub-elemen / Submateri</th>
            <th style="width: 25%;">Kompetensi yang Diuji</th>
          </tr>
        </thead>
        <tbody>
          ${tableRows}
        </tbody>
      </table>
    </body>
    </html>
  `;

  const blob = new Blob([htmlContent], { type: 'application/msword' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Jadwal_Pembelajaran_TKA_Kelas_XII_${mataPelajaran.replace(/\s+/g, '_')}.doc`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}


