// Apps Script: Code.gs
const SHEET_NAME = 'Main'; // change
const ID_COL = 1; // column A if you add an id; otherwise use row number (not recommended)
const CREATED_AT_COL = 2; // adjust if you add id column; example assumes id present; otherwise shift
const UPDATED_AT_COL = 3;
const TASK_COL = 4;
const PROJECT_COL = 5;
const STATUS_COL = 6;
const NOTES_COL = 7;

function doGet(e) {
  return handleRequest(e);
}
function doPost(e) {
  // For update/move we support POST with action param
  return handleRequest(e);
}

function handleRequest(e) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAME);
  const params = e.parameter || {};
  const action = params.action || 'list'; // default list
  try {
    if (action === 'add') {
      const payload = e.postData ? JSON.parse(e.postData.contents) : params;
      return jsonResponse(addRow(sheet, payload), 201);
    } else if (action === 'update') {
      const payload = e.postData ? JSON.parse(e.postData.contents) : params;
      return jsonResponse(updateRowById(sheet, payload.id, payload));
    } else if (action === 'move') {
      const payload = e.postData ? JSON.parse(e.postData.contents) : params;
      return jsonResponse(moveRow(sheet, payload.id, payload.direction, Number(payload.positions||1)));
    } else if (action === 'get') {
      // single row by id
      const id = params.id;
      return jsonResponse(getRowById(sheet, id));
    } else {
      // list/search/filter
      const query = {
        status: params.status,      // comma separated
        q: params.q,
        created_from: params.created_from,
        created_to: params.created_to,
        updated_from: params.updated_from,
        updated_to: params.updated_to,
        limit: params.limit ? Number(params.limit) : 100,
        offset: params.offset ? Number(params.offset) : 0
      };
      return jsonResponse(listRows(sheet, query));
    }
  } catch (err) {
    return jsonResponse({ error: err.message }, 500);
  }
}

// --- Core helpers ---

function addRow(sheet, payload) {
  const now = (new Date()).toISOString();
  const id = payload.id || Utilities.getUuid();
  const created_at = payload.created_at || now;
  const updated_at = payload.updated_at || now;
  const row = [
    id,
    created_at,
    updated_at,
    payload.task || '',
    payload.project || '',
    payload.status || '',
    payload.notes || ''
  ];
  sheet.appendRow(row);
  const rowNumber = sheet.getLastRow();
  return { id, rowNumber, created_at };
}

function findRowIndexById(sheet, id) {
  if (!id) throw new Error('id is required');
  const vals = sheet.getRange(1, ID_COL, sheet.getLastRow(), 1).getValues();
  for (let i = 0; i < vals.length; i++) {
    if (String(vals[i][0]) === String(id)) return i + 1; // row number
  }
  return null;
}

function getRowById(sheet, id) {
  const r = findRowIndexById(sheet, id);
  if (!r) return null;
  const values = sheet.getRange(r, 1, 1, sheet.getLastColumn()).getValues()[0];
  return mapRowToObject(values, r);
}

function updateRowById(sheet, id, payload) {
  const r = findRowIndexById(sheet, id);
  if (!r) throw new Error('row not found');
  const now = (new Date()).toISOString();
  const updated_at = payload.updated_at || now;
  // write only provided fields
  const current = sheet.getRange(r, 1, 1, sheet.getLastColumn()).getValues()[0];
  const newRow = current.slice(); // copy
  if (payload.task !== undefined) newRow[TASK_COL-1] = payload.task;
  if (payload.project !== undefined) newRow[PROJECT_COL-1] = payload.project;
  if (payload.status !== undefined) newRow[STATUS_COL-1] = payload.status;
  if (payload.notes !== undefined) newRow[NOTES_COL-1] = payload.notes;
  newRow[UPDATED_AT_COL-1] = updated_at;
  sheet.getRange(r, 1, 1, newRow.length).setValues([newRow]);
  return { id, rowNumber: r, updated_at };
}

function moveRow(sheet, id, direction, positions) {
  const r = findRowIndexById(sheet, id);
  if (!r) throw new Error('row not found');
  positions = positions || 1;

  let targetRow;

  if (direction === 'top') {
    targetRow = 2; // immediately below the title row
  } else {
    targetRow = (direction === 'up') ? r - positions : r + positions;
    targetRow = Math.max(1, Math.min(sheet.getLastRow(), targetRow));
  }

  if (targetRow === r) return { id, oldRowNumber: r, newRowNumber: r };

  const numCols = sheet.getLastColumn();
  const sourceRange = sheet.getRange(r, 1, 1, numCols);
  const sourceVals = sourceRange.getValues()[0];

  // Remove the original row first
  sheet.deleteRow(r);

  // Adjust targetRow if necessary (since deleting above shifts rows up)
  if (direction !== 'top' && targetRow > r) {
    targetRow -= 1;
  }

  // Insert a new row at the target position
  sheet.insertRowBefore(targetRow);
  const targetRange = sheet.getRange(targetRow, 1, 1, numCols);
  targetRange.setValues([sourceVals]);

  return { id, oldRowNumber: r, newRowNumber: targetRow };
}

function listRows(sheet, query) {
  const all = sheet.getDataRange().getValues(); // includes header if present
  // If first row is header, adjust - easiest if header exists; assume header row 1 contains "id" or "created_at".
  // For simplicity assume header row exists. Skip header:
  const header = all[0];
  const rows = all.slice(1).map((r,i) => mapRowToObject(r, i+2)); // row numbers start 2
  let filtered = rows;

  if (query.status) {
    const statuses = String(query.status).split(',').map(s=>s.trim().toLowerCase());
    filtered = filtered.filter(r => statuses.includes(String(r.status||'').toLowerCase()));
  }
  if (query.q) {
    const q = String(query.q).toLowerCase();
    filtered = filtered.filter(r =>
      String(r.task||'').toLowerCase().includes(q) ||
      String(r.project||'').toLowerCase().includes(q) ||
      String(r.notes||'').toLowerCase().includes(q)
    );
  }
  if (query.created_from || query.created_to) {
    filtered = filtered.filter(r => {
      const d = r.created_at ? new Date(r.created_at) : null;
      if (!d) return false;
      if (query.created_from && d < new Date(query.created_from)) return false;
      if (query.created_to && d > new Date(query.created_to)) return false;
      return true;
    });
  }
  if (query.updated_from || query.updated_to) {
    filtered = filtered.filter(r => {
      const d = r.updated_at ? new Date(r.updated_at) : null;
      if (!d) return false;
      if (query.updated_from && d < new Date(query.updated_from)) return false;
      if (query.updated_to && d > new Date(query.updated_to)) return false;
      return true;
    });
  }

  const offset = query.offset || 0;
  const limit = query.limit || 100;
  const page = filtered.slice(offset, offset + limit);

  return { header, total: filtered.length, offset, limit, rows: page };
}

function mapRowToObject(values, rowNumber) {
  return {
    id: values[ID_COL - 1],
    created_at: values[CREATED_AT_COL - 1],
    updated_at: values[UPDATED_AT_COL - 1],
    task: values[TASK_COL - 1],
    project: values[PROJECT_COL - 1],
    status: values[STATUS_COL - 1],
    notes: values[NOTES_COL - 1],
    rowNumber: rowNumber
  };
}

function jsonResponse(obj, code) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}