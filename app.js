const startButton = document.querySelector("#start-button");
const startPanel = document.querySelector("#start-panel");
const notice = document.querySelector("#notice");
const cameraFeeds = document.querySelectorAll(".camera-feed");

async function startCamera() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    notice.textContent = "このブラウザーではカメラを利用できません。HTTPSで開いているか確認してください。";
    return;
  }

  startButton.disabled = true;
  notice.textContent = "カメラへのアクセスを確認しています…";

  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: {
        facingMode: { ideal: "environment" }
      }
    });

    cameraFeeds.forEach((video) => {
      video.srcObject = stream;
    });
    startPanel.hidden = true;
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

startButton.addEventListener("click", startCamera);
