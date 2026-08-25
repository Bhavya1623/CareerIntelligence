import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { fetchProfile } from "../src/services/api";

type ExperienceItem = {
  company?: string | null;
  role?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  location?: string | null;
  description?: string | null;
  achievements?: string[];
};

type EducationItem = {
  institution?: string | null;
  qualification?: string | null;
  field?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  description?: string | null;
};

type ProjectItem = {
  name?: string | null;
  year?: string | null;
  description?: string | null;
  technologies?: string[];
};

type Profile = {
  name?: string | null;
  headline?: string | null;
  summary?: string | null;
  email?: string | null;
  phone?: string | null;
  location?: string | null;
  linkedin?: string | null;

  skills?: string[];
  certifications?: string[];
  education?: EducationItem[];
  experience?: ExperienceItem[];
  projects?: ProjectItem[];
};

export default function ProfileScreen() {
  const [profile, setProfile] =
    useState<Profile | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    setLoading(true);
    setError("");

    try {
      const response =
        await fetchProfile();

      setProfile(
        response.profile ?? null
      );
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError(
          "Could not load profile."
        );
      }
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <SafeAreaView
        style={styles.container}
      >
        <View
          style={styles.loadingContainer}
        >
          <ActivityIndicator
            size="large"
          />

          <Text
            style={styles.loadingText}
          >
            Loading profile…
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
      >
        <Text style={styles.eyebrow}>
          CAREER PROFILE
        </Text>

        <Text style={styles.title}>
          Profile
        </Text>

        <Text style={styles.subtitle}>
          Your master career profile.
        </Text>

        {!!error && (
          <View style={styles.errorCard}>
            <Text style={styles.errorText}>
              {error}
            </Text>
          </View>
        )}

        {profile && (
          <>
            <View style={styles.heroCard}>
              <View
                style={
                  styles.initialCircle
                }
              >
                <Text
                  style={
                    styles.initialText
                  }
                >
                  {getInitials(
                    profile.name
                  )}
                </Text>
              </View>

              <Text style={styles.name}>
                {profile.name ??
                  "Profile"}
              </Text>

              {!!profile.headline && (
                <Text
                  style={
                    styles.headline
                  }
                >
                  {profile.headline}
                </Text>
              )}

              {!!profile.location && (
                <Text
                  style={styles.meta}
                >
                  {profile.location}
                </Text>
              )}

              {!!profile.email && (
                <TouchableOpacity
                  onPress={() =>
                    Linking.openURL(
                      `mailto:${profile.email}`
                    )
                  }
                >
                  <Text
                    style={
                      styles.linkText
                    }
                  >
                    {profile.email}
                  </Text>
                </TouchableOpacity>
              )}

              {!!profile.linkedin && (
                <TouchableOpacity
                  onPress={() =>
                    Linking.openURL(
                      profile.linkedin!
                    )
                  }
                >
                  <Text
                    style={
                      styles.linkText
                    }
                  >
                    LinkedIn
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {!!profile.summary && (
              <>
                <Text
                  style={
                    styles.sectionHeading
                  }
                >
                  Summary
                </Text>

                <View style={styles.card}>
                  <Text
                    style={styles.bodyText}
                  >
                    {profile.summary}
                  </Text>
                </View>
              </>
            )}

            {(profile.skills ?? [])
              .length > 0 && (
              <>
                <Text
                  style={
                    styles.sectionHeading
                  }
                >
                  Skills
                </Text>

                <View style={styles.card}>
                  <View
                    style={
                      styles.skillWrap
                    }
                  >
                    {profile.skills!.map(
                      (
                        skill,
                        index
                      ) => (
                        <View
                          key={`${skill}-${index}`}
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
                </View>
              </>
            )}

            {(profile.experience ?? [])
              .length > 0 && (
              <>
                <Text
                  style={
                    styles.sectionHeading
                  }
                >
                  Experience
                </Text>

                {profile.experience!.map(
                  (item, index) => (
                    <View
                      key={`${item.company}-${index}`}
                      style={styles.card}
                    >
                      <Text
                        style={styles.role}
                      >
                        {item.role ??
                          "Role"}
                      </Text>

                      <Text
                        style={
                          styles.company
                        }
                      >
                        {item.company ??
                          ""}
                      </Text>

                      <Text
                        style={
                          styles.dates
                        }
                      >
                        {item.start_date ??
                          ""}
                        {item.end_date
                          ? ` – ${item.end_date}`
                          : ""}
                      </Text>

                      {!!item.description && (
                        <Text
                          style={
                            styles.bodyText
                          }
                        >
                          {item.description}
                        </Text>
                      )}

                      {(
                        item.achievements ??
                        []
                      ).map(
                        (
                          achievement,
                          achievementIndex
                        ) => (
                          <Text
                            key={
                              achievementIndex
                            }
                            style={
                              styles.bullet
                            }
                          >
                            •{" "}
                            {
                              achievement
                            }
                          </Text>
                        )
                      )}
                    </View>
                  )
                )}
              </>
            )}

            {(profile.education ?? [])
              .length > 0 && (
              <>
                <Text
                  style={
                    styles.sectionHeading
                  }
                >
                  Education
                </Text>

                {profile.education!.map(
                  (item, index) => (
                    <View
                      key={`${item.institution}-${index}`}
                      style={styles.card}
                    >
                      <Text
                        style={styles.role}
                      >
                        {item.qualification ??
                          "Qualification"}
                      </Text>

                      <Text
                        style={
                          styles.company
                        }
                      >
                        {item.institution ??
                          ""}
                      </Text>

                      {!!item.field && (
                        <Text
                          style={
                            styles.bodyText
                          }
                        >
                          {item.field}
                        </Text>
                      )}

                      {!!item.description && (
                        <Text
                          style={
                            styles.bodyText
                          }
                        >
                          {item.description}
                        </Text>
                      )}
                    </View>
                  )
                )}
              </>
            )}

            {(profile.certifications ?? [])
              .length > 0 && (
              <>
                <Text
                  style={
                    styles.sectionHeading
                  }
                >
                  Certifications
                </Text>

                <View style={styles.card}>
                  {profile.certifications!.map(
                    (
                      certification,
                      index
                    ) => (
                      <Text
                        key={index}
                        style={styles.bullet}
                      >
                        •{" "}
                        {certification}
                      </Text>
                    )
                  )}
                </View>
              </>
            )}

            {(profile.projects ?? [])
              .length > 0 && (
              <>
                <Text
                  style={
                    styles.sectionHeading
                  }
                >
                  Projects
                </Text>

                {profile.projects!.map(
                  (
                    project,
                    index
                  ) => (
                    <View
                      key={`${project.name}-${index}`}
                      style={styles.card}
                    >
                      <Text
                        style={styles.role}
                      >
                        {project.name ??
                          "Project"}
                      </Text>

                      {!!project.year && (
                        <Text
                          style={
                            styles.dates
                          }
                        >
                          {project.year}
                        </Text>
                      )}

                      {!!project.description && (
                        <Text
                          style={
                            styles.bodyText
                          }
                        >
                          {
                            project.description
                          }
                        </Text>
                      )}

                      <View
                        style={
                          styles.skillWrap
                        }
                      >
                        {(
                          project.technologies ??
                          []
                        ).map(
                          (
                            tech,
                            techIndex
                          ) => (
                            <View
                              key={`${tech}-${techIndex}`}
                              style={
                                styles.skillChip
                              }
                            >
                              <Text
                                style={
                                  styles.skillText
                                }
                              >
                                {tech}
                              </Text>
                            </View>
                          )
                        )}
                      </View>
                    </View>
                  )
                )}
              </>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function getInitials(
  name?: string | null
) {
  if (!name) {
    return "?";
  }

  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) =>
      part.charAt(0).toUpperCase()
    )
    .join("");
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

  heroCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 22,
    marginBottom: 24,
  },

  initialCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: "#007AFF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },

  initialText: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "800",
  },

  name: {
    fontSize: 27,
    fontWeight: "800",
    color: "#1C1C1E",
  },

  headline: {
    marginTop: 5,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "600",
    color: "#636366",
  },

  meta: {
    marginTop: 8,
    fontSize: 14,
    color: "#8E8E93",
  },

  linkText: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: "600",
    color: "#007AFF",
  },

  sectionHeading: {
    fontSize: 21,
    fontWeight: "700",
    color: "#1C1C1E",
    marginBottom: 12,
  },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    marginBottom: 18,
  },

  bodyText: {
    fontSize: 15,
    lineHeight: 22,
    color: "#3A3A3C",
  },

  role: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1C1C1E",
  },

  company: {
    marginTop: 3,
    fontSize: 16,
    color: "#636366",
  },

  dates: {
    marginTop: 5,
    marginBottom: 7,
    fontSize: 13,
    color: "#8E8E93",
  },

  bullet: {
    marginTop: 7,
    fontSize: 15,
    lineHeight: 21,
    color: "#3A3A3C",
  },

  skillWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 8,
  },

  skillChip: {
    backgroundColor: "#EEF4FF",
    borderRadius: 20,
    paddingHorizontal: 11,
    paddingVertical: 7,
  },

  skillText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#2563EB",
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