import os
from typing import List

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from supabase import create_client, Client

from bm25_scorer import (
    build_profile_documents,
    score_job_against_profile,
)

from embedding_scorer import (
    score_semantic_similarity,
)


load_dotenv()

SUPABASE_URL = os.getenv(
    "SUPABASE_URL"
)

SUPABASE_KEY = os.getenv(
    "SUPABASE_KEY"
)


if not SUPABASE_URL:
    raise RuntimeError(
        "SUPABASE_URL is missing."
    )

if not SUPABASE_KEY:
    raise RuntimeError(
        "SUPABASE_KEY is missing."
    )


supabase: Client = create_client(
    SUPABASE_URL,
    SUPABASE_KEY,
)


app = FastAPI(
    title=
        "Career Intelligence ML Service",

    version=
        "0.4.0",
)


class JobScoreRequest(BaseModel):
    job_id: str


@app.get("/")
def root():
    return {
        "service":
            "Career Intelligence ML Service",

        "status":
            "running",

        "version":
            "0.4.0",
    }


@app.get("/health")
def health():
    return {
        "status":
            "healthy",
    }


def fetch_latest_profile():
    """
    Fetch the latest profile
    directly from Supabase.
    """

    try:
        response = (
            supabase
            .table(
                "profiles"
            )
            .select(
                "profile_data, updated_at"
            )
            .order(
                "updated_at",
                desc=True
            )
            .limit(1)
            .execute()
        )

        if not response.data:
            raise HTTPException(
                status_code=404,
                detail=
                    "No profile found in Supabase.",
            )

        profile_row = (
            response.data[0]
        )

        profile_data = (
            profile_row.get(
                "profile_data"
            )
        )

        if not profile_data:
            raise HTTPException(
                status_code=404,
                detail=
                    "Profile exists but profile_data is empty.",
            )

        return {
            "profile_data":
                profile_data,

            "updated_at":
                profile_row.get(
                    "updated_at"
                ),
        }

    except HTTPException:
        raise

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=
                f"Could not load profile from Supabase: {exc}",
        )


def fetch_job(
    job_id: str
):
    """
    Fetch the saved job
    directly from Supabase.
    """

    try:
        response = (
            supabase
            .table(
                "jobs"
            )
            .select(
                """
                id,
                title,
                company,
                location,
                summary,
                seniority,
                employment_type,
                is_contract,
                contract_length,
                years_experience,
                raw_job_description,
                source,
                job_url,
                created_at
                """
            )
            .eq(
                "id",
                job_id
            )
            .limit(1)
            .execute()
        )

        if not response.data:
            raise HTTPException(
                status_code=404,
                detail=
                    "Job not found.",
            )

        return (
            response.data[0]
        )

    except HTTPException:
        raise

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=
                f"Could not load job from Supabase: {exc}",
        )


def fetch_job_keywords(
    job_id: str
) -> List[str]:
    """
    Fetch extracted keywords for
    the selected job.
    """

    try:
        response = (
            supabase
            .table(
                "job_keywords"
            )
            .select(
                "keyword"
            )
            .eq(
                "job_id",
                job_id
            )
            .execute()
        )

        keywords = [
            row.get(
                "keyword",
                ""
            ).strip()

            for row in (
                response.data
                or []
            )

            if row.get(
                "keyword"
            )
        ]

        keywords = list(
            dict.fromkeys(
                keywords
            )
        )

        if not keywords:
            raise HTTPException(
                status_code=404,
                detail=
                    "No keywords found for this job.",
            )

        return keywords

    except HTTPException:
        raise

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=
                f"Could not load job keywords from Supabase: {exc}",
        )


@app.get(
    "/profile/debug"
)
def profile_debug():
    """
    Development endpoint to verify
    the Supabase profile connection.
    """

    profile = (
        fetch_latest_profile()
    )

    documents = (
        build_profile_documents(
            profile[
                "profile_data"
            ]
        )
    )

    return {
        "updated_at":
            profile[
                "updated_at"
            ],

        "document_count":
            len(
                documents
            ),

        "profile_documents":
            documents,
    }


@app.post("/score/job")
def score_job(request: JobScoreRequest):
    try:
        job = fetch_job(
            request.job_id
        )

        job_keywords = fetch_job_keywords(
            request.job_id
        )

        profile = fetch_latest_profile()

        profile_documents = build_profile_documents(
            profile["profile_data"]
        )

        bm25_result = score_job_against_profile(
            job_keywords=job_keywords,
            profile_documents=profile_documents,
        )

        semantic_result = score_semantic_similarity(
            job=job,
            job_keywords=job_keywords,
            profile_documents=profile_documents,
        )

        return {
            "job": {
                "id": job.get("id"),
                "title": job.get("title"),
                "company": job.get("company"),
            },

            "profile_updated_at":
                profile["updated_at"],

            "job_keywords":
                job_keywords,

            "bm25":
                bm25_result,

            "semantic":
                semantic_result,
        }

    except HTTPException:
        raise

    except ValueError as exc:
        raise HTTPException(
            status_code=400,
            detail=str(exc),
        )

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Job scoring failed: {exc}",
        )


@app.post(
    "/score/bm25"
)
def score_bm25_legacy(
    request:
        JobScoreRequest
):
    """
    Keep the previous endpoint
    working while we transition
    to /score/job.
    """

    try:
        job = fetch_job(
            request.job_id
        )

        job_keywords = (
            fetch_job_keywords(
                request.job_id
            )
        )

        profile = (
            fetch_latest_profile()
        )

        profile_documents = (
            build_profile_documents(
                profile[
                    "profile_data"
                ]
            )
        )

        result = (
            score_job_against_profile(
                job_keywords=
                    job_keywords,

                profile_documents=
                    profile_documents,
            )
        )

        return {
            "algorithm":
                "BM25Okapi",

            "job": {
                "id":
                    job.get(
                        "id"
                    ),

                "title":
                    job.get(
                        "title"
                    ),

                "company":
                    job.get(
                        "company"
                    ),
            },

            "job_keywords":
                job_keywords,

            "profile_updated_at":
                profile[
                    "updated_at"
                ],

            "profile_document_count":
                len(
                    profile_documents
                ),

            **result,
        }

    except HTTPException:
        raise

    except ValueError as exc:
        raise HTTPException(
            status_code=400,
            detail=
                str(exc),
        )

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=
                f"BM25 scoring failed: {exc}",
        )