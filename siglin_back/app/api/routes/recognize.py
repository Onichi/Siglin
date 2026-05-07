from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from fastapi.concurrency import run_in_threadpool
import json
import base64
import numpy as np
import cv2

from app.services.ml_model import SignLanguagePredictor

router = APIRouter()

class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def send_personal_message(self, message: dict, websocket: WebSocket):
        await websocket.send_json(message)

manager = ConnectionManager()

@router.websocket("/stream")
async def recognize_stream(websocket: WebSocket):
    await manager.connect(websocket)

    # Инициализация модели может занять пару секунд, лучше сделать это до цикла
    predictor = SignLanguagePredictor()
    print("✅ WebSocket подключен, модель Siglin загружена.")

    try:
        while True:
            data = await websocket.receive_text()

            try:
                json_data = json.loads(data)
                frame_b64 = json_data.get("image", "")
            except json.JSONDecodeError:
                frame_b64 = data

            try:
                if "," in frame_b64:
                    frame_b64 = frame_b64.split(",", 1)[1]

                frame_bytes = base64.b64decode(frame_b64)
                np_arr = np.frombuffer(frame_bytes, np.uint8)
                img = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)

                if img is None:
                    continue

                # 🔥 ГЛАВНЫЙ ФИКС АСИНХРОННОСТИ: Выполняем инференс в отдельном пуле потоков!
                result = await run_in_threadpool(predictor.process_frame, img)

                # Если жест успешно распознан (или идет обработка)
                if result["status"] == "success":
                    await manager.send_personal_message(result, websocket)

            except Exception as e:
                await manager.send_personal_message(
                    {"status": "error", "message": f"Ошибка обработки кадра: {str(e)}"},
                    websocket
                )
                continue

    except WebSocketDisconnect:
        manager.disconnect(websocket)
    finally:
        predictor.close()
        print("❌ WebSocket отключен, ресурсы модели очищены.")