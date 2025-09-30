/* ============= UTILIDADES ============= */
const LS_KEY = "pd_orb_buildsheet_v1";

function formToJSON() {
  const data = {};
  const inputs = document.querySelectorAll("input, select, textarea");
  inputs.forEach(el => {
    if (!el.name) return;
    if (el.type === "checkbox") {
      data[el.name] = el.checked;
    } else {
      data[el.name] = el.value;
    }
  });

  // Tabla Grooves (construcción robusta)
  const grooves = [];
  document.querySelectorAll("#tblGrooves tbody tr").forEach((tr, idx) => {
    const row = {};
    tr.querySelectorAll("input, select, textarea").forEach(inp => {
      if (!inp.name) return;
      row[inp.name || `col_${idx}`] = inp.type === "checkbox" ? inp.checked : inp.value;
    });
    grooves.push(row);
  });
  data["_grooves_rows"] = grooves;
  return data;
}

function jsonToForm(data) {
  if (!data) return;
  const inputs = document.querySelectorAll("input, select, textarea");
  inputs.forEach(el => {
    if (!el.name || !(el.name in data)) return;
    if (el.type === "checkbox") el.checked = !!data[el.name];
    else el.value = data[el.name] ?? "";
  });

  // reconstruir tabla Grooves si viene en data
  const tbody = document.querySelector("#tblGrooves tbody");
  // Limpia menos la primera fila que ya existe:
  while (tbody.rows.length > 1) tbody.deleteRow(0);

  if (Array.isArray(data._grooves_rows) && data._grooves_rows.length) {
    // llenar primera fila existente
    tbody.querySelectorAll("tr").forEach((tr) => {
      const inputs = tr.querySelectorAll("input,select,textarea");
      inputs.forEach(inp => {
        const key = inp.name;
        if (data._grooves_rows[0] && key in data._grooves_rows[0]) {
          inp.value = data._grooves_rows[0][key] || "";
        }
      });
    });
    // filas adicionales:
    for (let i = 1; i < data._grooves_rows.length; i++) {
      addGrooveRow(data._grooves_rows[i]);
    }
  }
}

function saveDraft() {
  const data = formToJSON();
  localStorage.setItem(LS_KEY, JSON.stringify(data));
  toast("Borrador guardado.");
}
function loadDraft() {
  const raw = localStorage.getItem(LS_KEY);
  if (!raw) { toast("No hay borrador guardado.", true); return; }
  const data = JSON.parse(raw);
  jsonToForm(data);
  toast("Borrador cargado.");
}
function clearAll() {
  document.querySelectorAll("input, select, textarea").forEach(el => {
    if (el.type === "checkbox") el.checked = false;
    else el.value = "";
  });
  // Reset tabla grooves a una sola fila
  const tbody = document.querySelector("#tblGrooves tbody");
  while (tbody.rows.length > 1) tbody.deleteRow(0);
  tbody.querySelectorAll("input").forEach(inp => inp.value = "");
  toast("Formulario limpio.");
}
function download(filename, text) {
  const a = document.createElement('a');
  a.setAttribute('href', 'data:application/json;charset=utf-8,' + encodeURIComponent(text));
  a.setAttribute('download', filename);
  a.style.display='none';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

function exportJSON() {
  // Validación mínima de campos clave
  const bias = document.querySelector('[name="bias_sn"]');
  if (!bias.value.trim()) {
    bias.focus();
    toast("⚠️ Ingresa Bias Unit S/N", true);
    return;
  }
  const payload = formToJSON();
  const filename = `buildsheet_${(payload.bias_sn||'sinSN').replace(/\W+/g,'_')}.json`;
  download(filename, JSON.stringify(payload, null, 2));
  toast("Exportado como JSON.");
}

/* ============= UI TOAST ============= */
let toastTimeout;
function toast(msg, warn=false){
  clearTimeout(toastTimeout);
  let el = document.getElementById("toast");
  if (!el) {
    el = document.createElement("div");
    el.id="toast";
    el.style.position="fixed";
    el.style.bottom="20px";
    el.style.left="50%";
    el.style.transform="translateX(-50%)";
    el.style.background= warn ? "#fee2e2" : "#e0f2fe";
    el.style.color= warn ? "#991b1b" : "#0c4a6e";
    el.style.border="1px solid #cbd5e1";
    el.style.padding="10px 14px";
    el.style.borderRadius="12px";
    el.style.boxShadow="0 10px 30px rgba(0,0,0,.2)";
    el.style.zIndex="9999";
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.style.display="block";
  toastTimeout = setTimeout(()=>{ el.style.display="none"; }, 2200);
}

/* ============= GROOVES ROWS ============= */
function removeRow(btn){
  const tr = btn.closest("tr");
  const tbody = tr.parentElement;
  if (tbody.rows.length === 1){
    // limpiar si es la única
    tr.querySelectorAll("input").forEach(i=>i.value="");
    return;
  }
  tr.remove();
}

function addGrooveRow(prefill){
  const tbody = document.querySelector("#tblGrooves tbody");
  const idx = tbody.rows.length; // para nombres únicos si deseas
  const tr = document.createElement("tr");
  tr.innerHTML = `
    <td><input name="grooves_${idx}_count" type="number" min="0" placeholder="0" /></td>
    <td><input name="grooves_${idx}_bu_end" placeholder="dato" /></td>
    <td><input name="grooves_${idx}_cc_end" placeholder="dato" /></td>
    <td><input name="grooves_${idx}_es_bu" placeholder="dato" /></td>
    <td><input name="grooves_${idx}_es_cc" placeholder="dato" /></td>
    <td><input name="grooves_${idx}_obs" placeholder="Opcional" /></td>
    <td><button class="btn warn" onclick="removeRow(this)">✕</button></td>
  `;
  tbody.appendChild(tr);
  if (prefill && typeof prefill === "object"){
    tr.querySelectorAll("input,select,textarea").forEach(inp=>{
      const key = inp.name;
      if (key in prefill) inp.value = prefill[key] ?? "";
    });
  }
}

/* ============= AUTOSAVE ============= */
let autosaveTimer;
function scheduleAutosave() {
  clearTimeout(autosaveTimer);
  autosaveTimer = setTimeout(()=> {
    saveDraft();
  }, 1200);
}

/* ============= INIT ============= */
window.addEventListener("DOMContentLoaded", () => {
  // Botones
  document.getElementById("btnSave").addEventListener("click", saveDraft);
  document.getElementById("btnLoad").addEventListener("click", loadDraft);
  document.getElementById("btnClear").addEventListener("click", clearAll);
  document.getElementById("btnExport").addEventListener("click", exportJSON);

  // Autosave al escribir
  document.querySelectorAll("input, select, textarea").forEach(el=>{
    el.addEventListener("input", scheduleAutosave);
    el.addEventListener("change", scheduleAutosave);
  });

  // Carga automática si hay borrador
  const raw = localStorage.getItem(LS_KEY);
  if (raw) {
    jsonToForm(JSON.parse(raw));
    toast("Borrador previo cargado.");
  }
});
