const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  WidthType, AlignmentType, BorderStyle, VerticalMergeType,
  ShadingType, PageOrientation
} = require("docx");

const PAGE_LANDSCAPE_WIDTH = 15840;
const MARGIN = 720;
const AVAILABLE_WIDTH = PAGE_LANDSCAPE_WIDTH - MARGIN * 2;

const COL_RATIOS = {
  no: 500, nom: 1500, prenom: 1700, whatsapp: 2000, appel: 2000,
  adresse: 2600, contactNom: 1700, lien: 1600, tel: 1700,
};
const RATIO_TOTAL = Object.values(COL_RATIOS).reduce((a, b) => a + b, 0);

function colWidths() {
  const w = {};
  for (const [k, v] of Object.entries(COL_RATIOS))
    w[k] = Math.round(AVAILABLE_WIDTH * v / RATIO_TOTAL);
  return w;
}

const BORDER = { style: BorderStyle.SINGLE, size: 4, color: "000000" };
const CELL_BORDERS = { top: BORDER, bottom: BORDER, left: BORDER, right: BORDER };

function headerCell(text, opts = {}) {
  return new TableCell({
    borders: CELL_BORDERS,
    width: { size: opts.width, type: WidthType.DXA },
    columnSpan: opts.colSpan,
    verticalMerge: opts.vMerge,
    verticalAlign: "center",
    shading: opts.shaded ? { type: ShadingType.CLEAR, fill: "D9D9D9" } : undefined,
    children: [new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 40, after: 40 },
      children: [new TextRun({ text, bold: true, size: 18 })],
    })],
  });
}

function dataCell(text, width) {
  return new TableCell({
    borders: CELL_BORDERS,
    width: { size: width, type: WidthType.DXA },
    verticalAlign: "center",
    children: [new Paragraph({
      spacing: { before: 20, after: 20 },
      children: [new TextRun({ text: text || "", size: 18 })],
    })],
  });
}

async function generateDocx(students) {
  const COL = colWidths();
  const totalWidth = Object.values(COL).reduce((a, b) => a + b, 0);

  const headerRow1 = new TableRow({
    tableHeader: true,
    children: [
      headerCell("NO", { width: COL.no, vMerge: VerticalMergeType.RESTART, shaded: true }),
      headerCell("NOM", { width: COL.nom, vMerge: VerticalMergeType.RESTART, shaded: true }),
      headerCell("PRENOM", { width: COL.prenom, vMerge: VerticalMergeType.RESTART, shaded: true }),
      headerCell("TELEPHONE WHATSAP", { width: COL.whatsapp, vMerge: VerticalMergeType.RESTART, shaded: true }),
      headerCell("TELEPHONE APPEL", { width: COL.appel, vMerge: VerticalMergeType.RESTART, shaded: true }),
      headerCell("ADRESSE", { width: COL.adresse, vMerge: VerticalMergeType.RESTART, shaded: true }),
      headerCell("PERSONNE A CONTACTER", { width: COL.contactNom + COL.lien + COL.tel, colSpan: 3, shaded: true }),
    ],
  });

  const headerRow2 = new TableRow({
    tableHeader: true,
    children: [
      headerCell("", { width: COL.no, vMerge: VerticalMergeType.CONTINUE }),
      headerCell("", { width: COL.nom, vMerge: VerticalMergeType.CONTINUE }),
      headerCell("", { width: COL.prenom, vMerge: VerticalMergeType.CONTINUE }),
      headerCell("", { width: COL.whatsapp, vMerge: VerticalMergeType.CONTINUE }),
      headerCell("", { width: COL.appel, vMerge: VerticalMergeType.CONTINUE }),
      headerCell("", { width: COL.adresse, vMerge: VerticalMergeType.CONTINUE }),
      headerCell("NOM", { width: COL.contactNom, shaded: true }),
      headerCell("LIEN DE PARENTE", { width: COL.lien, shaded: true }),
      headerCell("TELEPONNE", { width: COL.tel, shaded: true }),
    ],
  });

  const dataRows = students.map(s => new TableRow({
    children: [
      dataCell(String(s.no), COL.no),
      dataCell(s.nom, COL.nom),
      dataCell(s.prenom, COL.prenom),
      dataCell(s.telephone_whatsapp || "", COL.whatsapp),
      dataCell(s.telephone_appel || "", COL.appel),
      dataCell(s.adresse || "", COL.adresse),
      dataCell(s.contact_nom || "", COL.contactNom),
      dataCell(s.contact_lien || "", COL.lien),
      dataCell(s.contact_telephone || "", COL.tel),
    ],
  }));

  const doc = new Document({
    sections: [{
      properties: {
        page: {
          orientation: PageOrientation.LANDSCAPE,
          margin: { top: 720, bottom: 720, left: 720, right: 720 },
        },
      },
      children: [
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 0 },
          children: [new TextRun({ text: "ECOLE NATIONALE DES ARTS ET METIERS", bold: true, size: 28 })],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 0 },
          children: [new TextRun({ text: "ENAM", bold: true, size: 28 })],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 120 },
          children: [new TextRun({ text: "APPROCHE PAR COMPETENCE (APC) DIPLOME TECHNIQUE", bold: true, size: 22 })],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 },
          children: [new TextRun({ text: "TECHNIQUES RESEAUX INFORMATIQUE PROMOTION 2024-2027", bold: true, size: 24 })],
        }),
        new Table({
          width: { size: totalWidth, type: WidthType.DXA },
          columnWidths: Object.values(COL),
          rows: [headerRow1, headerRow2, ...dataRows],
        }),
      ],
    }],
  });

  return await Packer.toBuffer(doc);
}

module.exports = { generateDocx };
