import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import Dataset, DataLoader
import numpy as np
import time
from tqdm import tqdm
import json
import os

# ==========================================
# ⚙️ НАСТРОЙКИ (Гиперпараметры)
# ==========================================
TRAIN_DATA_PATH = 'train_data.pt'
TEST_DATA_PATH = 'test_data.pt'
LABEL_MAP_PATH = 'label_map.json'
MODEL_SAVE_PATH = 'rsl_bilstm_best.pth'

BATCH_SIZE = 32
MAX_EPOCHS = 200
PATIENCE = 30  # Эпох без улучшений до остановки
LEARNING_RATE = 0.001


# ==========================================
# 1. ДАТАСЕТ И АУГМЕНТАЦИЯ
# ==========================================
class GestureDataset(Dataset):
    def __init__(self, pt_file_path, is_train=False):
        data = torch.load(pt_file_path)
        self.X = data['X']  # Ожидаемый размер: [N, 92, 225]
        self.y = data['y']  # Ожидаемый размер: [N]
        self.is_train = is_train

    def __len__(self):
        return len(self.X)

    def augment_data(self, features):
        if not self.is_train:
            return features

        features = features.clone()

        # 1. Горизонтальное отражение (50%)
        if torch.rand(1).item() > 0.5:
            features[:, 0::3] = -features[:, 0::3]
            left_hand = features[:, 0:63].clone()
            right_hand = features[:, 63:126].clone()
            features[:, 0:63] = right_hand
            features[:, 63:126] = left_hand

        # 2. Шум (50%)
        if torch.rand(1).item() > 0.5:
            noise = torch.randn_like(features) * 0.015
            features = features + noise

        # 3. Масштабирование (50%)
        if torch.rand(1).item() > 0.5:
            scale = 0.85 + (torch.rand(1).item() * 0.3)
            features = features * scale

        # 4. НОВОЕ: Временной сдвиг (Temporal Shift)
        # С вероятностью 50% сдвигаем жест на 1-5 кадров вперед или назад
        if torch.rand(1).item() > 0.5:
            shift = torch.randint(-5, 6, (1,)).item()  # Случайное число от -5 до +5
            if shift != 0:
                # Сдвигаем кадры
                features = torch.roll(features, shifts=shift, dims=0)
                # Если сдвинули, то края заполняем нулями (чтобы избежать зацикливания)
                if shift > 0:
                    features[:shift, :] = 0.0
                else:
                    features[shift:, :] = 0.0

        return features

    def __getitem__(self, idx):
        features = self.X[idx]
        labels = self.y[idx]

        # 1. Применяем вашу аугментацию
        features = self.augment_data(features)

        # 2. ВЫЧИСЛЯЕМ ВЕКТОРЫ СКОРОСТИ (разница между кадрами)
        # features shape: [92, 225]
        # Вычитаем из каждого кадра (начиная со второго) предыдущий кадр
        velocities = features[1:] - features[:-1]

        # Чтобы длина последовательности осталась 92, добавляем строку нулей для первого кадра
        zeros = torch.zeros(1, features.shape[1], dtype=features.dtype)
        velocities = torch.cat([zeros, velocities], dim=0)  # shape: [92, 225]

        # 3. СКЛЕИВАЕМ координаты и скорости
        # Теперь у нас 225 (координаты) + 225 (скорости) = 450 признаков на каждый кадр!
        combined_features = torch.cat([features, velocities], dim=1)  # shape: [92, 450]

        return combined_features, labels


# ==========================================
# 2. АРХИТЕКТУРА Bi-LSTM
# ==========================================
class SignLanguageCNNBiLSTM(nn.Module):
    def __init__(self, input_size=225, cnn_hidden=128, lstm_hidden=128, num_layers=1, num_classes=62):
        super(SignLanguageCNNBiLSTM, self).__init__()

        # --- 1. Пространственный блок (1D Свертка) ---
        # in_channels = 225 (наши X, Y, Z координаты), out_channels = 128 (новые признаки)
        # kernel_size=3 означает, что мы смотрим на 3 кадра одновременно
        self.conv1d = nn.Conv1d(in_channels=input_size, out_channels=cnn_hidden, kernel_size=3, padding=1)
        self.bn_conv = nn.BatchNorm1d(cnn_hidden)
        self.relu_conv = nn.ReLU()

        # --- 2. Временной блок (Bi-LSTM) ---
        # Входной размер для LSTM теперь равен выходу из свертки (cnn_hidden)
        # Dropout внутри LSTM нужен только если num_layers > 1, иначе ставим 0
        lstm_dropout = 0.0 if num_layers == 1 else 0.4
        self.lstm = nn.LSTM(cnn_hidden, lstm_hidden, num_layers,
                            batch_first=True, dropout=lstm_dropout, bidirectional=True)

        self.batch_norm = nn.BatchNorm1d(lstm_hidden * 2)

        # --- 3. Блок классификации ---
        self.fc1 = nn.Linear(lstm_hidden * 2, 128)
        self.relu = nn.ReLU()
        self.dropout = nn.Dropout(0.4)
        self.fc2 = nn.Linear(128, num_classes)

    def forward(self, x):
        # Исходный shape: [batch_size, seq_len, features] -> [32, 92, 225]

        # Для Conv1d меняем размерности местами
        x = x.permute(0, 2, 1)  # Теперь shape: [32, 225, 92]

        # Пропускаем через CNN
        x = self.conv1d(x)
        x = self.bn_conv(x)
        x = self.relu_conv(x)  # shape: [32, 128, 92]

        # Возвращаем размерности обратно для LSTM
        x = x.permute(0, 2, 1)  # Теперь shape: [32, 92, 128]

        # Пропускаем через LSTM
        out, _ = self.lstm(x)

        # Mean Pooling: усредняем по времени (seq_len находится на dim=1)
        out = torch.mean(out, dim=1)

        # Пропускаем через полносвязные слои
        out = self.batch_norm(out)
        out = self.fc1(out)
        out = self.relu(out)
        out = self.dropout(out)
        out = self.fc2(out)

        return out


# ==========================================
# 3. ВСПОМОГАТЕЛЬНЫЕ КЛАССЫ И ФУНКЦИИ
# ==========================================
class EarlyStopping:
    def __init__(self, patience=15, verbose=True, path=MODEL_SAVE_PATH):
        self.patience = patience
        self.verbose = verbose
        self.counter = 0
        self.best_score = None
        self.early_stop = False
        self.val_loss_min = np.inf
        self.path = path

    def __call__(self, val_loss, model):
        score = -val_loss
        if self.best_score is None:
            self.best_score = score
            self.save_checkpoint(val_loss, model)
        elif score < self.best_score:
            self.counter += 1
            if self.verbose:
                print(f'EarlyStopping счетчик: {self.counter} из {self.patience}')
            if self.counter >= self.patience:
                self.early_stop = True
        else:
            self.best_score = score
            self.save_checkpoint(val_loss, model)
            self.counter = 0

    def save_checkpoint(self, val_loss, model):
        if self.verbose:
            print(f'Validation Loss уменьшился ({self.val_loss_min:.6f} --> {val_loss:.6f}). Веса сохранены!')
        torch.save(model.state_dict(), self.path)
        self.val_loss_min = val_loss


def calculate_class_weights(y_train, num_classes):
    """Вычисляет веса для балансировки перекосов в количестве видео"""
    counts = np.bincount(y_train.numpy(), minlength=num_classes)
    weights = 1.0 / np.where(counts == 0, 1, counts)
    weights = weights / weights.sum() * num_classes
    return torch.FloatTensor(weights)


# ==========================================
# 4. ГЛАВНЫЙ ЦИКЛ ОБУЧЕНИЯ
# ==========================================
if __name__ == "__main__":
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    print(f"🔥 Инициализация на устройстве: {device}")

    if device.type == 'cuda':
        torch.backends.cudnn.benchmark = True

    # Загрузка количества классов динамически из словаря
    if not os.path.exists(LABEL_MAP_PATH):
        print(f"Ошибка: Не найден файл {LABEL_MAP_PATH}. Сначала запустите скрипт подготовки данных.")
        exit(1)

    with open(LABEL_MAP_PATH, 'r', encoding='utf-8') as f:
        label_map = json.load(f)
    num_classes = len(label_map)
    print(f"Обнаружено классов для обучения: {num_classes}")

    # Загрузка данных
    train_dataset = GestureDataset(TRAIN_DATA_PATH, is_train=True)
    test_dataset = GestureDataset(TEST_DATA_PATH, is_train=False)

    train_loader = DataLoader(train_dataset, batch_size=BATCH_SIZE, shuffle=True, pin_memory=True)
    test_loader = DataLoader(test_dataset, batch_size=BATCH_SIZE, shuffle=False, pin_memory=True)

    # Веса для Loss-функции (защита от мажоритарных классов)
    class_weights = calculate_class_weights(train_dataset.y, num_classes).to(device)

    # Инициализация ИИ
    model = SignLanguageCNNBiLSTM(input_size=450, num_classes=num_classes).to(device)
    criterion = nn.CrossEntropyLoss(weight=class_weights)
    optimizer = optim.AdamW(model.parameters(), lr=LEARNING_RATE, weight_decay=1e-2)

    # Снижает LR на плато
    scheduler = optim.lr_scheduler.ReduceLROnPlateau(optimizer, mode='min', factor=0.5, patience=10, min_lr=1e-6)
    early_stopping = EarlyStopping(patience=PATIENCE, verbose=True)

    # Для ускорения вычислений в полуточной математике
    scaler = torch.amp.GradScaler('cuda')

    print("\n🚀 Начинаем обучение...")
    for epoch in range(MAX_EPOCHS):
        start_time = time.time()

        # --- ФАЗА ОБУЧЕНИЯ (TRAIN) ---
        model.train()
        train_loss = 0.0
        train_correct = 0
        train_total = 0

        train_loop = tqdm(train_loader, desc=f"Эпоха [{epoch + 1}/{MAX_EPOCHS}] Обучение ", leave=False)

        for features, labels in train_loop:
            features, labels = features.to(device), labels.to(device)
            optimizer.zero_grad(set_to_none=True)

            with torch.amp.autocast('cuda'):
                outputs = model(features)
                loss = criterion(outputs, labels)

            scaler.scale(loss).backward()
            scaler.step(optimizer)
            scaler.update()

            train_loss += loss.item() * features.size(0)
            _, predicted = torch.max(outputs.data, 1)
            train_total += labels.size(0)
            train_correct += (predicted == labels).sum().item()

            train_loop.set_postfix(loss=loss.item())

        avg_train_loss = train_loss / train_total
        train_acc = (train_correct / train_total) * 100

        # --- ФАЗА ВАЛИДАЦИИ (TEST) ---
        model.eval()
        val_loss = 0.0
        val_correct = 0
        val_total = 0

        val_loop = tqdm(test_loader, desc=f"Эпоха [{epoch + 1}/{MAX_EPOCHS}] Валидация", leave=False)

        with torch.no_grad():
            for features, labels in val_loop:
                features, labels = features.to(device), labels.to(device)

                with torch.amp.autocast('cuda'):
                    outputs = model(features)
                    loss = criterion(outputs, labels)

                val_loss += loss.item() * features.size(0)
                _, predicted = torch.max(outputs.data, 1)
                val_total += labels.size(0)
                val_correct += (predicted == labels).sum().item()

                val_loop.set_postfix(loss=loss.item())

        avg_val_loss = val_loss / val_total
        val_acc = (val_correct / val_total) * 100

        # --- ИТОГИ ЭПОХИ ---
        time_elapsed = time.time() - start_time
        print(
            f"Эпоха [{epoch + 1}/{MAX_EPOCHS}] завершена за {time_elapsed:.1f}c | Train Acc: {train_acc:.2f}% | Val Acc: {val_acc:.2f}%")

        # Шаг планировщика LR и Early Stopping
        scheduler.step(avg_val_loss)
        early_stopping(avg_val_loss, model)

        if early_stopping.early_stop:
            print("\n🛑 Сработала ранняя остановка! Модель достигла своего максимума.")
            break

        print("-" * 65)

    print(f"🎉 Обучение полностью завершено! Лучшие веса сохранены в {MODEL_SAVE_PATH}.")