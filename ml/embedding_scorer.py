from typing import Dict, Any, List

from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity


MODEL_NAME = "all-MiniLM-L6-v2"

model = SentenceTransformer(
    MODEL_NAME
)


def build_profile_text(
    profile_documents: List[str]
) -> str:
    return " ".join(
        document.strip()
        for document in profile_documents
        if document
        and document.strip()
    )


def build_job_text(
    job: Dict[str, Any],
    job_keywords: List[str]
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

    embeddings = model.encode(
        [
            job_text,
            profile_text,
        ],
        normalize_embeddings=True,
    )

    similarity = cosine_similarity(
        [embeddings[0]],
        [embeddings[1]],
    )[0][0]

    semantic_score = (
        float(similarity)
        * 100
    )

    return {
        "embedding_model":
            MODEL_NAME,

        "cosine_similarity":
            round(
                float(similarity),
                4
            ),

        "semantic_match_score":
            round(
                semantic_score,
                2
            ),
    }