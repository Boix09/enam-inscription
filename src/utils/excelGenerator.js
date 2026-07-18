const ExcelJS = require("exceljs");

async function generateExcel(students, info, logoBuf) {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Fiche ENAM", {
    pageSetup: { orientation: "landscape", fitToPage: true, margins: {
      left: 0.5, right: 0.5, top: 0.5, bottom: 0.5, header: 0, footer: 0
    }}
  });

  const nomPromo = info ? info.promo : "Réseaux Informatique 2024-2027";
  const nomClasse = info ? info.classe : "";

  const border = {
    top: { style: "thin", color: { argb: "FF000000" } },
    bottom: { style: "thin", color: { argb: "FF000000" } },
    left: { style: "thin", color: { argb: "FF000000" } },
    right: { style: "thin", color: { argb: "FF000000" } },
  };

  const cols = [
    { key: "no", w: 6 }, { key: "nom", w: 18 }, { key: "prenom", w: 20 },
    { key: "telephone_whatsapp", w: 22 }, { key: "telephone_appel", w: 22 },
    { key: "adresse", w: 30 }, { key: "contact_nom", w: 20 },
    { key: "contact_lien", w: 18 }, { key: "contact_telephone", w: 20 },
  ];

  cols.forEach((c, i) => { ws.getColumn(i + 1).width = c.w; });

  function applyHeaderStyle(cell) {
    cell.font = { bold: true, size: 10 };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFD9D9D9" } };
    cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
    cell.border = border;
  }

  function applyDataStyle(cell) {
    cell.font = { size: 10 };
    cell.alignment = { vertical: "middle", wrapText: true };
    cell.border = border;
  }

  let row = 1;

  // Logo
  if (logoBuf) {
    const imgId = wb.addImage({ buffer: logoBuf, extension: "jpeg" });
    ws.addImage(imgId, { tl: { col: 0, row: 0 }, ext: { width: 60, height: 60 } });
    row = 2;
  }

  const startRow = row;
  ws.mergeCells(row, 1, row, 9);
  const titleCell = ws.getCell(row, 1);
  titleCell.value = "ÉCOLE NATIONALE DES ARTS ET MÉTIERS";
  titleCell.font = { bold: true, size: 14 };
  titleCell.alignment = { horizontal: "center", vertical: "center", wrapText: true };
  ws.getRow(row).height = 25;
  row++;

  ws.mergeCells(row, 1, row, 9);
  const enamCell = ws.getCell(row, 1);
  enamCell.value = "ENAM";
  enamCell.font = { bold: true, size: 13 };
  enamCell.alignment = { horizontal: "center", vertical: "center" };
  row++;

  ws.mergeCells(row, 1, row, 9);
  const ficheCell = ws.getCell(row, 1);
  ficheCell.value = "FICHE DE RENSEIGNEMENTS";
  ficheCell.font = { bold: true, size: 12 };
  ficheCell.alignment = { horizontal: "center", vertical: "center" };
  row++;

  if (nomClasse) {
    ws.mergeCells(row, 1, row, 9);
    const classeCell = ws.getCell(row, 1);
    classeCell.value = nomClasse;
    classeCell.font = { bold: true, size: 11 };
    classeCell.alignment = { horizontal: "center", vertical: "center" };
    row++;
  }

  ws.mergeCells(row, 1, row, 9);
  const promoCell = ws.getCell(row, 1);
  promoCell.value = nomPromo;
  promoCell.font = { bold: true, size: 12 };
  promoCell.alignment = { horizontal: "center", vertical: "center" };
  ws.getRow(row).height = 25;
  row++;

  row++;

  const headerRow1 = ws.getRow(row);
  ws.mergeCells(row, 1, row + 1, 1);
  ws.mergeCells(row, 2, row + 1, 2);
  ws.mergeCells(row, 3, row + 1, 3);
  ws.mergeCells(row, 4, row + 1, 4);
  ws.mergeCells(row, 5, row + 1, 5);
  ws.mergeCells(row, 6, row + 1, 6);
  ws.mergeCells(row, 7, row, 9);

  const h1Labels = ["NO", "NOM", "PRÉNOM", "TÉLÉPHONE WHATSAPP", "TÉLÉPHONE APPEL", "ADRESSE", "PERSONNE À CONTACTER"];
  for (let i = 0; i < 7; i++) {
    const cell = ws.getCell(row, i + 1);
    cell.value = h1Labels[i];
    applyHeaderStyle(cell);
  }
  headerRow1.height = 25;

  row++;
  const headerRow2 = ws.getRow(row);
  const h2Labels = ["", "", "", "", "", "", "NOM", "LIEN DE PARENTÉ", "TÉLÉPHONE"];
  for (let i = 0; i < 9; i++) {
    const cell = ws.getCell(row, i + 1);
    cell.value = h2Labels[i];
    applyHeaderStyle(cell);
  }
  headerRow2.height = 25;

  students.forEach((s, idx) => {
    row++;
    const vals = [
      idx + 1, s.nom, s.prenom, s.telephone_whatsapp || "", s.telephone_appel || "",
      s.adresse || "", s.contact_nom || "", s.contact_lien || "", s.contact_telephone || ""
    ];
    vals.forEach((v, i) => {
      const cell = ws.getCell(row, i + 1);
      cell.value = String(v);
      applyDataStyle(cell);
      cell.alignment = { horizontal: i === 0 ? "center" : "left", vertical: "middle", wrapText: true };
    });
    ws.getRow(row).height = 20;
  });

  return await wb.xlsx.writeBuffer();
}

module.exports = { generateExcel };
