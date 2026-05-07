import asyncio
import random

class SignLanguageModel:
    """Заглушка ML модели для распознавания жестов."""
    def __init__(self):
        self.vocab = ["Привет", "Спасибо", "Пожалуйста", "Извините", "А", "Б", "В", "Г", "Д", "Пока"]

    async def predict(self, frame_data: bytes) -> dict:
        # Имитация задержки нейросети (inference time)
        await asyncio.sleep(0.05)
        
        # Проверка кадра: если пустой или битый
        if not frame_data or len(frame_data) < 10:
             return {"status": "error", "prediction": None, "confidence": 0.0}

        # Имитация успешного распознавания
        gesture = random.choice(self.vocab)
        confidence = round(random.uniform(0.75, 0.99), 2)

        return {
            "status": "success", 
            "prediction": gesture, 
            "confidence": confidence
        }

# Экземпляр модели (Singleton)
ml_model = SignLanguageModel()
