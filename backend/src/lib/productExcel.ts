import ExcelJS from 'exceljs';

export const PRODUCT_EXCEL_COLUMNS = [
  'sku',
  'name',
  'origin',
  'category',
  'pricePerUnit',
  'oldPrice',
  'pricePerKg',
  'salesUnit',
  'tags',
  'imageUrl',
  'gtin',
  'barcodeFixed',
  'isAvailable',
] as const;

export type ProductExcelColumn = (typeof PRODUCT_EXCEL_COLUMNS)[number];

export type ProductExcelValues = Record<ProductExcelColumn, unknown>;

export type ProductExcelRow = {
  row: number;
  values: ProductExcelValues;
};

const COLUMN_SET = new Set<string>(PRODUCT_EXCEL_COLUMNS);

const SAMPLE_ROW: Record<ProductExcelColumn, string | number | boolean> = {
  sku: 'p001',
  name: 'EXAMPLE PRODUCT 1 KG',
  origin: 'FRANCE',
  category: 'Fruit',
  pricePerUnit: 3.49,
  oldPrice: '',
  pricePerKg: 3.49,
  salesUnit: 'KG',
  tags: 'Bio',
  imageUrl: 'https://placehold.co/300x300?text=Example',
  gtin: '2000000000015',
  barcodeFixed: false,
  isAvailable: true,
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const unwrapCell = (value: unknown): unknown => {
  if (!isRecord(value)) return value;
  if ('result' in value) return unwrapCell(value.result);
  if ('text' in value) return value.text;
  if ('richText' in value && Array.isArray(value.richText)) {
    return value.richText
      .map((part) => (isRecord(part) && typeof part.text === 'string' ? part.text : ''))
      .join('');
  }
  if ('hyperlink' in value && 'text' in value) return value.text;
  return value;
};

export const cellToString = (value: unknown): string => {
  const unwrapped = unwrapCell(value);
  if (unwrapped === null || unwrapped === undefined) return '';
  if (typeof unwrapped === 'boolean') return unwrapped ? 'true' : 'false';
  if (typeof unwrapped === 'number') {
    if (!Number.isFinite(unwrapped)) return '';
    return String(unwrapped);
  }
  if (unwrapped instanceof Date) return unwrapped.toISOString();
  return String(unwrapped).trim();
};

const emptyValues = (): ProductExcelValues =>
  PRODUCT_EXCEL_COLUMNS.reduce<ProductExcelValues>((acc, column) => {
    acc[column] = '';
    return acc;
  }, {} as ProductExcelValues);

const applyColumnWidths = (sheet: ExcelJS.Worksheet): void => {
  sheet.columns = PRODUCT_EXCEL_COLUMNS.map((header) => ({
    header,
    key: header,
    width: header === 'name' || header === 'imageUrl' ? 40 : 16,
  }));
};

export const buildProductWorkbook = async (
  rows: Array<Record<ProductExcelColumn, unknown>>,
): Promise<Buffer> => {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Products');
  applyColumnWidths(sheet);

  rows.forEach((row) => {
    sheet.addRow(PRODUCT_EXCEL_COLUMNS.map((column) => row[column] ?? ''));
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
};

export const buildProductTemplateWorkbook = async (): Promise<Buffer> =>
  buildProductWorkbook([SAMPLE_ROW]);

export const parseProductWorkbook = async (buffer: Buffer): Promise<ProductExcelRow[]> => {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer as unknown as Parameters<ExcelJS.Xlsx['load']>[0]);

  const sheet = workbook.worksheets[0];
  if (!sheet) {
    throw new Error('The Excel file does not contain a worksheet');
  }

  const headerRow = sheet.getRow(1);
  const columnByIndex = new Map<number, ProductExcelColumn>();

  headerRow.eachCell({ includeEmpty: false }, (cell, colNumber) => {
    const header = cellToString(cell.value).trim();
    if (COLUMN_SET.has(header)) {
      columnByIndex.set(colNumber, header as ProductExcelColumn);
    }
  });

  if (columnByIndex.size === 0) {
    throw new Error('The first row must contain product column headers such as sku and name');
  }

  const rows: ProductExcelRow[] = [];

  sheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (rowNumber === 1) return;

    const values = emptyValues();
    columnByIndex.forEach((column, colNumber) => {
      values[column] = unwrapCell(row.getCell(colNumber).value);
    });

    const hasContent = PRODUCT_EXCEL_COLUMNS.some((column) => cellToString(values[column]).length > 0);
    if (!hasContent) return;

    rows.push({ row: rowNumber, values });
  });

  return rows;
};
