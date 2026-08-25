import React, {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  Alert,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import DateTimePicker from "@react-native-community/datetimepicker";

import {
  Swipeable,
} from "react-native-gesture-handler";

import {
  useLocalSearchParams,
  useRouter,
} from "expo-router";

import {
  ApplicationStatus,
  deleteJob,
  fetchJobs,
  updateApplicationStatus,
} from "../src/services/api";


type Job = {
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

  job_url:
    string | null;

  created_at:
    string;

  key_skills:
    string[];

  application_status:
    ApplicationStatus;

  status:
    ApplicationStatus;
};


type DatePreset =
  | "7D"
  | "30D"
  | "90D"
  | "ALL"
  | "CUSTOM";


const STATUS_OPTIONS: {
  value:
    ApplicationStatus;

  label:
    string;
}[] = [
  {
    value:
      "saved",

    label:
      "Saved",
  },

  {
    value:
      "applying",

    label:
      "Applying",
  },

  {
    value:
      "applied",

    label:
      "Applied",
  },

  {
    value:
      "interviewing",

    label:
      "Interviewing",
  },

  {
    value:
      "offer",

    label:
      "Offer",
  },

  {
    value:
      "rejected",

    label:
      "Rejected",
  },

  {
    value:
      "withdrawn",

    label:
      "Withdrawn",
  },
];


export default function JobsScreen() {
  const router =
    useRouter();


  const params =
    useLocalSearchParams<{
      status?: string;
    }>();


  const initialStatus =
    typeof params.status ===
      "string"
      ? params.status
      : undefined;


  const [
    jobs,
    setJobs,
  ] =
    useState<Job[]>([]);


  const [
    loading,
    setLoading,
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
    preset,
    setPreset,
  ] =
    useState<DatePreset>(
      "30D"
    );


  const [
    startDate,
    setStartDate,
  ] =
    useState<Date>(
      getDaysAgo(30)
    );


  const [
    endDate,
    setEndDate,
  ] =
    useState<Date>(
      new Date()
    );


  const [
    statusFilter,
    setStatusFilter,
  ] =
    useState<
      string | undefined
    >(
      initialStatus
    );


  const [
    openStatusJobId,
    setOpenStatusJobId,
  ] =
    useState<
      string | null
    >(null);


  /*
   * ============================================================
   * PARAM STATUS FILTER
   * ============================================================
   */

  useEffect(() => {
    if (
      typeof params.status ===
        "string"
    ) {
      setStatusFilter(
        params.status
      );
    }
  }, [
    params.status,
  ]);


  /*
   * ============================================================
   * LOAD
   * ============================================================
   */

  useEffect(() => {
    loadJobs();
  }, [
    preset,
    startDate,
    endDate,
    statusFilter,
  ]);


  async function loadJobs(
    showLoader = true
  ) {
    if (
      showLoader
    ) {
      setLoading(
        true
      );
    }


    setError("");


    try {
      const {
        start,
        end,
      } =
        getDateRange();


      const response =
        await fetchJobs(
          start,
          end,
          statusFilter
        );


      setJobs(
        response.jobs ??
          []
      );
    } catch (err) {
      setError(
        err instanceof
          Error
          ? err.message
          : "Could not load jobs."
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


      loadJobs(
        false
      );
    }, [
      preset,
      startDate,
      endDate,
      statusFilter,
    ]);


  /*
   * ============================================================
   * DATE RANGE
   * ============================================================
   */

  function getDateRange() {
    if (
      preset ===
      "ALL"
    ) {
      return {
        start:
          undefined,

        end:
          undefined,
      };
    }


    if (
      preset ===
      "CUSTOM"
    ) {
      return {
        start:
          formatDateForApi(
            startDate
          ),

        end:
          formatDateForApi(
            endDate
          ),
      };
    }


    const days =
      preset ===
      "7D"
        ? 7
        : preset ===
            "90D"
          ? 90
          : 30;


    return {
      start:
        formatDateForApi(
          getDaysAgo(
            days
          )
        ),

      end:
        formatDateForApi(
          new Date()
        ),
    };
  }


  function selectPreset(
    nextPreset:
      DatePreset
  ) {
    if (
      nextPreset ===
      "CUSTOM"
    ) {
      setPreset(
        "CUSTOM"
      );

      return;
    }


    setPreset(
      nextPreset
    );


    setEndDate(
      new Date()
    );


    if (
      nextPreset ===
      "7D"
    ) {
      setStartDate(
        getDaysAgo(7)
      );
    }


    if (
      nextPreset ===
      "30D"
    ) {
      setStartDate(
        getDaysAgo(30)
      );
    }


    if (
      nextPreset ===
      "90D"
    ) {
      setStartDate(
        getDaysAgo(90)
      );
    }
  }


  /*
   * ============================================================
   * OPEN JOB INTELLIGENCE
   * ============================================================
   */

  function openJob(
    jobId: string
  ) {
    setOpenStatusJobId(
      null
    );


    router.push({
      pathname:
        "/job/[id]",

      params: {
        id:
          jobId,
      },
    });
  }


  /*
   * ============================================================
   * STATUS CHANGE
   * ============================================================
   */

  async function handleStatusChange(
    jobId: string,
    nextStatus:
      ApplicationStatus
  ) {
    setOpenStatusJobId(
      null
    );


    const oldJobs =
      [...jobs];


    /*
     * Optimistic UI.
     *
     * If currently filtered by
     * status and the status changes,
     * remove the card immediately.
     */

    if (
      statusFilter &&
      nextStatus !==
        statusFilter
    ) {
      setJobs(
        (
          currentJobs
        ) =>
          currentJobs.filter(
            (job) =>
              job.id !==
              jobId
          )
      );
    } else {
      setJobs(
        (
          currentJobs
        ) =>
          currentJobs.map(
            (job) =>
              job.id ===
              jobId
                ? {
                    ...job,

                    status:
                      nextStatus,

                    application_status:
                      nextStatus,
                  }
                : job
          )
      );
    }


    try {
      await updateApplicationStatus(
        jobId,
        nextStatus
      );
    } catch (err) {
      /*
       * Restore previous state
       * if Supabase failed.
       */

      setJobs(
        oldJobs
      );


      Alert.alert(
        "Could not update status",

        err instanceof
          Error
          ? err.message
          : "An unexpected error occurred."
      );
    }
  }


  /*
   * ============================================================
   * DELETE
   * ============================================================
   */

  function confirmDeleteJob(
    job: Job
  ) {
    setOpenStatusJobId(
      null
    );


    Alert.alert(
      "Delete Job",

      `Delete ${job.title ?? "this job"}${
        job.company
          ? ` at ${job.company}`
          : ""
      }? This will also remove its keyword and application data.`,

      [
        {
          text:
            "Cancel",

          style:
            "cancel",
        },

        {
          text:
            "Delete",

          style:
            "destructive",

          onPress:
            async () => {
              const oldJobs =
                [...jobs];


              /*
               * Optimistically remove
               * from UI.
               */

              setJobs(
                (
                  currentJobs
                ) =>
                  currentJobs.filter(
                    (
                      existingJob
                    ) =>
                      existingJob.id !==
                      job.id
                  )
              );


              try {
                await deleteJob(
                  job.id
                );
              } catch (err) {
                /*
                 * Restore if delete
                 * failed.
                 */

                setJobs(
                  oldJobs
                );


                Alert.alert(
                  "Could not delete job",

                  err instanceof
                    Error
                    ? err.message
                    : "An unexpected error occurred."
                );
              }
            },
        },
      ]
    );
  }


  /*
   * ============================================================
   * UI
   * ============================================================
   */

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
        nestedScrollEnabled
      >
        <Text
          style={
            styles.eyebrow
          }
        >
          CAREER INTELLIGENCE
        </Text>


        <Text
          style={
            styles.title
          }
        >
          My Jobs
        </Text>


        <Text
          style={
            styles.subtitle
          }
        >
          Track the roles you are
          considering and manage each
          application.
        </Text>


        {/* ======================================================
            DATE FILTERS
        ====================================================== */}

        <View
          style={
            styles.filterCard
          }
        >
          <View
            style={
              styles.presetRow
            }
          >
            {[
              "7D",
              "30D",
              "90D",
              "ALL",
            ].map(
              (
                item
              ) => (
                <TouchableOpacity
                  key={
                    item
                  }
                  style={[
                    styles.presetButton,

                    preset ===
                      item &&
                      styles.presetButtonActive,
                  ]}
                  onPress={() =>
                    selectPreset(
                      item as
                        DatePreset
                    )
                  }
                >
                  <Text
                    style={[
                      styles.presetText,

                      preset ===
                        item &&
                        styles.presetTextActive,
                    ]}
                  >
                    {item}
                  </Text>
                </TouchableOpacity>
              )
            )}
          </View>


          {/* CUSTOM DATE RANGE */}

          <View
            style={
              styles.dateRow
            }
          >
            <TouchableOpacity
              activeOpacity={
                1
              }
              style={
                styles.dateButton
              }
              onPress={() =>
                setPreset(
                  "CUSTOM"
                )
              }
            >
              <Text
                style={
                  styles.dateLabel
                }
              >
                FROM
              </Text>


              <Text
                style={
                  styles.dateValue
                }
              >
                {formatDisplayDate(
                  startDate
                )}
              </Text>


              <DateTimePicker
                value={
                  startDate
                }
                mode="date"
                display="compact"
                themeVariant="light"
                maximumDate={
                  endDate
                }
                onChange={(
                  _,
                  date
                ) => {
                  if (
                    date
                  ) {
                    setStartDate(
                      date
                    );

                    setPreset(
                      "CUSTOM"
                    );
                  }
                }}
                style={
                  styles.hiddenDatePicker
                }
              />
            </TouchableOpacity>


            <TouchableOpacity
              activeOpacity={
                1
              }
              style={
                styles.dateButton
              }
              onPress={() =>
                setPreset(
                  "CUSTOM"
                )
              }
            >
              <Text
                style={
                  styles.dateLabel
                }
              >
                TO
              </Text>


              <Text
                style={
                  styles.dateValue
                }
              >
                {formatDisplayDate(
                  endDate
                )}
              </Text>


              <DateTimePicker
                value={
                  endDate
                }
                mode="date"
                display="compact"
                themeVariant="light"
                minimumDate={
                  startDate
                }
                maximumDate={
                  new Date()
                }
                onChange={(
                  _,
                  date
                ) => {
                  if (
                    date
                  ) {
                    setEndDate(
                      date
                    );

                    setPreset(
                      "CUSTOM"
                    );
                  }
                }}
                style={
                  styles.hiddenDatePicker
                }
              />
            </TouchableOpacity>
          </View>
        </View>


        {/* ======================================================
            STATUS FILTER FROM HOME
        ====================================================== */}

        {!!statusFilter && (
          <TouchableOpacity
            style={
              styles.statusFilterChip
            }
            onPress={() =>
              setStatusFilter(
                undefined
              )
            }
          >
            <Text
              style={
                styles.statusFilterText
              }
            >
              Status:{" "}
              {formatStatus(
                statusFilter
              )}
              {"  "}×
            </Text>
          </TouchableOpacity>
        )}


        {/* ======================================================
            ERROR
        ====================================================== */}

        {!!error && (
          <View
            style={
              styles.errorCard
            }
          >
            <Text
              style={
                styles.errorText
              }
            >
              {error}
            </Text>
          </View>
        )}


        {/* ======================================================
            CONTENT
        ====================================================== */}

        {loading &&
        !refreshing ? (
          <View
            style={
              styles.emptyCard
            }
          >
            <Text
              style={
                styles.emptyText
              }
            >
              Loading jobs…
            </Text>
          </View>
        ) : jobs.length ===
          0 ? (
          <View
            style={
              styles.emptyCard
            }
          >
            <Text
              style={
                styles.emptyTitle
              }
            >
              No jobs found
            </Text>


            <Text
              style={
                styles.emptyText
              }
            >
              Try another date range or
              clear the application
              status filter.
            </Text>
          </View>
        ) : (
          jobs.map(
            (job) => (
              <Swipeable
                key={
                  job.id
                }
                friction={
                  2
                }
                rightThreshold={
                  40
                }
                overshootRight={
                  false
                }
                renderRightActions={() => (
                  <DeleteAction
                    onDelete={() =>
                      confirmDeleteJob(
                        job
                      )
                    }
                  />
                )}
              >
                <TouchableOpacity
                  activeOpacity={
                    0.92
                  }
                  style={
                    styles.jobCard
                  }
                  onPress={() =>
                    openJob(
                      job.id
                    )
                  }
                >
                  {/* TITLE */}

                  <Text
                    style={
                      styles.jobTitle
                    }
                  >
                    {job.title ??
                      "Untitled Role"}
                  </Text>


                  {/* COMPANY */}

                  <Text
                    style={
                      styles.company
                    }
                  >
                    {job.company ??
                      "Unknown company"}
                  </Text>


                  {/* META */}

                  <View
                    style={
                      styles.metaRow
                    }
                  >
                    {!!job.location && (
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
                          {
                            job.location
                          }
                        </Text>
                      </View>
                    )}


                    {!!job.seniority && (
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
                          {
                            job.seniority
                          }
                        </Text>
                      </View>
                    )}


                    {!!job.employment_type && (
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
                          {
                            job.employment_type
                          }
                        </Text>
                      </View>
                    )}
                  </View>


                  {/* SKILLS */}

                  {job.key_skills &&
                    job.key_skills
                      .length >
                      0 && (
                    <View
                      style={
                        styles.skillsWrap
                      }
                    >
                      {job.key_skills.map(
                        (
                          skill,
                          index
                        ) => (
                          <View
                            key={`${job.id}-${skill}-${index}`}
                            style={
                              styles.skillChip
                            }
                          >
                            <Text
                              style={
                                styles.skillText
                              }
                            >
                              {skill}
                            </Text>
                          </View>
                        )
                      )}
                    </View>
                  )}


                  {/* STATUS */}

                  <View
                    style={
                      styles.statusSection
                    }
                  >
                    <Text
                      style={
                        styles.statusLabel
                      }
                    >
                      APPLICATION STATUS
                    </Text>


                    <TouchableOpacity
                      style={
                        styles.statusButton
                      }
                      onPress={(
                        event
                      ) => {
                        /*
                         * Prevent the card
                         * itself from opening
                         * Job Intelligence.
                         */

                        event.stopPropagation();


                        setOpenStatusJobId(
                          openStatusJobId ===
                            job.id
                            ? null
                            : job.id
                        );
                      }}
                    >
                      <View
                        style={[
                          styles.statusDot,
                          getStatusDotStyle(
                            job.application_status
                          ),
                        ]}
                      />


                      <Text
                        style={
                          styles.statusButtonText
                        }
                      >
                        {formatStatus(
                          job.application_status
                        )}
                      </Text>


                      <Text
                        style={
                          styles.statusChevron
                        }
                      >
                        {openStatusJobId ===
                        job.id
                          ? "⌃"
                          : "⌄"}
                      </Text>
                    </TouchableOpacity>


                    {openStatusJobId ===
                      job.id && (
                      <View
                        style={
                          styles.statusDropdown
                        }
                      >
                        <ScrollView
                          nestedScrollEnabled
                          style={
                            styles.statusDropdownScroll
                          }
                          showsVerticalScrollIndicator={
                            false
                          }
                        >
                          {STATUS_OPTIONS.map(
                            (
                              option
                            ) => (
                              <TouchableOpacity
                                key={
                                  option.value
                                }
                                style={[
                                  styles.statusOption,

                                  option.value ===
                                    job.application_status &&
                                    styles.statusOptionActive,
                                ]}
                                onPress={(
                                  event
                                ) => {
                                  event.stopPropagation();


                                  handleStatusChange(
                                    job.id,
                                    option.value
                                  );
                                }}
                              >
                                <View
                                  style={[
                                    styles.statusDot,
                                    getStatusDotStyle(
                                      option.value
                                    ),
                                  ]}
                                />


                                <Text
                                  style={[
                                    styles.statusOptionText,

                                    option.value ===
                                      job.application_status &&
                                      styles.statusOptionTextActive,
                                  ]}
                                >
                                  {
                                    option.label
                                  }
                                </Text>
                              </TouchableOpacity>
                            )
                          )}
                        </ScrollView>
                      </View>
                    )}
                  </View>


                  {/* CREATED */}

                  <Text
                    style={
                      styles.savedDate
                    }
                  >
                    Added{" "}
                    {formatSavedDate(
                      job.created_at
                    )}
                  </Text>


                  {/* TAP HINT */}

                  <View
                    style={
                      styles.intelligenceHint
                    }
                  >
                    <Text
                      style={
                        styles.intelligenceHintText
                      }
                    >
                      View Job Intelligence
                    </Text>

                    <Text
                      style={
                        styles.intelligenceChevron
                      }
                    >
                      ›
                    </Text>
                  </View>
                </TouchableOpacity>
              </Swipeable>
            )
          )
        )}
      </ScrollView>
    </SafeAreaView>
  );
}


/*
 * ============================================================
 * DELETE ACTION
 * ============================================================
 */

function DeleteAction({
  onDelete,
}: {
  onDelete:
    () => void;
}) {
  return (
    <TouchableOpacity
      activeOpacity={
        0.85
      }
      style={
        styles.deleteAction
      }
      onPress={
        onDelete
      }
    >
      <Text
        style={
          styles.deleteActionText
        }
      >
        Delete
      </Text>
    </TouchableOpacity>
  );
}


/*
 * ============================================================
 * HELPERS
 * ============================================================
 */

function getDaysAgo(
  days: number
) {
  const date =
    new Date();


  date.setDate(
    date.getDate() -
      days
  );


  return date;
}


function formatDateForApi(
  date: Date
) {
  const year =
    date.getFullYear();


  const month =
    String(
      date.getMonth() +
        1
    ).padStart(
      2,
      "0"
    );


  const day =
    String(
      date.getDate()
    ).padStart(
      2,
      "0"
    );


  return `${year}-${month}-${day}`;
}


function formatDisplayDate(
  date: Date
) {
  return date.toLocaleDateString(
    "en-AU",
    {
      day:
        "numeric",

      month:
        "short",

      year:
        "numeric",
    }
  );
}


function formatSavedDate(
  value: string
) {
  const date =
    new Date(
      value
    );


  return date.toLocaleDateString(
    "en-AU",
    {
      day:
        "numeric",

      month:
        "short",

      year:
        "numeric",
    }
  );
}


function formatStatus(
  status: string
) {
  return status
    .replace(
      /_/g,
      " "
    )
    .replace(
      /\b\w/g,
      (letter) =>
        letter.toUpperCase()
    );
}


function getStatusDotStyle(
  status: string
) {
  switch (status) {
    case "applying":
      return {
        backgroundColor:
          "#5856D6",
      };

    case "applied":
      return {
        backgroundColor:
          "#007AFF",
      };

    case "interviewing":
      return {
        backgroundColor:
          "#FF9500",
      };

    case "offer":
      return {
        backgroundColor:
          "#34C759",
      };

    case "rejected":
      return {
        backgroundColor:
          "#FF3B30",
      };

    case "withdrawn":
      return {
        backgroundColor:
          "#8E8E93",
      };

    default:
      return {
        backgroundColor:
          "#636366",
      };
  }
}


/*
 * ============================================================
 * STYLES
 * ============================================================
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


    eyebrow: {
      color:
        "#007AFF",

      fontSize:
        12,

      fontWeight:
        "700",

      letterSpacing:
        1.2,

      marginBottom:
        8,
    },


    title: {
      fontSize:
        34,

      fontWeight:
        "800",

      color:
        "#1C1C1E",
    },


    subtitle: {
      marginTop:
        7,

      marginBottom:
        22,

      color:
        "#636366",

      fontSize:
        16,

      lineHeight:
        23,
    },


    /*
     * FILTER
     */

    filterCard: {
      backgroundColor:
        "#FFFFFF",

      borderRadius:
        20,

      padding:
        14,

      marginBottom:
        16,
    },


    presetRow: {
      flexDirection:
        "row",

      backgroundColor:
        "#F2F2F7",

      borderRadius:
        12,

      padding:
        3,
    },


    presetButton: {
      flex: 1,

      alignItems:
        "center",

      justifyContent:
        "center",

      paddingVertical:
        8,

      borderRadius:
        10,
    },


    presetButtonActive: {
      backgroundColor:
        "#FFFFFF",
    },


    presetText: {
      color:
        "#8E8E93",

      fontSize:
        12,

      fontWeight:
        "700",
    },


    presetTextActive: {
      color:
        "#1C1C1E",
    },


    dateRow: {
      flexDirection:
        "row",

      gap:
        10,

      marginTop:
        12,
    },


    dateButton: {
      flex:
        1,

      backgroundColor:
        "#F7F7F8",

      borderRadius:
        12,

      padding:
        12,

      position:
        "relative",

      overflow:
        "hidden",
    },


    dateLabel: {
      fontSize:
        11,

      color:
        "#8E8E93",

      marginBottom:
        4,
    },


    dateValue: {
      fontSize:
        14,

      fontWeight:
        "600",

      color:
        "#1C1C1E",
    },


    hiddenDatePicker: {
      position:
        "absolute",

      top:
        0,

      left:
        0,

      width:
        "100%",

      height:
        "100%",

      opacity:
        0.02,
    },


    /*
     * STATUS FILTER
     */

    statusFilterChip: {
      alignSelf:
        "flex-start",

      backgroundColor:
        "#EEF4FF",

      borderRadius:
        16,

      paddingHorizontal:
        12,

      paddingVertical:
        8,

      marginBottom:
        16,
    },


    statusFilterText: {
      color:
        "#2563EB",

      fontSize:
        12,

      fontWeight:
        "700",
    },


    /*
     * JOB CARD
     */

    jobCard: {
      backgroundColor:
        "#FFFFFF",

      borderRadius:
        20,

      padding:
        18,

      marginBottom:
        14,
    },


    jobTitle: {
      color:
        "#1C1C1E",

      fontSize:
        19,

      lineHeight:
        24,

      fontWeight:
        "800",
    },


    company: {
      marginTop:
        5,

      color:
        "#636366",

      fontSize:
        14,

      fontWeight:
        "600",
    },


    metaRow: {
      flexDirection:
        "row",

      flexWrap:
        "wrap",

      gap:
        7,

      marginTop:
        13,
    },


    metaChip: {
      backgroundColor:
        "#F2F2F7",

      borderRadius:
        13,

      paddingHorizontal:
        9,

      paddingVertical:
        6,
    },


    metaText: {
      color:
        "#636366",

      fontSize:
        11,

      fontWeight:
        "600",
    },


    /*
     * SKILLS
     */

    skillsWrap: {
      flexDirection:
        "row",

      flexWrap:
        "wrap",

      gap:
        7,

      marginTop:
        14,
    },


    skillChip: {
      backgroundColor:
        "#EEF4FF",

      borderRadius:
        14,

      paddingHorizontal:
        10,

      paddingVertical:
        6,
    },


    skillText: {
      color:
        "#2563EB",

      fontSize:
        11,

      fontWeight:
        "600",
    },


    /*
     * STATUS
     */

    statusSection: {
      marginTop:
        18,

      position:
        "relative",

      zIndex:
        20,
    },


    statusLabel: {
      color:
        "#8E8E93",

      fontSize:
        10,

      fontWeight:
        "700",

      letterSpacing:
        0.7,

      marginBottom:
        7,
    },


    statusButton: {
      flexDirection:
        "row",

      alignItems:
        "center",

      backgroundColor:
        "#F7F7F8",

      borderRadius:
        12,

      paddingHorizontal:
        12,

      minHeight:
        44,
    },


    statusDot: {
      width:
        8,

      height:
        8,

      borderRadius:
        4,

      marginRight:
        9,
    },


    statusButtonText: {
      flex:
        1,

      color:
        "#1C1C1E",

      fontSize:
        13,

      fontWeight:
        "700",
    },


    statusChevron: {
      color:
        "#8E8E93",

      fontSize:
        17,
    },


    statusDropdown: {
      marginTop:
        6,

      backgroundColor:
        "#FFFFFF",

      borderRadius:
        12,

      borderWidth:
        StyleSheet.hairlineWidth,

      borderColor:
        "#D1D1D6",

      overflow:
        "hidden",

      zIndex:
        50,
    },


    statusDropdownScroll: {
      maxHeight:
        220,
    },


    statusOption: {
      minHeight:
        44,

      paddingHorizontal:
        12,

      flexDirection:
        "row",

      alignItems:
        "center",

      borderBottomWidth:
        StyleSheet.hairlineWidth,

      borderBottomColor:
        "#E5E5EA",
    },


    statusOptionActive: {
      backgroundColor:
        "#F2F2F7",
    },


    statusOptionText: {
      color:
        "#3A3A3C",

      fontSize:
        13,
    },


    statusOptionTextActive: {
      color:
        "#1C1C1E",

      fontWeight:
        "700",
    },


    /*
     * CARD FOOTER
     */

    savedDate: {
      color:
        "#AEAEB2",

      fontSize:
        10,

      marginTop:
        14,
    },


    intelligenceHint: {
      marginTop:
        13,

      paddingTop:
        12,

      borderTopWidth:
        StyleSheet.hairlineWidth,

      borderTopColor:
        "#E5E5EA",

      flexDirection:
        "row",

      alignItems:
        "center",

      justifyContent:
        "space-between",
    },


    intelligenceHintText: {
      color:
        "#007AFF",

      fontSize:
        12,

      fontWeight:
        "700",
    },


    intelligenceChevron: {
      color:
        "#007AFF",

      fontSize:
        22,

      lineHeight:
        22,
    },


    /*
     * DELETE
     */

    deleteAction: {
      width:
        92,

      backgroundColor:
        "#FF3B30",

      borderRadius:
        20,

      marginLeft:
        8,

      marginBottom:
        14,

      alignItems:
        "center",

      justifyContent:
        "center",
    },


    deleteActionText: {
      color:
        "#FFFFFF",

      fontSize:
        14,

      fontWeight:
        "800",
    },


    /*
     * EMPTY / ERROR
     */

    emptyCard: {
      backgroundColor:
        "#FFFFFF",

      borderRadius:
        20,

      padding:
        24,

      alignItems:
        "center",
    },


    emptyTitle: {
      color:
        "#1C1C1E",

      fontSize:
        17,

      fontWeight:
        "800",

      marginBottom:
        5,
    },


    emptyText: {
      color:
        "#8E8E93",

      textAlign:
        "center",

      fontSize:
        13,

      lineHeight:
        19,
    },


    errorCard: {
      backgroundColor:
        "#FFF1F0",

      borderRadius:
        14,

      padding:
        14,

      marginBottom:
        16,
    },


    errorText: {
      color:
        "#B42318",

      fontSize:
        13,

      lineHeight:
        18,
    },
  });