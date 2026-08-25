from typing import List, Dict, Any
import re

import numpy as np
from rank_bm25 import BM25Okapi


def tokenize(text: str) -> List[str]:
    """
    Basic tokenizer for BM25.

    We will improve this later with:
    - stop-word removal
    - stemming / lemmatization
    - skill canonicalization
    - phrase handling
    """

    if not text:
        return []

    text = text.lower()

    tokens = re.findall(
        r"[a-z0-9+#.]+",
        text
    )

    return tokens


def min_max_normalize(
    scores: List[float]
) -> List[float]:
    """
    Normalize BM25 scores to 0-100.

    This is useful for the current implementation,
    but later we should replace it with a more
    stable calibrated scoring method.
    """

    if not scores:
        return []

    min_score = min(scores)
    max_score = max(scores)

    if max_score == min_score:
        return [
            100.0
            if max_score > 0
            else 0.0
            for _ in scores
        ]

    return [
        (
            (score - min_score)
            / (max_score - min_score)
        )
        * 100
        for score in scores
    ]


def flatten_profile_value(
    value: Any
) -> List[str]:
    """
    Recursively extract text from
    the profile_data JSONB object.
    """

    documents: List[str] = []

    if value is None:
        return documents

    if isinstance(
        value,
        str
    ):
        cleaned = value.strip()

        if cleaned:
            documents.append(
                cleaned
            )

        return documents

    if isinstance(
        value,
        (
            int,
            float,
            bool,
        )
    ):
        return documents

    if isinstance(
        value,
        list
    ):
        text_items = []

        for item in value:
            if isinstance(
                item,
                str
            ):
                cleaned = (
                    item.strip()
                )

                if cleaned:
                    text_items.append(
                        cleaned
                    )

            else:
                documents.extend(
                    flatten_profile_value(
                        item
                    )
                )

        if text_items:
            documents.append(
                " ".join(
                    text_items
                )
            )

        return documents

    if isinstance(
        value,
        dict
    ):
        for item in value.values():
            documents.extend(
                flatten_profile_value(
                    item
                )
            )

        return documents

    return documents


def build_profile_documents(
    profile_data: Dict[str, Any]
) -> List[str]:
    """
    Convert profile_data JSON into
    multiple BM25 documents.

    Each top-level profile section becomes
    a document where possible.
    """

    if not profile_data:
        raise ValueError(
            "Profile data is empty."
        )

    documents: List[str] = []

    for _, section_value in profile_data.items():
        section_documents = (
            flatten_profile_value(
                section_value
            )
        )

        if not section_documents:
            continue

        section_text = " ".join(
            section_documents
        ).strip()

        if section_text:
            documents.append(
                section_text
            )

    if not documents:
        raise ValueError(
            "Could not create profile documents from profile_data."
        )

    return documents


def score_job_against_profile(
    job_keywords: List[str],
    profile_documents: List[str],
) -> Dict[str, Any]:
    """
    Compare job keywords against
    profile sections using BM25.
    """

    cleaned_keywords = [
        keyword.strip()
        for keyword in job_keywords
        if keyword
        and keyword.strip()
    ]

    if not cleaned_keywords:
        raise ValueError(
            "job_keywords cannot be empty"
        )

    if not profile_documents:
        raise ValueError(
            "profile_documents cannot be empty"
        )

    tokenized_documents = [
        tokenize(
            document
        )
        for document in profile_documents
    ]

    tokenized_documents = [
        document
        for document in tokenized_documents
        if document
    ]

    if not tokenized_documents:
        raise ValueError(
            "Profile contained no usable text."
        )

    bm25 = BM25Okapi(
        tokenized_documents
    )

    query_text = " ".join(
        cleaned_keywords
    )

    tokenized_query = tokenize(
        query_text
    )

    raw_scores = bm25.get_scores(
        tokenized_query
    )

    raw_scores_list = [
        float(score)
        for score in raw_scores
    ]

    normalized_scores = (
        min_max_normalize(
            raw_scores_list
        )
    )

    best_index = int(
        np.argmax(
            raw_scores_list
        )
    )

    profile_tokens = set(
        token
        for document
        in tokenized_documents
        for token
        in document
    )

    matched_terms: List[str] = []
    missing_terms: List[str] = []

    for keyword in cleaned_keywords:
        keyword_tokens = tokenize(
            keyword
        )

        if (
            keyword_tokens
            and all(
                token
                in profile_tokens
                for token
                in keyword_tokens
            )
        ):
            matched_terms.append(
                keyword
            )
        else:
            missing_terms.append(
                keyword
            )

    best_raw_score = (
        raw_scores_list[
            best_index
        ]
    )

    best_normalized_score = (
        normalized_scores[
            best_index
        ]
    )

    average_normalized_score = (
        float(
            np.mean(
                normalized_scores
            )
        )
        if normalized_scores
        else 0.0
    )

    return {
        "bm25_raw_scores": [
            round(
                score,
                4
            )
            for score in raw_scores_list
        ],

        "bm25_normalized_scores": [
            round(
                score,
                2
            )
            for score in normalized_scores
        ],

        "best_profile_section_index":
            best_index,

        "best_raw_score":
            round(
                best_raw_score,
                4
            ),

        "best_normalized_score":
            round(
                best_normalized_score,
                2
            ),

        "average_normalized_score":
            round(
                average_normalized_score,
                2
            ),

        "matched_terms":
            matched_terms,

        "missing_terms":
            missing_terms,

        "matched_term_count":
            len(
                matched_terms
            ),

        "missing_term_count":
            len(
                missing_terms
            ),

        "total_job_terms":
            len(
                cleaned_keywords
            ),
    }