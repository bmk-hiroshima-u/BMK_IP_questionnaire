const supabaseUrl = "https://xrvqmewmdjzsxyiprxck.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhydnFtZXdtZGp6c3h5aXByeGNrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTk4MDgyNDYsImV4cCI6MjAzNTM4NDI0Nn0.pumkW0fPJgVaRX7WBosyCIsobhWTOGbetubwPGwBKuc";
const { createClient } = supabase;
const _supabase = createClient(supabaseUrl, supabaseKey);

document.addEventListener("DOMContentLoaded", async function () {
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get("token");
  const correctToken = "yxmodlonggpx22fzrtzm";

  if (token === correctToken) {
    document.getElementById("content").style.display = "block";
  } else {
    alert("無効なトークンです。アクセスできません。");
  }

  if (urlParams.has("devmode")) {
    document.getElementById("developerSettings").style.display = "block";
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
    }
  }
});

async function registerParticipant() {
  const { data, error } = await _supabase
    .from("id_list")
    .insert({
      user_agent: navigator.userAgent,
      screen_resolution: `${window.screen.width}x${window.screen.height}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      language: navigator.language,
      platform: navigator.platform,
    })
    .select("*");
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
  button.className = "btn btn-lg btn-primary";
  button.textContent = label;
  button.dataset.formId = formId;
  container.appendChild(button);
}

async function updateButtonStyles(participantId) {
  const buttons = document.querySelectorAll("a[data-form-id]");
  for (const button of buttons) {
    const updatedUrl = updateFormUrl(button.href, participantId);
    const formId = button.dataset.formId;
    const isCompleted = await checkCompleted(participantId, formId);
    button.className = `btn btn-lg ${
      isCompleted ? "btn-success" : "btn-primary"
    }`;
    button.href = updatedUrl;
  }
}

async function checkCompleted(participantId, formId) {
  const { data, error } = await _supabase
    .from("completed_responses")
    .select("*")
    .match({ participant_id: participantId, form_id: formId });
  if (error) {
    console.error("Error checking completion status:", error.message);
    return false;
  }
  return data.length > 0;
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
