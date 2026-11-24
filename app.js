const startButton = document.querySelector("#start-button");
const stopButton = document.querySelector("#stop-button");
const startPanel = document.querySelector("#start-panel");
const controls = document.querySelector("#controls");
const notice = document.querySelector("#notice");
const cameraFeed = document.querySelector("#camera-feed");
const humanModeButton = document.querySelector("#human-mode");
const dogModeButton = document.querySelector("#dog-mode");
const modeStatus = document.querySelector("#mode-status");

let cameraStream = null;
let currentMode = "human";

async function startCamera() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    notice.textContent = "このブラウザーではカメラを利用できません。HTTPSで開いているか確認してください。";
    return;
  }

  startButton.disabled = true;
  notice.textContent = "カメラへのアクセスを確認しています…";

  try {
    cameraStream = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: {
        facingMode: { ideal: "environment" }
      }
    });

    cameraFeed.srcObject = cameraStream;
    startPanel.hidden = true;
    controls.hidden = false;
    setMode("human");
  } catch (error) {
    console.error("カメラを開始できませんでした:", error);
    startButton.disabled = false;

    if (error.name === "NotAllowedError" || error.name === "SecurityError") {
      notice.textContent = "カメラの使用が許可されていません。ブラウザーの設定で許可してください。";
    } else if (error.name === "NotFoundError") {
      notice.textContent = "利用できるカメラが見つかりませんでした。";
    } else {
      notice.textContent = "カメラを開始できませんでした。HTTPS接続とカメラ設定を確認してください。";
    }
  }
}

function setMode(mode) {
  currentMode = mode;
  const isHumanMode = currentMode === "human";

  humanModeButton.classList.toggle("is-active", isHumanMode);
  humanModeButton.setAttribute("aria-pressed", String(isHumanMode));
  dogModeButton.classList.toggle("is-active", !isHumanMode);
  dogModeButton.setAttribute("aria-pressed", String(!isHumanMode));

  if (isHumanMode) {
    modeStatus.textContent = "人間の見え方を表示しています";
    // 今後、ここに人間モード用の表示処理を追加できます。
    return;
  }

  // TODO: 犬の色覚変換を追加する際は、このモード切り替えに処理を接続します。
  modeStatus.textContent = "犬の見え方を選択中です。色覚変換は今後追加予定です。";
}

function stopCamera() {
  if (cameraStream) {
    cameraStream.getTracks().forEach((track) => track.stop());
    cameraStream = null;
  }

  cameraFeed.srcObject = null;
  controls.hidden = true;
  startPanel.hidden = false;
  startButton.disabled = false;
  notice.textContent = "カメラを停止しました。映像は外部に送信されません。";
}

startButton.addEventListener("click", startCamera);
stopButton.addEventListener("click", stopCamera);
humanModeButton.addEventListener("click", () => setMode("human"));
dogModeButton.addEventListener("click", () => setMode("dog"));
window.addEventListener("pagehide", stopCamera);
