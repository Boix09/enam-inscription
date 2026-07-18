const {
  Document, Packer, Paragraph, Table, TableRow, TableCell,
  WidthType, PageOrientation, TextRun, AlignmentType, BorderStyle,
  ShadingType, VerticalMergeType, ImageRun
} = require("docx");

const MARGIN = 720;
const COL_WIDTHS = [
  600, 1600, 1600, 2000, 2000, 2800, 1400, 1200, 1200,
];

const BORDER = { style: BorderStyle.SINGLE, size: 4, color: "000000" };
const CELL_BORDERS = { top: BORDER, bottom: BORDER, left: BORDER, right: BORDER };

function cell(text, opts = {}) {
  return new TableCell({
    borders: CELL_BORDERS,
    width: { size: COL_WIDTHS[opts.colIndex], type: WidthType.DXA },
    columnSpan: opts.colSpan,
    verticalMerge: opts.vMerge,
    verticalAlign: "center",
    shading: opts.shaded ? { type: ShadingType.CLEAR, fill: "D9D9D9" } : undefined,
    children: [new Paragraph({
      alignment: opts.center ? AlignmentType.CENTER : AlignmentType.LEFT,
      spacing: { before: 20, after: 20 },
      children: [new TextRun({ text, bold: !!opts.bold, size: 18 })],
    })],
  });
}

async function generateDocx(students, info, logoBuf) {
  const totalWidth = COL_WIDTHS.reduce((a, b) => a + b, 0);
  const nomPromo = info ? info.promo : "Réseaux Informatique 2024-2027";
  const nomClasse = info ? info.classe : "";

  const headerRow1 = new TableRow({
    tableHeader: true,
    children: [
      cell("NO", { colIndex: 0, vMerge: VerticalMergeType.RESTART, shaded: true, center: true, bold: true }),
      cell("NOM", { colIndex: 1, vMerge: VerticalMergeType.RESTART, shaded: true, center: true, bold: true }),
      cell("PRENOM", { colIndex: 2, vMerge: VerticalMergeType.RESTART, shaded: true, center: true, bold: true }),
      cell("TELEPHONE WHATSAPP", { colIndex: 3, vMerge: VerticalMergeType.RESTART, shaded: true, center: true, bold: true }),
      cell("TELEPHONE APPEL", { colIndex: 4, vMerge: VerticalMergeType.RESTART, shaded: true, center: true, bold: true }),
      cell("ADRESSE", { colIndex: 5, vMerge: VerticalMergeType.RESTART, shaded: true, center: true, bold: true }),
      cell("PERSONNE A CONTACTER", { colIndex: 6, colSpan: 3, shaded: true, center: true, bold: true }),
    ],
  });

  const headerRow2 = new TableRow({
    tableHeader: true,
    children: [
      cell("", { colIndex: 0, vMerge: VerticalMergeType.CONTINUE }),
      cell("", { colIndex: 1, vMerge: VerticalMergeType.CONTINUE }),
      cell("", { colIndex: 2, vMerge: VerticalMergeType.CONTINUE }),
      cell("", { colIndex: 3, vMerge: VerticalMergeType.CONTINUE }),
      cell("", { colIndex: 4, vMerge: VerticalMergeType.CONTINUE }),
      cell("", { colIndex: 5, vMerge: VerticalMergeType.CONTINUE }),
      cell("NOM", { colIndex: 6, shaded: true, center: true, bold: true }),
      cell("LIEN DE PARENTE", { colIndex: 7, shaded: true, center: true, bold: true }),
      cell("TELEPHONE", { colIndex: 8, shaded: true, center: true, bold: true }),
    ],
  });

  const dataRows = students.map((s, i) => new TableRow({
    children: [
      cell(String(i + 1), { colIndex: 0, center: true }),
      cell(s.nom, { colIndex: 1 }),
      cell(s.prenom, { colIndex: 2 }),
      cell(s.telephone_whatsapp || "", { colIndex: 3 }),
      cell(s.telephone_appel || "", { colIndex: 4 }),
      cell(s.adresse || "", { colIndex: 5 }),
      cell(s.contact_nom || "", { colIndex: 6 }),
      cell(s.contact_lien || "", { colIndex: 7 }),
      cell(s.contact_telephone || "", { colIndex: 8 }),
    ],
  }));

  const children = [];

  if (logoBuf) {
    children.push(new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 60 },
      children: [new ImageRun({ data: logoBuf, transformation: { width: 80, height: 80 } })],
    }));
  }

  children.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 0 },
    children: [new TextRun({ text: "ECOLE NATIONALE DES ARTS ET METIERS", bold: true, size: 28 })],
  }));
  children.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 0 },
    children: [new TextRun({ text: "ENAM", bold: true, size: 26 })],
  }));
  children.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 60 },
    children: [new TextRun({ text: "FICHE DE RENSEIGNEMENTS", bold: true, size: 22 })],
  }));

  if (nomClasse) {
    children.push(new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 60 },
      children: [new TextRun({ text: nomClasse, bold: true, size: 20 })],
    }));
  }

  children.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 200 },
    children: [new TextRun({ text: nomPromo, bold: true, size: 24 })],
  }));

  children.push(new Table({
    width: { size: totalWidth, type: WidthType.DXA },
    columnWidths: COL_WIDTHS,
    rows: [headerRow1, headerRow2, ...dataRows],
  }));

  const doc = new Document({
    sections: [{
      properties: {
        page: {
          size: { width: 12240, height: 15840, orientation: PageOrientation.LANDSCAPE },
          margin: { top: MARGIN, bottom: MARGIN, left: MARGIN, right: MARGIN },
        },
      },
      children,
    }],
  });

  return await Packer.toBuffer(doc);
}

module.exports = { generateDocx };
