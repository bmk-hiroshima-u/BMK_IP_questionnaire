const supabaseUrl = "https://xrvqmewmdjzsxyiprxck.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhydnFtZXdtZGp6c3h5aXByeGNrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTk4MDgyNDYsImV4cCI6MjAzNTM4NDI0Nn0.pumkW0fPJgVaRX7WBosyCIsobhWTOGbetubwPGwBKuc";
const { createClient } = supabase;
const _supabase = createClient(supabaseUrl, supabaseKey);

document.addEventListener("DOMContentLoaded", async function () {
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get("token");
  const response = await fetch(
    `/api/authenticate?token=${encodeURIComponent(token)}`
  );
  const data = await response.json();
  const table = urlParams.get("table");
  const consentDiv = document.getElementById("consent");

  if (data.authorized) {
    document.getElementById("content").style.display = "block";
  } else {
    alert("無効なトークンです。アクセスできません。");
    return;
  }

  if (urlParams.has("devmode")) {
    document.getElementById("developerSettings").style.display = "block";
  }

  if (table === "form_url_list_c") {
    consentDiv.style.display = "none";
  } else {
    consentDiv.style.display = "block";
  }

  let participantId = localStorage.getItem("responseId");
  if (!participantId) {
    participantId = await registerParticipant();
    localStorage.setItem("responseId", participantId);
  }
  document.getElementById("displayId").textContent =
    "Your ID: " + participantId;
  await fetchAndDisplayForms(participantId);

  setupDeveloperSettings();
});

document.addEventListener("visibilitychange", async function () {
  if (document.visibilityState === "visible") {
    const participantId = localStorage.getItem("responseId");
    if (participantId) {
      updateButtonStyles(participantId);
      setTimeout(() => {
        updateButtonStyles(participantId);
      }, 3000);
    }
  }
});

document
  .getElementById("pdfLink")
  .addEventListener("click", async function (event) {
    event.preventDefault();
    const password = prompt("Please enter the password to access the PDF:");
    if (password) {
      const response = await fetch(
        `/api/serve-pdf?password=${encodeURIComponent(password)}`,
        {
          method: "GET",
        }
      );

      if (response.ok) {
        const blob = await response.blob();
        const pdfUrl = URL.createObjectURL(blob);
        window.open(pdfUrl, "_self");
      } else {
        alert("Incorrect password.");
      }
    }
  });

  async function registerParticipant() {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const table = urlParams.get('table');
    const devmode = urlParams.get('devmode') === 'true';
  
    const { data, error } = await _supabase
      .from("id_list")
      .insert({
        user_agent: navigator.userAgent,
        screen_resolution: `${window.screen.width}x${window.screen.height}`,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        language: navigator.language,
        platform: navigator.platform,
        token: token,
        form_table: table,
        devmode: devmode
      })
      .select("id");
  
    if (error) {
      console.error("Error:", error.message);
      return;
    }
  
    const formattedId = "BMK_IP_" + ("000" + data[0].id).slice(-4);
    return formattedId;
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
  const urlParams = new URLSearchParams(window.location.search);
  const tableName = urlParams.get("table") || "form_url_list_a";

  const { data, error } = await _supabase.from(tableName).select("*");
  if (error) {
    console.error("Error fetching forms:", error.message);
    return;
  }

  for (let index = 0; index < data.length; index++) {
    const form = data[index];
    const formId = extractFormId(form.form_url);
    const container =
      index === 0 ? "buttonContainerTop" : "buttonContainerRest";
    const updatedUrl = updateFormUrl(form.form_view_url, participantId);
    addButton(updatedUrl, form.button_name, container, formId);
  }
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
  button.appendChild(textNode);

  const icon = document.createElement("i");
  icon.className = "fas fa-external-link-alt";
  icon.style.marginLeft = "16px";

  button.appendChild(icon);
  container.appendChild(button);
}

async function updateButtonStyles(participantId) {
  const buttons = document.querySelectorAll("a[data-form-id]");
  const formIds = Array.from(buttons).map((button) => button.dataset.formId);

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
    const isCompleted = completedFormIds.has(formId);
    button.className = `btn btn-lg ${
      isCompleted ? "btn-success" : "btn-primary"
    }`;
    const updatedUrl = updateFormUrl(button.href, participantId);
    button.href = updatedUrl;
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
    localStorage.removeItem("responseId");
    const newId = await registerParticipant();
    localStorage.setItem("responseId", newId);
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
    localStorage.setItem("responseId", selectedId);
    document.getElementById("displayId").textContent = "Your ID: " + selectedId;
    await updateButtonStyles(selectedId);
  };
  content.appendChild(idSelect);

  if (ids.length > 0) {
    idSelect.value =
      localStorage.getItem("responseId") ||
      "BMK_IP_" + ("000" + ids[0].id).slice(-4);
  }
}
