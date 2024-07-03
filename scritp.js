function sendFormData() {
  var recognitionNumber =
    localStorage.getItem("recognitionNumber") ||
    Math.random().toString(36).substring(2);
  localStorage.setItem("recognitionNumber", recognitionNumber);

  var storedId = localStorage.getItem("responseId");
  if (!storedId) {
    var postData = {
      recognition_number: recognitionNumber,
      user_agent: navigator.userAgent,
      screen_resolution: window.screen.width + "x" + window.screen.height,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      language: navigator.language,
      platform: navigator.platform,
    };

    fetch("https://xrvqmewmdjzsxyiprxck.supabase.co/functions/v1/bmk-ip-api", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization:
          "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhydnFtZXdtZGp6c3h5aXByeGNrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTk4MDgyNDYsImV4cCI6MjAzNTM4NDI0Nn0.pumkW0fPJgVaRX7WBosyCIsobhWTOGbetubwPGwBKuc",
      },
      body: JSON.stringify(postData),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Network response was not ok " + response.statusText);
        }
        return response.json();
      })
      .then((data) => {
        var formattedId = "BMK_IP_" + ("000" + data.id).slice(-4);
        localStorage.setItem("responseId", formattedId);
        updateButtons(formattedId);
        document.getElementById("displayId").textContent =
          "Your ID: " + formattedId;
      })
      .catch((error) => {
        console.error("Error:", error);
        alert("エラーが発生しました: " + error.message);
      });
  } else {
    updateButtons(storedId);
    document.getElementById("displayId").textContent = "Your ID: " + storedId;
  }
}

window.onload = sendFormData;

function addButton(link, label, containerId) {
  const container = document.getElementById(containerId);
  const button = document.createElement("a");
  button.href = link;
  button.target = "_blank";
  button.className = "btn btn-primary btn-lg";
  button.role = "button";
  button.textContent = label;
  container.appendChild(button);
}

function updateButtons(id) {
  addButton(
    "https://docs.google.com/forms/d/e/1FAIpQLSe4NuE7hF0ZgetS3yMxdsJ9_15kujdMTfjTxRlR7aUgn86QnA/viewform?usp=pp_url&entry.1783943201=" +
      encodeURIComponent(id),
    "基本情報",
    "buttonContainerTop"
  );
  addButton(
    "https://docs.google.com/forms/d/e/1FAIpQLScDf_sRrBWS-tOLY5oqE0IrPnDemItjSYbXO_LcbGZW2YF3pQ/viewform?usp=pp_url&entry.1182556031=" +
      encodeURIComponent(id),
    "質問紙1",
    "buttonContainerRest"
  );
  addButton(
    "https://docs.google.com/forms/d/e/1FAIpQLSfxotgsSLhBGim-j5Hwara-ag_T8FYzRjMpoAM1WwE21VQDlw/viewform?usp=pp_url&entry.303781595=" +
      encodeURIComponent(id),
    "質問紙2",
    "buttonContainerRest"
  );
  addButton(
    "https://docs.google.com/forms/d/e/1FAIpQLSfxotgsSLhBGim-j5Hwara-ag_T8FYzRjMpoAM1WwE21VQDlw/viewform?usp=pp_url&entry.303781595=" +
      encodeURIComponent(id),
    "質問紙3",
    "buttonContainerRest"
  );
  addButton(
    "https://docs.google.com/forms/d/e/1FAIpQLSfxotgsSLhBGim-j5Hwara-ag_T8FYzRjMpoAM1WwE21VQDlw/viewform?usp=pp_url&entry.303781595=" +
      encodeURIComponent(id),
    "質問紙4",
    "buttonContainerRest"
  );
  addButton(
    "https://docs.google.com/forms/d/e/1FAIpQLSfxotgsSLhBGim-j5Hwara-ag_T8FYzRjMpoAM1WwE21VQDlw/viewform?usp=pp_url&entry.303781595=" +
      encodeURIComponent(id),
    "質問紙5",
    "buttonContainerRest"
  );
  addButton(
    "https://docs.google.com/forms/d/e/1FAIpQLSfxotgsSLhBGim-j5Hwara-ag_T8FYzRjMpoAM1WwE21VQDlw/viewform?usp=pp_url&entry.303781595=" +
      encodeURIComponent(id),
    "質問紙6",
    "buttonContainerRest"
  );
  addButton(
    "https://docs.google.com/forms/d/e/1FAIpQLSfxotgsSLhBGim-j5Hwara-ag_T8FYzRjMpoAM1WwE21VQDlw/viewform?usp=pp_url&entry.303781595=" +
      encodeURIComponent(id),
    "質問紙7",
    "buttonContainerRest"
  );
  addButton(
    "https://docs.google.com/forms/d/e/1FAIpQLSfxotgsSLhBGim-j5Hwara-ag_T8FYzRjMpoAM1WwE21VQDlw/viewform?usp=pp_url&entry.303781595=" +
      encodeURIComponent(id),
    "質問紙8",
    "buttonContainerRest"
  );
  addButton(
    "https://docs.google.com/forms/d/e/1FAIpQLSfxotgsSLhBGim-j5Hwara-ag_T8FYzRjMpoAM1WwE21VQDlw/viewform?usp=pp_url&entry.303781595=" +
      encodeURIComponent(id),
    "質問紙9",
    "buttonContainerRest"
  );
  addButton(
    "https://docs.google.com/forms/d/e/1FAIpQLSfxotgsSLhBGim-j5Hwara-ag_T8FYzRjMpoAM1WwE21VQDlw/viewform?usp=pp_url&entry.303781595=" +
      encodeURIComponent(id),
    "質問紙10",
    "buttonContainerRest"
  );
}
