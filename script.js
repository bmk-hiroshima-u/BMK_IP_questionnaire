const supabaseUrl = "https://xrvqmewmdjzsxyiprxck.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhydnFtZXdtZGp6c3h5aXByeGNrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTk4MDgyNDYsImV4cCI6MjAzNTM4NDI0Nn0.pumkW0fPJgVaRX7WBosyCIsobhWTOGbetubwPGwBKuc";
const { createClient } = supabase;
const _supabase = createClient(supabaseUrl, supabaseKey);

function isLocalStorageAvailable() {
  try {
    const test = "test";
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch (e) {
    return false;
  }
}

const storageAvailable = isLocalStorageAvailable();

function getParticipantId() {
  if (storageAvailable) {
    return localStorage.getItem("responseId");
  } else if (document.cookie) {
    var match = document.cookie.match(
      new RegExp("(^| )" + "responseId" + "=([^;]+)")
    );
    if (match) {
      return match[2];
    }
  } else if (window.tempStorage) {
    return window.tempStorage;
  }
  return null;
}

function setParticipantId(id) {
  if (storageAvailable) {
    localStorage.setItem("responseId", id);
  } else {
    document.cookie =
      "responseId=" + id + ";path=/;max-age=" + 60 * 60 * 24 * 365;
    window.tempStorage = id;
  }
}

document.addEventListener("DOMContentLoaded", async function () {
  const urlParams = new URLSearchParams(window.location.search);
  handleAuthentication(urlParams);
  handleVisibilityChanges();
});

async function handleAuthentication(urlParams) {
  const token = urlParams.get("token");
  const response = await fetch(
    `/api/authenticate?token=${encodeURIComponent(token)}`
  );
  const data = await response.json();

  if (data.authorized) {
    document.getElementById("content").style.display = "block";
  } else {
    alert("無効なトークンです。アクセスできません。");
    return;
  }

  document.getElementById("developerSettings").style.display = urlParams.has(
    "devmode"
  )
    ? "block"
    : "none";
  document.getElementById("consent").style.display =
    urlParams.get("table") === "form_url_list_c" ? "none" : "block";

  let participantId = getParticipantId();
  if (!participantId) {
    participantId = await registerParticipant();
    setParticipantId(participantId);
  }
  document.getElementById("displayId").textContent =
    "Your ID: " + participantId;
  await fetchAndDisplayForms(participantId);
  setupDeveloperSettings();
}

document.getElementById("pdfLink").addEventListener("click", handlePdfAccess);

async function handlePdfAccess(event) {
  event.preventDefault();
  const password = prompt("Please enter the password to access the PDF:");
  if (!password) return;

  const response = await fetch(
    `/api/serve-pdf?password=${encodeURIComponent(password)}`,
    { method: "GET" }
  );
  if (response.ok) {
    const blob = await response.blob();
    window.open(URL.createObjectURL(blob), "_self");
  } else {
    alert("Incorrect password.");
  }
}

async function registerParticipant() {
  const urlParams = new URLSearchParams(window.location.search);
  const { data, error } = await _supabase
    .from("id_list")
    .insert({
      user_agent: navigator.userAgent,
      screen_resolution: `${window.screen.width}x${window.screen.height}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      language: navigator.language,
      platform: navigator.platform,
      token: urlParams.get("token"),
      form_table: urlParams.get("table"),
      devmode: urlParams.get("devmode") === "true",
    })
    .select("id");

  if (error) {
    console.error("Error:", error.message);
    return;
  }

  return "BMK_IP_" + ("000" + data[0].id).slice(-4);
}

function handleVisibilityChanges() {
  document.addEventListener("visibilitychange", async function () {
    if (document.visibilityState !== "visible") return;
    const participantId = getParticipantId();
    if (!participantId) return;

    updateButtonStyles(participantId);
    setTimeout(() => updateButtonStyles(participantId), 3000);
  });
}

function updateFormUrl(formUrl, participantId) {
  const url = new URL(formUrl);
  const params = new URLSearchParams(url.search);
  for (const [key, value] of params.entries()) {
    if (key.startsWith("entry.")) {
      params.set(key, participantId);
    }
  }
  url.search = params.toString();
  return url.href;
}

async function fetchAndDisplayForms(participantId) {
  const tableName =
    new URLSearchParams(window.location.search).get("table") ||
    "form_url_list_a";
  const { data, error } = await _supabase.from(tableName).select("*");

  if (error) {
    console.error("Error fetching forms:", error.message);
    return;
  }

  data.forEach((form, index) => {
    const formId = extractFormId(form.form_url);
    const containerId =
      index === 0 ? "buttonContainerTop" : "buttonContainerRest";
    addButton(
      updateFormUrl(form.form_view_url, participantId),
      form.button_name,
      containerId,
      formId
    );
  });

  updateButtonStyles(participantId);
}

function addButton(link, label, containerId, formId) {
  const container = document.getElementById(containerId);
  const button = document.createElement("a");
  button.href = link;
  button.target = "_blank";
  button.rel = "noopener noreferrer";
  button.className = "btn btn-lg btn-primary";
  button.dataset.formId = formId;

  const textNode = document.createTextNode(label);
  const icon = document.createElement("i");
  icon.className = "fas fa-external-link-alt";
  icon.style.marginLeft = "16px";

  button.append(textNode, icon);
  container.appendChild(button);
}

async function updateButtonStyles(participantId) {
  const buttons = document.querySelectorAll("a[data-form-id]");
  const formIds = Array.from(buttons, (button) => button.dataset.formId);
  const { data, error_rsp } = await _supabase
    .from("completed_responses")
    .select("*")
    .in("form_id", formIds)
    .eq("participant_id", participantId);

  if (error_rsp) {
    console.error("Error fetching completion statuses:", error_rsp.message);
    return;
  }

  const completedFormIds = new Set(data.map((item) => item.form_id));
  buttons.forEach((button) => {
    const formId = button.dataset.formId;
    button.className = `btn btn-lg ${
      completedFormIds.has(formId) ? "btn-success" : "btn-primary"
    }`;
    button.href = updateFormUrl(button.href, participantId);
  });

  document.getElementById("displayId").textContent =
    "Your ID: " + participantId;

  const idSelect = document.getElementById("idSelect");
  const existingIds = new Set();
  for (let option of idSelect.options) {
    existingIds.add(option.value);
  }

  const { data_id: ids, error_id } = await _supabase
    .from("id_list")
    .select("id");
  if (error_id) {
    console.error("Error fetching ids:", error_id.message);
    return;
  }

  ids.forEach((idObj) => {
    const idValue = "BMK_IP_" + ("000" + idObj.id).slice(-4);
    if (!existingIds.has(idValue)) {
      const option = document.createElement("option");
      option.value = idValue;
      option.textContent = idValue;
      idSelect.appendChild(option);
    }
  });

  if (!existingIds.has(participantId)) {
    idSelect.value = "BMK_IP_" + ("000" + participantId).slice(-4);
  }
}

function extractFormId(url) {
  const match = url.match(/\/d\/(.+?)\//);
  return match ? match[1] : null;
}

async function setupDeveloperSettings() {
  const developerSettings = document.getElementById("developerSettings");
  const content = developerSettings.querySelector(
    ".developer-settings-content"
  );

  const newIdButton = document.getElementById("newIdButton");
  newIdButton.textContent = "新規ID取得";
  newIdButton.onclick = async () => {
    const newId = await registerParticipant();
    setParticipantId(newId);
    document.getElementById("displayId").textContent = "Your ID: " + newId;
    await updateButtonStyles(newId);
  };
  content.appendChild(newIdButton);

  const idSelect = document.getElementById("idSelect");
  const { data: ids, error } = await _supabase.from("id_list").select("id");
  if (error) {
    console.error("Error fetching ids:", error.message);
    return;
  }
  ids.forEach((idObj) => {
    const option = document.createElement("option");
    option.value = "BMK_IP_" + ("000" + idObj.id).slice(-4);
    option.textContent = option.value;
    idSelect.appendChild(option);
  });
  idSelect.onchange = async () => {
    const selectedId = idSelect.value;
    setParticipantId(selectedId);
    document.getElementById("displayId").textContent = "Your ID: " + selectedId;
    await updateButtonStyles(selectedId);
  };
  content.appendChild(idSelect);

  if (ids.length > 0) {
    idSelect.value =
      getParticipantId() || "BMK_IP_" + ("000" + ids[0].id).slice(-4);
  }
}
