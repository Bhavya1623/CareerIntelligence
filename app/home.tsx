import React, {
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
  useRouter,
} from "expo-router";

import {
  fetchDashboard,
} from "../src/services/api";

type DashboardData = {
  summary: {
    jobs_saved: number;
    applications: number;
    interviews: number;
    offers: number;
    response_rate: number;
  };

  pipeline: {
    saved: number;
    applying: number;
    applied: number;
    interviewing: number;
    rejected: number;
    offer: number;
    withdrawn: number;
  };

  recent_jobs: Array<{
    id: string;
    title: string | null;
    company: string | null;
    seniority: string | null;
    employment_type: string | null;
    job_url: string | null;
    application_status: string;
  }>;

  top_keywords: Array<{
    keyword: string;
    category: string;
    frequency: number;
  }>;
};

export default function HomeScreen() {
  const router = useRouter();

  const [data, setData] =
    useState<DashboardData | null>(
      null
    );

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState("");

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard(
    isRefresh = false
  ) {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError("");

    try {
      const response =
        await fetchDashboard();

      setData(response);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError(
          "Could not load dashboard."
        );
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  function openStatusJobs(
    status: string
  ) {
    router.push({
      pathname: "/jobs",
      params: {
        status,
      },
    });
  }

  if (loading) {
    return (
      <SafeAreaView
        style={styles.container}
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
            style={styles.loadingText}
          >
            Loading dashboard…
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={
          styles.content
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() =>
              loadDashboard(true)
            }
          />
        }
      >
        <Text style={styles.eyebrow}>
          CAREER INTELLIGENCE
        </Text>

        <Text style={styles.title}>
          Home
        </Text>

        <Text style={styles.subtitle}>
          Your job search at a glance.
        </Text>

        {!!error && (
          <View style={styles.errorCard}>
            <Text style={styles.errorText}>
              {error}
            </Text>
          </View>
        )}

        {data && (
          <>
            <View style={styles.statGrid}>
              <StatCard
                value={
                  data.summary.jobs_saved
                }
                label="Jobs saved"
              />

              <StatCard
                value={
                  data.summary.applications
                }
                label="Applications"
              />

              <StatCard
                value={
                  data.summary.interviews
                }
                label="Interviews"
              />

              <StatCard
                value={
                  data.summary.offers
                }
                label="Offers"
              />
            </View>

            <View
              style={styles.responseCard}
            >
              <Text
                style={styles.responseLabel}
              >
                Response rate
              </Text>

              <Text
                style={styles.responseValue}
              >
                {
                  data.summary
                    .response_rate
                }
                %
              </Text>
            </View>

            <View
              style={styles.sectionHeader}
            >
              <Text
                style={
                  styles.sectionHeading
                }
              >
                Application Pipeline
              </Text>

              <Text
                style={styles.sectionHint}
              >
                Tap a stage
              </Text>
            </View>

            <View style={styles.card}>
              <PipelineRow
                label="Saved"
                value={
                  data.pipeline.saved
                }
                onPress={() =>
                  openStatusJobs("saved")
                }
              />

              <PipelineRow
                label="Applying"
                value={
                  data.pipeline.applying
                }
                onPress={() =>
                  openStatusJobs(
                    "applying"
                  )
                }
              />

              <PipelineRow
                label="Applied"
                value={
                  data.pipeline.applied
                }
                onPress={() =>
                  openStatusJobs(
                    "applied"
                  )
                }
              />

              <PipelineRow
                label="Interviewing"
                value={
                  data.pipeline
                    .interviewing
                }
                onPress={() =>
                  openStatusJobs(
                    "interviewing"
                  )
                }
              />

              <PipelineRow
                label="Offers"
                value={
                  data.pipeline.offer
                }
                onPress={() =>
                  openStatusJobs("offer")
                }
              />

              <PipelineRow
                label="Rejected"
                value={
                  data.pipeline.rejected
                }
                onPress={() =>
                  openStatusJobs(
                    "rejected"
                  )
                }
              />

              <PipelineRow
                label="Withdrawn"
                value={
                  data.pipeline.withdrawn
                }
                onPress={() =>
                  openStatusJobs(
                    "withdrawn"
                  )
                }
              />
            </View>

            <Text
              style={styles.sectionHeading}
            >
              Recent Jobs
            </Text>

            {data.recent_jobs.length ===
            0 ? (
              <View style={styles.card}>
                <Text
                  style={styles.emptyText}
                >
                  No jobs added yet.
                </Text>
              </View>
            ) : (
              data.recent_jobs.map(
                (job) => (
                  <View
                    key={job.id}
                    style={styles.jobCard}
                  >
                    <TouchableOpacity
                      disabled={
                        !job.job_url
                      }
                      onPress={() => {
                        if (job.job_url) {
                          Linking.openURL(
                            job.job_url
                          );
                        }
                      }}
                    >
                      <Text
                        style={[
                          styles.jobTitle,
                          job.job_url &&
                            styles.jobTitleLink,
                        ]}
                      >
                        {job.title ??
                          "Untitled role"}
                      </Text>
                    </TouchableOpacity>

                    <Text
                      style={styles.company}
                    >
                      {job.company ??
                        "Unknown company"}
                    </Text>

                    <View
                      style={styles.metaRow}
                    >
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

                      <TouchableOpacity
                        style={
                          styles.statusChip
                        }
                        onPress={() =>
                          openStatusJobs(
                            job.application_status
                          )
                        }
                      >
                        <Text
                          style={
                            styles.statusText
                          }
                        >
                          {formatStatus(
                            job.application_status
                          )}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )
              )
            )}

            <Text
              style={styles.sectionHeading}
            >
              Market Snapshot
            </Text>

            <View style={styles.card}>
              {data.top_keywords.length ===
              0 ? (
                <Text
                  style={styles.emptyText}
                >
                  No keyword data yet.
                </Text>
              ) : (
                data.top_keywords.map(
                  (item, index) => (
                    <View
                      key={`${item.keyword}-${index}`}
                      style={
                        styles.keywordRow
                      }
                    >
                      <View
                        style={
                          styles.rankCircle
                        }
                      >
                        <Text
                          style={
                            styles.rankText
                          }
                        >
                          {index + 1}
                        </Text>
                      </View>

                      <View
                        style={
                          styles.keywordInfo
                        }
                      >
                        <Text
                          style={
                            styles.keywordName
                          }
                        >
                          {item.keyword}
                        </Text>

                        <Text
                          style={
                            styles.keywordCategory
                          }
                        >
                          {formatCategory(
                            item.category
                          )}
                        </Text>
                      </View>

                      <Text
                        style={
                          styles.keywordCount
                        }
                      >
                        {item.frequency}
                      </Text>
                    </View>
                  )
                )
              )}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function StatCard({
  value,
  label,
}: {
  value: number;
  label: string;
}) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statValue}>
        {value}
      </Text>

      <Text style={styles.statLabel}>
        {label}
      </Text>
    </View>
  );
}

function PipelineRow({
  label,
  value,
  onPress,
}: {
  label: string;
  value: number;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={styles.pipelineRow}
      onPress={onPress}
      activeOpacity={0.65}
    >
      <Text
        style={styles.pipelineLabel}
      >
        {label}
      </Text>

      <View
        style={styles.pipelineCount}
      >
        <Text
          style={
            styles.pipelineCountText
          }
        >
          {value}
        </Text>
      </View>

      <Text
        style={styles.pipelineArrow}
      >
        ›
      </Text>
    </TouchableOpacity>
  );
}

function formatStatus(
  status?: string
) {
  if (!status) {
    return "Saved";
  }

  return status
    .replace(/_/g, " ")
    .replace(
      /\b\w/g,
      (letter) =>
        letter.toUpperCase()
    );
}

function formatCategory(
  category?: string
) {
  if (!category) {
    return "Other";
  }

  return category
    .replace(/_/g, " ")
    .replace(
      /\b\w/g,
      (letter) =>
        letter.toUpperCase()
    );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F2F2F7",
  },

  content: {
    padding: 20,
    paddingBottom: 70,
  },

  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  loadingText: {
    marginTop: 12,
    color: "#636366",
  },

  eyebrow: {
    color: "#007AFF",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.2,
    marginBottom: 8,
  },

  title: {
    fontSize: 34,
    fontWeight: "800",
    color: "#1C1C1E",
  },

  subtitle: {
    marginTop: 6,
    marginBottom: 24,
    fontSize: 16,
    color: "#636366",
  },

  statGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 14,
  },

  statCard: {
    width: "48%",
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 18,
  },

  statValue: {
    fontSize: 28,
    fontWeight: "800",
    color: "#1C1C1E",
  },

  statLabel: {
    marginTop: 4,
    fontSize: 13,
    color: "#8E8E93",
  },

  responseCard: {
    backgroundColor: "#007AFF",
    borderRadius: 18,
    padding: 18,
    marginBottom: 28,
  },

  responseLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#DCEBFF",
  },

  responseValue: {
    marginTop: 4,
    fontSize: 32,
    fontWeight: "800",
    color: "#FFFFFF",
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
  },

  sectionHeading: {
    fontSize: 21,
    fontWeight: "700",
    color: "#1C1C1E",
    marginBottom: 12,
  },

  sectionHint: {
    marginLeft: "auto",
    marginBottom: 12,
    fontSize: 12,
    color: "#8E8E93",
  },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 18,
    marginBottom: 26,
  },

  pipelineRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
  },

  pipelineLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
    color: "#3A3A3C",
  },

  pipelineCount: {
    minWidth: 34,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
    backgroundColor: "#F2F2F7",
    alignItems: "center",
  },

  pipelineCountText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#1C1C1E",
  },

  pipelineArrow: {
    marginLeft: 10,
    fontSize: 24,
    color: "#C7C7CC",
  },

  jobCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 18,
    marginBottom: 12,
  },

  jobTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1C1C1E",
  },

  jobTitleLink: {
    color: "#007AFF",
  },

  company: {
    marginTop: 4,
    fontSize: 15,
    color: "#636366",
  },

  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
  },

  metaChip: {
    backgroundColor: "#F2F2F7",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
  },

  metaText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#3A3A3C",
  },

  statusChip: {
    backgroundColor: "#EEF4FF",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
  },

  statusText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#2563EB",
  },

  keywordRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 9,
  },

  rankCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#F2F2F7",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },

  rankText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#636366",
  },

  keywordInfo: {
    flex: 1,
  },

  keywordName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1C1C1E",
  },

  keywordCategory: {
    marginTop: 2,
    fontSize: 11,
    color: "#8E8E93",
  },

  keywordCount: {
    fontSize: 15,
    fontWeight: "800",
    color: "#1C1C1E",
  },

  emptyText: {
    color: "#8E8E93",
    textAlign: "center",
  },

  errorCard: {
    backgroundColor: "#FFF1F0",
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
  },

  errorText: {
    color: "#B42318",
  },
});