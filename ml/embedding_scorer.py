import os
import math
from typing import Dict, Any, List

import requests


OLLAMA_API_URL = "https://ollama.com/api/embed"
OLLAMA_EMBED_MODEL = "nomic-embed-text"


def build_profile_text(
    profile_documents: List[str]
) -> str:
    return " ".join(
        document.strip()
        for document in profile_documents
        if document and document.strip()
    )


def build_job_text(
    job: Dict[str, Any],
    job_keywords: List[str],
) -> str:
    parts = []

    for field in [
        job.get("title"),
        job.get("summary"),
        job.get("raw_job_description"),
        job.get("seniority"),
        job.get("employment_type"),
    ]:
        if field:
            parts.append(
                str(field)
            )

    if job_keywords:
        parts.append(
            " ".join(
                job_keywords
            )
        )

    return " ".join(
        parts
    )


def get_embedding(
    text: str
) -> List[float]:
    api_key = os.getenv(
        "OLLAMA_API_KEY"
    )

    if not api_key:
        raise ValueError(
            "OLLAMA_API_KEY is missing."
        )

    response = requests.post(
        OLLAMA_API_URL,
        headers={
            "Authorization":
                f"Bearer {api_key}",

            "Content-Type":
                "application/json",
        },
        json={
            "model":
                OLLAMA_EMBED_MODEL,

            "input":
                text,
        },
        timeout=60,
    )

    if not response.ok:
        raise ValueError(
            f"Ollama embedding request failed: "
            f"{response.status_code} "
            f"{response.text}"
        )

    data = response.json()

    embeddings = (
        data.get(
            "embeddings"
        )
    )

    if (
        not embeddings
        or not isinstance(
            embeddings,
            list
        )
    ):
        raise ValueError(
            "Ollama returned no embedding."
        )

    return embeddings[0]


def cosine_similarity(
    a: List[float],
    b: List[float],
) -> float:
    if len(a) != len(b):
        raise ValueError(
            "Embedding dimensions do not match."
        )

    dot_product = sum(
        x * y
        for x, y in zip(
            a,
            b
        )
    )

    magnitude_a = math.sqrt(
        sum(
            x * x
            for x in a
        )
    )

    magnitude_b = math.sqrt(
        sum(
            y * y
            for y in b
        )
    )

    if (
        magnitude_a == 0
        or magnitude_b == 0
    ):
        return 0.0

    return (
        dot_product
        / (
            magnitude_a
            * magnitude_b
        )
    )


def score_semantic_similarity(
    job: Dict[str, Any],
    job_keywords: List[str],
    profile_documents: List[str],
):
    job_text = build_job_text(
        job,
        job_keywords,
    )

    profile_text = build_profile_text(
        profile_documents
    )

    if not job_text.strip():
        raise ValueError(
            "Job text is empty."
        )

    if not profile_text.strip():
        raise ValueError(
            "Profile text is empty."
        )

    job_embedding = get_embedding(
        job_text
    )

    profile_embedding = get_embedding(
        profile_text
    )

    similarity = cosine_similarity(
        job_embedding,
        profile_embedding,
    )

    semantic_score = (
        similarity
        * 100
    )

    return {
        "embedding_model":
            OLLAMA_EMBED_MODEL,

        "cosine_similarity":
            round(
                similarity,
                4
            ),

        "semantic_match_score":
            round(
                semantic_score,
                2
            ),
    }