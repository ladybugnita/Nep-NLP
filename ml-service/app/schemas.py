"""Pydantic request/response models."""

from __future__ import annotations

from pydantic import BaseModel, Field

class TextRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=20000, examples=["नेपालले खेल जित्यो।"])


class LabelScore(BaseModel):
    label: str
    score: float

class ClassificationResponse(BaseModel):
    label: str
    confidence: float
    scores: list[LabelScore]
    model: str  

class TokenCheck(BaseModel):
    token: str
    is_correct: bool
    suggestions: list[str] = []


class SpellCheckResponse(BaseModel):
    tokens: list[TokenCheck]
    num_errors: int

class TranslationRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=5000)
    source: str = Field("ne", description="'ne' (Nepali) or 'en' (English)")
    target: str = Field("en", description="'ne' (Nepali) or 'en' (English)")


class TranslationResponse(BaseModel):
    translation: str
    source: str
    target: str
    model: str
    available: bool = True
    detail: str | None = None


# --- transliteration (Romanized Nepali -> Devanagari) --------------------------------

class TransliterationResponse(BaseModel):
    input: str
    output: str

class ToolStatus(BaseModel):
    name: str
    tier: str          
    ready: bool
    labels: list[str] | None = None


class InfoResponse(BaseModel):
    service: str
    version: str
    tools: list[ToolStatus]
