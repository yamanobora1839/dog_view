const startButton = document.querySelector("#start-button");
const stopButton = document.querySelector("#stop-button");
const startPanel = document.querySelector("#start-panel");
const controls = document.querySelector("#controls");
const notice = document.querySelector("#notice");
const cameraFeed = document.querySelector("#camera-feed");
const dogView = document.querySelector("#dog-view");
const humanModeButton = document.querySelector("#human-mode");
const dogModeButton = document.querySelector("#dog-mode");
const modeStatus = document.querySelector("#mode-status");
const dogContext = dogView.getContext("2d", { willReadFrequently: true, alpha: false });

const MAX_PROCESSING_SIZE = 720;
const DOG_BLUR_PX = 1.2;
let cameraStream = null;
let currentMode = "human";
let animationFrameId = null;
let processingWidth = 0;
let processingHeight = 0;

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
    startRenderLoop();
  } catch (error) {
    console.error("カメラを開始できませんでした:", error);
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      cameraStream = null;
    }
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

  cameraFeed.hidden = !isHumanMode;
  dogView.hidden = isHumanMode;
  // CSS filter applies a light blur after the color-transformed canvas is composed.
  dogView.style.filter = isHumanMode ? "none" : `blur(${DOG_BLUR_PX}px)`;

  if (isHumanMode) {
    modeStatus.textContent = "人間の見え方を表示しています";
    return;
  }

  modeStatus.textContent = "犬の色覚を近似した見え方です（実際の犬の視覚とは異なります）";
}

// 赤・緑の色差を縮め、青系と黄系の違いを残す二色型色覚の近似行列。
// 色の計算は表示用RGB値に適用する簡易モデルで、犬の視覚そのものではありません。
function transformDogColors(pixels) {
  for (let i = 0; i < pixels.length; i += 4) {
    const red = pixels[i];
    const green = pixels[i + 1];
    const blue = pixels[i + 2];

    pixels[i] = 0.625 * red + 0.375 * green;
    pixels[i + 1] = 0.70 * red + 0.30 * green;
    pixels[i + 2] = 0.30 * green + 0.70 * blue;
  }
}

function resizeProcessingCanvas() {
  const sourceWidth = cameraFeed.videoWidth;
  const sourceHeight = cameraFeed.videoHeight;
  if (!sourceWidth || !sourceHeight) return false;

  const scale = Math.min(1, MAX_PROCESSING_SIZE / Math.max(sourceWidth, sourceHeight));
  const width = Math.max(1, Math.round(sourceWidth * scale));
  const height = Math.max(1, Math.round(sourceHeight * scale));

  if (width !== processingWidth || height !== processingHeight) {
    processingWidth = width;
    processingHeight = height;
    dogView.width = width;
    dogView.height = height;
  }

  return true;
}

function renderFrame() {
  animationFrameId = null;
  if (!cameraStream) return;

  if (currentMode === "dog" && cameraFeed.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA && resizeProcessingCanvas()) {
    dogContext.drawImage(cameraFeed, 0, 0, processingWidth, processingHeight);
    const frame = dogContext.getImageData(0, 0, processingWidth, processingHeight);
    transformDogColors(frame.data);
    dogContext.putImageData(frame, 0, 0);
  }

  animationFrameId = window.requestAnimationFrame(renderFrame);
}

function startRenderLoop() {
  if (animationFrameId === null) {
    animationFrameId = window.requestAnimationFrame(renderFrame);
  }
}

function stopCamera() {
  if (animationFrameId !== null) {
    window.cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }

  if (cameraStream) {
    cameraStream.getTracks().forEach((track) => track.stop());
    cameraStream = null;
  }

  cameraFeed.srcObject = null;
  dogView.style.filter = "none";
  dogContext.clearRect(0, 0, dogView.width, dogView.height);
  dogView.width = 0;
  dogView.height = 0;
  processingWidth = 0;
  processingHeight = 0;
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
