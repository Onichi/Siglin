import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.staticfiles import StaticFiles

from app.api.routes import auth, users, gestures, lessons, recognize

app = FastAPI(title="Siglink API")


app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173",
                   "http://127.0.0.1:5173", # Порты твоего Vite
                   "https://siglin.ru",
                   "https://www.siglin.ru"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

os.makedirs("static/media", exist_ok=True)
os.makedirs("static/avatars", exist_ok=True)
os.makedirs("static/lessons", exist_ok=True)
app.mount("/static", StaticFiles(directory="static"), name="static")

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(lessons.router, prefix="/api/lessons", tags=["lessons"])
app.include_router(gestures.router, prefix="/api/gestures", tags=["Жесты (admin/catalog)"])
app.include_router(recognize.router, prefix="/api/recognize", tags=["Распознавание"])
@app.get("/")
async def root():
    return {"message": "Hello World"}