import cv2
import torch
import torch.nn as nn
import json
import numpy as np
import pandas as pd
import mediapipe as mp
from collections import deque, Counter
import warnings

warnings.filterwarnings("ignore", category=UserWarning)


# --- АРХИТЕКТУРА МОДЕЛИ ---
class SignLanguageCNNBiLSTM(nn.Module):
    def __init__(self, input_size=450, cnn_hidden=128, lstm_hidden=128, num_layers=1, num_classes=62):
        super(SignLanguageCNNBiLSTM, self).__init__()
        self.conv1d = nn.Conv1d(in_channels=input_size, out_channels=cnn_hidden, kernel_size=3, padding=1)
        self.bn_conv = nn.BatchNorm1d(cnn_hidden)
        self.relu_conv = nn.ReLU()
        lstm_dropout = 0.0 if num_layers == 1 else 0.4
        self.lstm = nn.LSTM(cnn_hidden, lstm_hidden, num_layers, batch_first=True, dropout=lstm_dropout,
                            bidirectional=True)
        self.batch_norm = nn.BatchNorm1d(lstm_hidden * 2)
        self.fc1 = nn.Linear(lstm_hidden * 2, 128)
        self.relu = nn.ReLU()
        self.dropout = nn.Dropout(0.4)
        self.fc2 = nn.Linear(128, num_classes)

    def forward(self, x):
        x = x.permute(0, 2, 1)
        x = self.conv1d(x)
        x = self.bn_conv(x)
        x = self.relu_conv(x)
        x = x.permute(0, 2, 1)
        out, _ = self.lstm(x)
        out = torch.mean(out, dim=1)
        out = self.batch_norm(out)
        out = self.fc1(out)
        out = self.relu(out)
        out = self.dropout(out)
        out = self.fc2(out)
        return out


# --- КЛАСС ДЛЯ ОБРАБОТКИ В РЕАЛЬНОМ ВРЕМЕНИ ---
class SignLanguagePredictor:
    def __init__(self):
        self.MODEL_PATH = 'rsl_bilstm_best.pth'
        self.LABEL_MAP_PATH = 'label_map.json'
        self.MAX_SEQ_LENGTH = 92
        self.CONFIDENCE_THRESHOLD = 0.5
        self.PREDICT_EVERY_N_FRAMES = 3

        self.device = torch.device('cpu')

        with open(self.LABEL_MAP_PATH, 'r', encoding='utf-8') as f:
            self.label_map = json.load(f)
        self.idx_to_class = {v: k for k, v in self.label_map.items()}
        self.num_classes = len(self.label_map)

        self.model = SignLanguageCNNBiLSTM(input_size=450, num_classes=self.num_classes).to(self.device)
        self.model.load_state_dict(torch.load(self.MODEL_PATH, map_location=self.device))
        self.model.eval()

        self.mp_holistic = mp.solutions.holistic

        # 🔥 ГЛАВНЫЙ БУСТ FPS: model_complexity=0 заставляет MediaPipe работать в легком режиме
        self.holistic = self.mp_holistic.Holistic(
            min_detection_confidence=0.5,
            min_tracking_confidence=0.5,
            model_complexity=0
        )

        self.frames_buffer = deque(maxlen=self.MAX_SEQ_LENGTH)
        self.predictions_queue = deque(maxlen=10)
        self.frame_counter = 0

        # Переменные для вывода на экран
        self.current_gesture = "---"
        self.current_confidence = 0.0

    def close(self):
        self.holistic.close()

    # Быстрый перевод русских букв в латиницу для OpenCV
    def translit(self, text):
        mapping = {'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo', 'ж': 'zh', 'з': 'z', 'и': 'i',
                   'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't',
                   'у': 'u', 'ф': 'f', 'х': 'h', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'sch', 'ъ': '', 'ы': 'y',
                   'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya',
                   'А': 'A', 'Б': 'B', 'В': 'V', 'Г': 'G', 'Д': 'D', 'Е': 'E', 'Ё': 'Yo', 'Ж': 'Zh', 'З': 'Z', 'И': 'I',
                   'Й': 'Y', 'К': 'K', 'Л': 'L', 'М': 'M', 'Н': 'N', 'О': 'O', 'П': 'P', 'Р': 'R', 'С': 'S', 'Т': 'T',
                   'У': 'U', 'Ф': 'F', 'Х': 'H', 'Ц': 'Ts', 'Ч': 'Ch', 'Ш': 'Sh', 'Щ': 'Sch', 'Ъ': '', 'Ы': 'Y',
                   'Ь': '', 'Э': 'E', 'Ю': 'Yu', 'Я': 'Ya'}
        return ''.join(mapping.get(c, c) for c in text)

    def extract_keypoints(self, results):
        lh = np.array([[res.x, res.y, res.z] for res in
                       results.left_hand_landmarks.landmark]).flatten() if results.left_hand_landmarks else np.full(63,
                                                                                                                    np.nan)
        rh = np.array([[res.x, res.y, res.z] for res in
                       results.right_hand_landmarks.landmark]).flatten() if results.right_hand_landmarks else np.full(
            63, np.nan)
        pose = np.array([[res.x, res.y, res.z] for res in
                         results.pose_landmarks.landmark]).flatten() if results.pose_landmarks else np.full(99, np.nan)
        return np.concatenate([lh, rh, pose])

    def interpolate_and_normalize(self, landmarks):
        landmarks = np.array(landmarks, dtype=np.float32)
        df = pd.DataFrame(landmarks)
        df = df.interpolate(method='linear', limit_direction='both').fillna(0)
        landmarks = df.to_numpy()

        for i in range(len(landmarks)):
            frame = landmarks[i]
            missing_mask = (frame == 0.0)
            pose = frame[126:]
            nose = pose[0:3]
            l_shoulder = pose[33:36]
            r_shoulder = pose[36:39]

            dist = np.linalg.norm(l_shoulder - r_shoulder)
            if dist < 0.0001: dist = 1.0

            reshaped = frame.reshape(-1, 3)
            reshaped = (reshaped - nose) / dist
            normalized_frame = reshaped.flatten()
            normalized_frame[missing_mask] = 0.0
            landmarks[i] = normalized_frame

        return landmarks

    def process_frame(self, image_np):
        self.frame_counter += 1

        # 1. ОБРАБОТКА MEDIAPIPE
        image_rgb = cv2.cvtColor(image_np, cv2.COLOR_BGR2RGB)
        image_rgb.flags.writeable = False
        results = self.holistic.process(image_rgb)

        raw_keypoints = self.extract_keypoints(results)
        self.frames_buffer.append(raw_keypoints)

        # 2. ПРЕДСКАЗАНИЕ НЕЙРОСЕТИ
        if len(self.frames_buffer) > 0 and self.frame_counter % self.PREDICT_EVERY_N_FRAMES == 0:
            current_frames = list(self.frames_buffer)

            if len(current_frames) < self.MAX_SEQ_LENGTH:
                pad_size = self.MAX_SEQ_LENGTH - len(current_frames)
                padded_sequence = [current_frames[0]] * pad_size + current_frames
            else:
                padded_sequence = current_frames

            processed_features = self.interpolate_and_normalize(padded_sequence)
            velocities = processed_features[1:] - processed_features[:-1]
            zeros = np.zeros((1, 225), dtype=np.float32)
            velocities = np.vstack([zeros, velocities])

            combined_features = np.concatenate([processed_features, velocities], axis=1)
            tensor_data = torch.FloatTensor(combined_features).unsqueeze(0).to(self.device)

            with torch.no_grad():
                outputs = self.model(tensor_data)
                probs = torch.softmax(outputs, dim=1)
                conf, predicted_idx = torch.max(probs, 1)

            conf = conf.item()
            pred_word = self.idx_to_class[predicted_idx.item()]

            if conf > self.CONFIDENCE_THRESHOLD:
                self.predictions_queue.append(pred_word)
            else:
                self.predictions_queue.append("no_event")

            # Обновляем состояние для UI и ответа
            if len(self.predictions_queue) > 0:
                most_common_word, word_count = Counter(self.predictions_queue).most_common(1)[0]
                if most_common_word != 'no_event' and word_count >= 4:
                    self.current_gesture = most_common_word
                    self.current_confidence = conf
                else:
                    self.current_gesture = "---"
                    self.current_confidence = conf

        # 3. ОТРИСОВКА ДЕБАГ-ОКНА СО СКЕЛЕТОМ И ТЕКСТОМ
        # mp_drawing = mp.solutions.drawing_utils
        # annotated_image = image_np.copy()
        #
        # mp_drawing.draw_landmarks(annotated_image, results.pose_landmarks, self.mp_holistic.POSE_CONNECTIONS)
        # mp_drawing.draw_landmarks(annotated_image, results.left_hand_landmarks, self.mp_holistic.HAND_CONNECTIONS)
        # mp_drawing.draw_landmarks(annotated_image, results.right_hand_landmarks, self.mp_holistic.HAND_CONNECTIONS)
        #
        # # Печатаем транслитерированный текст на кадре
        # display_text = f"Pred: {self.translit(self.current_gesture)} ({self.current_confidence:.2f})"
        #
        # # Рисуем черную обводку для читаемости на любом фоне
        # cv2.putText(annotated_image, display_text, (20, 50), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 0), 4, cv2.LINE_AA)
        # cv2.putText(annotated_image, display_text, (20, 50), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2, cv2.LINE_AA
        # cv2.imshow("Siglin - Realtime Debug", annotated_image)
        # cv2.waitKey(1)

        # 4. ВОЗВРАТ РЕЗУЛЬТАТА В РОУТЕР
        return {
            "status": "success",
            "gesture": self.current_gesture,
            "confidence": self.current_confidence
        }