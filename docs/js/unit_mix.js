const RENT_ROLL_START_ROW = 8;
const RENT_ROLL_END_ROW = 67;

const UNIT_MIX_COLUMNS = [
  ["unit_type", "Unit Type (SF)", "text"],
  ["units", "# of Units", "integer"],
  ["occupied", "# of Occupied Units", "integer"],
  ["vacant", "# of Vacant Units", "integer"],
  ["pct", "%", "percent"],
  ["gpr", "GPR", "currency"],
  ["loss_to_lease", "Loss to Lease", "currency"],
  ["in_place", "In Place Rent", "currency"],
  ["vacancy", "Vacancy", "currency"],
  ["net", "Net Rental Income", "currency"],
];

function isVacantOrDown(name) {
  if (name == null) {
    return false;
  }
  const normalized = String(name).trim().toUpperCase();
  return normalized === "VACANT" || normalized === "DOWN";
}

function toFloat(value) {
  if (value == null || value === "") {
    return null;
  }
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function average(values) {
  if (!values.length) {
    return 0;
  }
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function cellValue(sheet, row, column) {
  const ref = XLSX.utils.encode_cell({ r: row - 1, c: column - 1 });
  const cell = sheet[ref];
  return cell ? cell.v : null;
}

function readRentRollRows(workbook) {
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rows = [];

  for (let rowIdx = RENT_ROLL_START_ROW; rowIdx <= RENT_ROLL_END_ROW; rowIdx += 1) {
    const sqFt = cellValue(sheet, rowIdx, 3);
    if (sqFt == null || String(sqFt).trim() === "") {
      continue;
    }

    rows.push({
      sq_ft: String(sqFt).trim(),
      name: cellValue(sheet, rowIdx, 5),
      market_rent: cellValue(sheet, rowIdx, 6),
      actual_rent: cellValue(sheet, rowIdx, 7),
    });
  }

  return rows;
}

function uniqueUnitTypes(rows) {
  const seen = new Map();
  for (const row of rows) {
    if (!seen.has(row.sq_ft)) {
      seen.set(row.sq_ft, true);
    }
  }
  return Array.from(seen.keys());
}

function calculateUnitMixFromWorkbook(workbook) {
  const rentRows = readRentRollRows(workbook);
  if (!rentRows.length) {
    throw new Error("No rent roll data found in rows 8-67 (column C).");
  }

  const unitTypes = uniqueUnitTypes(rentRows);
  const dataRows = unitTypes.map((unitType) => {
    const subset = rentRows.filter((row) => row.sq_ft === unitType);
    const units = subset.length;
    const vacant = subset.filter((row) => isVacantOrDown(row.name)).length;
    const occupied = units - vacant;

    const marketRents = subset
      .map((row) => toFloat(row.market_rent))
      .filter((value) => value != null);
    const gpr = average(marketRents);

    const occupiedRows = subset.filter((row) => !isVacantOrDown(row.name));
    const inPlaceValues = occupiedRows
      .map((row) => toFloat(row.actual_rent))
      .filter((value) => value != null);
    const inPlace = average(inPlaceValues);

    const actualValues = subset
      .map((row) => toFloat(row.actual_rent))
      .filter((value) => value != null);
    const net = average(actualValues);

    return {
      unit_type: unitType,
      units,
      occupied,
      vacant,
      pct: 0,
      gpr,
      loss_to_lease: inPlace - gpr,
      in_place: inPlace,
      vacancy: net - inPlace,
      net,
    };
  });

  const totalUnits = dataRows.reduce((sum, row) => sum + row.units, 0);
  for (const row of dataRows) {
    row.pct = totalUnits ? row.units / totalUnits : 0;
  }

  const totalOccupied = dataRows.reduce((sum, row) => sum + row.occupied, 0);
  const totalVacant = dataRows.reduce((sum, row) => sum + row.vacant, 0);

  const monthlyGpr = dataRows.reduce((sum, row) => sum + row.gpr * row.units, 0);
  const monthlyLoss = dataRows.reduce(
    (sum, row) => sum + row.loss_to_lease * row.units,
    0
  );
  const monthlyInPlace = dataRows.reduce(
    (sum, row) => sum + row.in_place * row.units,
    0
  );
  const monthlyNet = dataRows.reduce((sum, row) => sum + row.net * row.units, 0);
  const monthlyVacancy = monthlyNet - monthlyInPlace;

  return {
    title: "Unit Mix",
    columns: UNIT_MIX_COLUMNS.map(([key, label, format]) => ({
      key,
      label,
      format,
    })),
    rows: dataRows,
    totals: {
      label: "Totals",
      units: totalUnits,
      occupied: totalOccupied,
      vacant: totalVacant,
    },
    monthly: {
      label: "Monthly",
      gpr: monthlyGpr,
      loss_to_lease: monthlyLoss,
      in_place: monthlyInPlace,
      vacancy: monthlyVacancy,
      net: monthlyNet,
    },
    annually: {
      label: "Annually",
      gpr: monthlyGpr * 12,
      loss_to_lease: monthlyLoss * 12,
      in_place: monthlyInPlace * 12,
      vacancy: monthlyVacancy * 12,
      net: monthlyNet * 12,
    },
  };
}

async function calculateUnitMixFromFile(file) {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array" });
  return calculateUnitMixFromWorkbook(workbook);
}
