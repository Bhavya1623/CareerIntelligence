import React, {
    useCallback,
    useEffect,
    useState,
} from "react";

import {
    ActivityIndicator,
    Linking,
    RefreshControl,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

import {
    useLocalSearchParams,
    useRouter,
} from "expo-router";

import Svg, {
    Circle,
} from "react-native-svg";

import {
    fetchJobDetails,
    fetchJobMLScore,
} from "../../src/services/api";


type Keyword = {
  keyword: string;

  category:
    string | null;

  importance:
    string | null;
};


type JobDetails = {
  id: string;

  title:
    string | null;

  company:
    string | null;

  location:
    string | null;

  summary:
    string | null;

  seniority:
    string | null;

  employment_type:
    string | null;

  is_contract:
    boolean | null;

  contract_length:
    string | null;

  years_experience:
    number | null;

  raw_job_description:
    string | null;

  job_url:
    string | null;

  source:
    string | null;

  created_at:
    string;

  keywords:
    Keyword[];

  application_status:
    string;
};


type MLScore = {
  job?: {
    id:
      string;

    title:
      string | null;

    company:
      string | null;
  };

  bm25?: {
    best_raw_score?:
      number;

    best_normalized_score?:
      number;

    average_normalized_score?:
      number;

    matched_terms?:
      string[];

    missing_terms?:
      string[];
  };

  semantic?: {
    embedding_model?:
      string;

    cosine_similarity?:
      number;

    semantic_match_score?:
      number;
  };
};


export default function JobDetailsScreen() {
  const router =
    useRouter();


  const {
    id,
  } =
    useLocalSearchParams<{
      id: string;
    }>();


  const [
    job,
    setJob,
  ] =
    useState<JobDetails | null>(
      null
    );


  const [
    score,
    setScore,
  ] =
    useState<MLScore | null>(
      null
    );


  const [
    loading,
    setLoading,
  ] =
    useState(true);


  const [
    scoring,
    setScoring,
  ] =
    useState(true);


  const [
    refreshing,
    setRefreshing,
  ] =
    useState(false);


  const [
    error,
    setError,
  ] =
    useState("");


  const [
    scoreError,
    setScoreError,
  ] =
    useState("");


  useEffect(() => {
    if (id) {
      loadPage();
    }
  }, [
    id,
  ]);


  async function loadPage(
    refresh = false
  ) {
    if (!id) {
      return;
    }


    if (!refresh) {
      setLoading(
        true
      );
    }


    setError("");
    setScoreError("");


    try {
      const jobData =
        await fetchJobDetails(
          id
        );


      setJob(
        jobData
      );


      /*
       * Job data can appear
       * even if the ML server
       * is temporarily unavailable.
       */

      setScoring(
        true
      );


      try {
        const scoreData =
          await fetchJobMLScore(
            id
          );


        setScore(
          scoreData
        );
      } catch (
        scoreErr
      ) {
        setScore(
          null
        );


        setScoreError(
          scoreErr instanceof
            Error
            ? scoreErr.message
            : "Could not calculate ML scores."
        );
      } finally {
        setScoring(
          false
        );
      }
    } catch (err) {
      setError(
        err instanceof
          Error
          ? err.message
          : "Could not load job."
      );
    } finally {
      setLoading(
        false
      );


      setRefreshing(
        false
      );
    }
  }


  const onRefresh =
    useCallback(() => {
      setRefreshing(
        true
      );


      loadPage(
        true
      );
    }, [
      id,
    ]);


  async function openPosting() {
    if (
      !job?.job_url
    ) {
      return;
    }


    await Linking.openURL(
      job.job_url
    );
  }


  if (
    loading &&
    !job
  ) {
    return (
      <SafeAreaView
        style={
          styles.container
        }
      >
        <View
          style={
            styles.loadingContainer
          }
        >
          <ActivityIndicator
            size="large"
          />

          <Text
            style={
              styles.loadingText
            }
          >
            Loading job intelligence…
          </Text>
        </View>
      </SafeAreaView>
    );
  }


  if (
    !job
  ) {
    return (
      <SafeAreaView
        style={
          styles.container
        }
      >
        <View
          style={
            styles.loadingContainer
          }
        >
          <Text
            style={
              styles.errorText
            }
          >
            {error ||
              "Job could not be loaded."}
          </Text>


          <TouchableOpacity
            style={
              styles.backButton
            }
            onPress={() =>
              router.back()
            }
          >
            <Text
              style={
                styles.backButtonText
              }
            >
              Back
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }


  const bm25Score =
    clampScore(
      score
        ?.bm25
        ?.best_normalized_score
    );


  const semanticScore =
    clampScore(
      score
        ?.semantic
        ?.semantic_match_score
    );


  const matchedTerms =
    score
      ?.bm25
      ?.matched_terms ??
    [];


  const missingTerms =
    score
      ?.bm25
      ?.missing_terms ??
    [];


  return (
    <SafeAreaView
      style={
        styles.container
      }
    >
      <ScrollView
        contentContainerStyle={
          styles.content
        }
        refreshControl={
          <RefreshControl
            refreshing={
              refreshing
            }
            onRefresh={
              onRefresh
            }
          />
        }
      >
        {/* HEADER */}

        <TouchableOpacity
          onPress={() =>
            router.back()
          }
          style={
            styles.backLink
          }
        >
          <Text
            style={
              styles.backLinkText
            }
          >
            ‹ My Jobs
          </Text>
        </TouchableOpacity>


        <Text
          style={
            styles.eyebrow
          }
        >
          JOB INTELLIGENCE
        </Text>


        <Text
          style={
            styles.title
          }
        >
          {job.title ??
            "Untitled Role"}
        </Text>


        <Text
          style={
            styles.company
          }
        >
          {job.company ??
            "Unknown Company"}
        </Text>


        {/* SCORES */}

        <View
          style={
            styles.scoreCard
          }
        >
          <View
            style={
              styles.scoreHeader
            }
          >
            <View>
              <Text
                style={
                  styles.sectionTitle
                }
              >
                Match Analysis
              </Text>

              <Text
                style={
                  styles.sectionSubtitle
                }
              >
                Lexical and semantic
                similarity against your
                profile.
              </Text>
            </View>
          </View>


          {scoring ? (
            <View
              style={
                styles.scoringContainer
              }
            >
              <ActivityIndicator />

              <Text
                style={
                  styles.scoringText
                }
              >
                Running ML scoring…
              </Text>
            </View>
          ) : score ? (
            <View
              style={
                styles.scoreRow
              }
            >
              <ScoreRing
                score={
                  bm25Score
                }
                label="BM25"
                subtitle="Lexical relevance"
              />


              <ScoreRing
                score={
                  semanticScore
                }
                label="Semantic"
                subtitle="Embedding match"
              />
            </View>
          ) : (
            <View
              style={
                styles.scoreUnavailable
              }
            >
              <Text
                style={
                  styles.scoreUnavailableTitle
                }
              >
                Scores unavailable
              </Text>


              <Text
                style={
                  styles.scoreUnavailableText
                }
              >
                {scoreError}
              </Text>
            </View>
          )}


          {!!score
            ?.semantic
            ?.cosine_similarity && (
            <Text
              style={
                styles.modelDetail
              }
            >
              Cosine similarity:{" "}
              {score.semantic.cosine_similarity.toFixed(
                3
              )}
              {"  •  "}
              {score.semantic.embedding_model}
            </Text>
          )}
        </View>


        {/* JOB INFORMATION */}

        <View
          style={
            styles.card
          }
        >
          <Text
            style={
              styles.sectionTitle
            }
          >
            Role Details
          </Text>


          <View
            style={
              styles.metaWrap
            }
          >
            {job.location && (
              <MetaChip
                value={
                  job.location
                }
              />
            )}


            {job.seniority && (
              <MetaChip
                value={
                  job.seniority
                }
              />
            )}


            {job.employment_type && (
              <MetaChip
                value={
                  job.employment_type
                }
              />
            )}


            {job.years_experience !==
              null && (
              <MetaChip
                value={`${job.years_experience}+ yrs experience`}
              />
            )}


            {job.is_contract && (
              <MetaChip
                value={
                  job.contract_length
                    ? `Contract • ${job.contract_length}`
                    : "Contract"
                }
              />
            )}
          </View>
        </View>


        {/* DESCRIPTION */}

        <View
          style={
            styles.card
          }
        >
          <Text
            style={
              styles.sectionTitle
            }
          >
            Role Description
          </Text>


          <Text
            style={
              styles.description
            }
          >
            {job.summary ||
              job.raw_job_description ||
              "No role description available."}
          </Text>
        </View>


        {/* MATCHED */}

        {matchedTerms.length >
          0 && (
          <View
            style={
              styles.card
            }
          >
            <Text
              style={
                styles.sectionTitle
              }
            >
              Matched Skills
            </Text>


            <Text
              style={
                styles.sectionSubtitle
              }
            >
              Job terms identified in your
              profile.
            </Text>


            <View
              style={
                styles.skillsWrap
              }
            >
              {matchedTerms.map(
                (
                  skill
                ) => (
                  <View
                    key={
                      skill
                    }
                    style={
                      styles.matchedChip
                    }
                  >
                    <Text
                      style={
                        styles.matchedText
                      }
                    >
                      ✓ {skill}
                    </Text>
                  </View>
                )
              )}
            </View>
          </View>
        )}


        {/* MISSING */}

        {missingTerms.length >
          0 && (
          <View
            style={
              styles.card
            }
          >
            <Text
              style={
                styles.sectionTitle
              }
            >
              Potential Skill Gaps
            </Text>


            <Text
              style={
                styles.sectionSubtitle
              }
            >
              Job terms BM25 could not
              identify in your profile.
            </Text>


            <View
              style={
                styles.skillsWrap
              }
            >
              {missingTerms.map(
                (
                  skill
                ) => (
                  <View
                    key={
                      skill
                    }
                    style={
                      styles.missingChip
                    }
                  >
                    <Text
                      style={
                        styles.missingText
                      }
                    >
                      {skill}
                    </Text>
                  </View>
                )
              )}
            </View>
          </View>
        )}


        {/* ALL EXTRACTED SKILLS */}

        <View
          style={
            styles.card
          }
        >
          <Text
            style={
              styles.sectionTitle
            }
          >
            Extracted Requirements
          </Text>


          <View
            style={
              styles.skillsWrap
            }
          >
            {job.keywords.map(
              (
                item,
                index
              ) => (
                <View
                  key={`${item.keyword}-${index}`}
                  style={
                    styles.keywordChip
                  }
                >
                  <Text
                    style={
                      styles.keywordText
                    }
                  >
                    {
                      item.keyword
                    }
                  </Text>
                </View>
              )
            )}
          </View>
        </View>


        {/* ORIGINAL POSTING */}

        {job.job_url && (
          <TouchableOpacity
            style={
              styles.postingButton
            }
            onPress={
              openPosting
            }
          >
            <Text
              style={
                styles.postingButtonText
              }
            >
              View Original Job Posting ↗
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}


/*
 * SCORE RING
 */

function ScoreRing({
  score,
  label,
  subtitle,
}: {
  score: number;

  label: string;

  subtitle: string;
}) {
  const size =
    126;


  const strokeWidth =
    11;


  const radius =
    (
      size -
      strokeWidth
    ) /
    2;


  const circumference =
    2 *
    Math.PI *
    radius;


  const progress =
    circumference *
    (
      1 -
      score /
        100
    );


  return (
    <View
      style={
        styles.scoreItem
      }
    >
      <View>
        <Svg
          width={
            size
          }
          height={
            size
          }
        >
          <Circle
            cx={
              size /
              2
            }
            cy={
              size /
              2
            }
            r={
              radius
            }
            stroke="#E5E5EA"
            strokeWidth={
              strokeWidth
            }
            fill="none"
          />


          <Circle
            cx={
              size /
              2
            }
            cy={
              size /
              2
            }
            r={
              radius
            }
            stroke="#007AFF"
            strokeWidth={
              strokeWidth
            }
            fill="none"
            strokeLinecap="round"
            strokeDasharray={`${circumference} ${circumference}`}
            strokeDashoffset={
              progress
            }
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        </Svg>


        <View
          style={
            styles.scoreCenter
          }
        >
          <Text
            style={
              styles.scoreNumber
            }
          >
            {Math.round(
              score
            )}
          </Text>


          <Text
            style={
              styles.scoreOutOf
            }
          >
            / 100
          </Text>
        </View>
      </View>


      <Text
        style={
          styles.scoreLabel
        }
      >
        {label}
      </Text>


      <Text
        style={
          styles.scoreSubtitle
        }
      >
        {subtitle}
      </Text>
    </View>
  );
}


function MetaChip({
  value,
}: {
  value: string;
}) {
  return (
    <View
      style={
        styles.metaChip
      }
    >
      <Text
        style={
          styles.metaText
        }
      >
        {value}
      </Text>
    </View>
  );
}


function clampScore(
  value:
    number |
    null |
    undefined
) {
  if (
    value === null ||
    value === undefined ||
    Number.isNaN(
      Number(
        value
      )
    )
  ) {
    return 0;
  }


  return Math.min(
    100,
    Math.max(
      0,
      Number(
        value
      )
    )
  );
}


/*
 * STYLES
 */

const styles =
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor:
        "#F2F2F7",
    },


    content: {
      padding:
        20,

      paddingBottom:
        80,
    },


    loadingContainer: {
      flex: 1,

      alignItems:
        "center",

      justifyContent:
        "center",

      padding:
        30,
    },


    loadingText: {
      marginTop:
        12,

      color:
        "#8E8E93",
    },


    backLink: {
      alignSelf:
        "flex-start",

      paddingVertical:
        4,

      marginBottom:
        18,
    },


    backLinkText: {
      color:
        "#007AFF",

      fontSize:
        15,

      fontWeight:
        "600",
    },


    eyebrow: {
      color:
        "#007AFF",

      fontSize:
        11,

      fontWeight:
        "800",

      letterSpacing:
        1.2,
    },


    title: {
      marginTop:
        8,

      color:
        "#1C1C1E",

      fontSize:
        30,

      lineHeight:
        35,

      fontWeight:
        "800",
    },


    company: {
      marginTop:
        5,

      marginBottom:
        22,

      color:
        "#636366",

      fontSize:
        17,

      fontWeight:
        "600",
    },


    scoreCard: {
      backgroundColor:
        "#FFFFFF",

      borderRadius:
        22,

      padding:
        20,

      marginBottom:
        16,
    },


    scoreHeader: {
      marginBottom:
        18,
    },


    scoreRow: {
      flexDirection:
        "row",

      justifyContent:
        "space-around",

      alignItems:
        "flex-start",

      gap:
        10,
    },


    scoreItem: {
      flex: 1,

      alignItems:
        "center",
    },


    scoreCenter: {
      position:
        "absolute",

      top:
        0,

      left:
        0,

      right:
        0,

      bottom:
        0,

      justifyContent:
        "center",

      alignItems:
        "center",
    },


    scoreNumber: {
      color:
        "#1C1C1E",

      fontSize:
        29,

      fontWeight:
        "800",
    },


    scoreOutOf: {
      color:
        "#AEAEB2",

      fontSize:
        10,

      fontWeight:
        "600",
    },


    scoreLabel: {
      marginTop:
        9,

      color:
        "#1C1C1E",

      fontWeight:
        "800",

      fontSize:
        14,
    },


    scoreSubtitle: {
      marginTop:
        2,

      color:
        "#8E8E93",

      fontSize:
        10,

      textAlign:
        "center",
    },


    scoringContainer: {
      minHeight:
        130,

      justifyContent:
        "center",

      alignItems:
        "center",
    },


    scoringText: {
      marginTop:
        9,

      color:
        "#8E8E93",

      fontSize:
        12,
    },


    scoreUnavailable: {
      backgroundColor:
        "#F7F7F8",

      borderRadius:
        14,

      padding:
        16,
    },


    scoreUnavailableTitle: {
      color:
        "#1C1C1E",

      fontSize:
        14,

      fontWeight:
        "700",
    },


    scoreUnavailableText: {
      marginTop:
        4,

      color:
        "#8E8E93",

      fontSize:
        12,

      lineHeight:
        18,
    },


    modelDetail: {
      color:
        "#AEAEB2",

      fontSize:
        9,

      textAlign:
        "center",

      marginTop:
        18,
    },


    card: {
      backgroundColor:
        "#FFFFFF",

      borderRadius:
        20,

      padding:
        18,

      marginBottom:
        16,
    },


    sectionTitle: {
      color:
        "#1C1C1E",

      fontSize:
        17,

      fontWeight:
        "800",
    },


    sectionSubtitle: {
      color:
        "#8E8E93",

      fontSize:
        12,

      lineHeight:
        17,

      marginTop:
        4,

      marginBottom:
        12,
    },


    metaWrap: {
      flexDirection:
        "row",

      flexWrap:
        "wrap",

      gap:
        8,

      marginTop:
        13,
    },


    metaChip: {
      backgroundColor:
        "#F2F2F7",

      paddingHorizontal:
        10,

      paddingVertical:
        7,

      borderRadius:
        14,
    },


    metaText: {
      color:
        "#636366",

      fontSize:
        11,

      fontWeight:
        "600",
    },


    description: {
      marginTop:
        12,

      color:
        "#3A3A3C",

      fontSize:
        14,

      lineHeight:
        22,
    },


    skillsWrap: {
      flexDirection:
        "row",

      flexWrap:
        "wrap",

      gap:
        8,

      marginTop:
        4,
    },


    matchedChip: {
      backgroundColor:
        "#ECFDF3",

      borderRadius:
        14,

      paddingHorizontal:
        10,

      paddingVertical:
        7,
    },


    matchedText: {
      color:
        "#027A48",

      fontSize:
        11,

      fontWeight:
        "700",
    },


    missingChip: {
      backgroundColor:
        "#FFF1F0",

      borderRadius:
        14,

      paddingHorizontal:
        10,

      paddingVertical:
        7,
    },


    missingText: {
      color:
        "#B42318",

      fontSize:
        11,

      fontWeight:
        "700",
    },


    keywordChip: {
      backgroundColor:
        "#EEF4FF",

      borderRadius:
        14,

      paddingHorizontal:
        10,

      paddingVertical:
        7,
    },


    keywordText: {
      color:
        "#2563EB",

      fontSize:
        11,

      fontWeight:
        "600",
    },


    postingButton: {
      minHeight:
        50,

      alignItems:
        "center",

      justifyContent:
        "center",

      borderRadius:
        15,

      backgroundColor:
        "#007AFF",
    },


    postingButtonText: {
      color:
        "#FFFFFF",

      fontSize:
        14,

      fontWeight:
        "700",
    },


    errorText: {
      color:
        "#B42318",

      textAlign:
        "center",
    },


    backButton: {
      marginTop:
        16,

      backgroundColor:
        "#007AFF",

      paddingHorizontal:
        22,

      paddingVertical:
        12,

      borderRadius:
        12,
    },


    backButtonText: {
      color:
        "#FFFFFF",

      fontWeight:
        "700",
    },
  });