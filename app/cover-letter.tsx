import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import * as FileSystem from "expo-file-system/legacy";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";

import {
  AlignmentType,
  Document,
  Packer,
  Paragraph,
  TextRun,
} from "docx";

import {
  fetchCoverLetter,
  fetchJobs,
  fetchProfile,
  saveCoverLetter,
} from "../src/services/api";


type JobItem = {
  id: string;
  title: string | null;
  company: string | null;
  seniority?: string | null;
  employment_type?: string | null;
  job_url?: string | null;
  key_skills?: string[];
};


type ProfileData = {
  name?: string;
  headline?: string;
  current_position?: string;
  summary?: string;

  email?: string;
  phone?: string;
  location?: string;

  contact?: {
    email?: string;
    phone?: string;
    location?: string;
  };

  skills?: any;

  experience?: any[];
  work_experience?: any[];
};


export default function CoverLetterScreen() {
  const [
    jobs,
    setJobs,
  ] = useState<JobItem[]>([]);

  const [
    profile,
    setProfile,
  ] = useState<ProfileData | null>(
    null
  );

  const [
    selectedJob,
    setSelectedJob,
  ] = useState<JobItem | null>(
    null
  );

  const [
    rolePickerOpen,
    setRolePickerOpen,
  ] = useState(false);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    exportingPdf,
    setExportingPdf,
  ] = useState(false);

  const [
    exportingWord,
    setExportingWord,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  const [
    savedMessage,
    setSavedMessage,
  ] = useState("");


  const [
    greeting,
    setGreeting,
  ] = useState(
    "Dear Hiring Manager,"
  );

  const [
    opening,
    setOpening,
  ] = useState("");

  const [
    relevantExperience,
    setRelevantExperience,
  ] = useState("");

  const [
    strengths,
    setStrengths,
  ] = useState("");

  const [
    whyCompany,
    setWhyCompany,
  ] = useState("");

  const [
    closing,
    setClosing,
  ] = useState("");


  useEffect(() => {
    loadInitialData();
  }, []);


  async function loadInitialData() {
    setLoading(true);
    setError("");

    try {
      const [
        jobsResponse,
        profileResponse,
      ] = await Promise.all([
        fetchJobs(
          undefined,
          undefined
        ),

        fetchProfile(),
      ]);

      setJobs(
        jobsResponse.jobs ??
          []
      );

      setProfile(
        profileResponse.profile ??
          null
      );
    } catch (err) {
      if (
        err instanceof
        Error
      ) {
        setError(
          err.message
        );
      } else {
        setError(
          "Could not load cover letter data."
        );
      }
    } finally {
      setLoading(false);
    }
  }


  async function selectJob(
    job: JobItem
  ) {
    setSelectedJob(job);
    setRolePickerOpen(false);
    setSavedMessage("");
    setError("");

    try {
      const existing =
        await fetchCoverLetter(
          job.id
        );

      if (existing) {
        setGreeting(
          existing.greeting ??
            "Dear Hiring Manager,"
        );

        setOpening(
          existing.opening ??
            ""
        );

        setRelevantExperience(
          existing.relevant_experience ??
            ""
        );

        setStrengths(
          existing.strengths ??
            ""
        );

        setWhyCompany(
          existing.why_company ??
            ""
        );

        setClosing(
          existing.closing ??
            ""
        );

        return;
      }

      generateTemplateForJob(
        job
      );
    } catch (err) {
      if (
        err instanceof
        Error
      ) {
        setError(
          err.message
        );
      } else {
        setError(
          "Could not load saved cover letter."
        );
      }
    }
  }


  function generateTemplateForJob(
    job: JobItem
  ) {
    const company =
      job.company ??
      "[Company]";

    const role =
      job.title ??
      "[Role]";

    const currentPosition =
      getCurrentPosition(
        profile
      );

    const skills =
      (
        job.key_skills ??
        []
      )
        .slice(0, 5)
        .join(", ");


    setGreeting(
      "Dear Hiring Manager,"
    );


    setOpening(
      `I am excited to apply for the ${role} position at ${company}. I currently work as ${currentPosition}, where I continue to build experience working with complex data, analytical problem-solving, and data-driven decision-making. Through my professional experience and analytical background, I have developed a strong technical foundation and an ability to translate complex information into actionable business insights.`
    );


    setRelevantExperience(
      `Across my professional experience, I have worked extensively with data to identify patterns, investigate business problems, and communicate findings to stakeholders. My experience across analytical, financial, and commercial environments has strengthened my ability to work with complex datasets and translate analysis into clear recommendations that support business decisions.`
    );


    setStrengths(
      skills
        ? `My technical and analytical background aligns particularly well with the role's focus on ${skills}. I have also developed strong capability in problem-solving, data visualisation, stakeholder communication, and data storytelling, ensuring that analytical findings are understandable, actionable, and aligned with business objectives.`
        : `I have developed strong capability in analytical problem-solving, data visualisation, stakeholder communication, and data storytelling. I am comfortable working with complex datasets, identifying patterns and anomalies, and communicating findings in a clear and commercially relevant way.`
    );


    setWhyCompany(
      `What particularly attracts me to ${company} is the opportunity to contribute through data-driven thinking while continuing to deepen my experience in areas relevant to the ${role} position. I believe my combination of analytical capability, commercial awareness, technical proficiency, and communication skills would allow me to contribute effectively to the team.`
    );


    setClosing(
      `I would welcome the opportunity to discuss how my skills and experience align with ${company}'s goals. Thank you for your time and consideration.`
    );
  }


  async function handleSave() {
    if (!selectedJob) {
      setError(
        "Please select a role first."
      );

      return;
    }

    setSaving(true);
    setError("");
    setSavedMessage("");

    try {
      await saveCoverLetter({
        job_id:
          selectedJob.id,

        company_name:
          selectedJob.company,

        role_title:
          selectedJob.title,

        greeting,

        opening,

        relevant_experience:
          relevantExperience,

        strengths,

        why_company:
          whyCompany,

        closing,
      });

      setSavedMessage(
        "Draft saved to Supabase."
      );
    } catch (err) {
      if (
        err instanceof
        Error
      ) {
        setError(
          err.message
        );
      } else {
        setError(
          "Could not save cover letter."
        );
      }
    } finally {
      setSaving(false);
    }
  }


  async function handleExportPdf() {
    if (!selectedJob) {
      setError(
        "Please select a role first."
      );

      return;
    }

    setExportingPdf(true);
    setError("");

    try {
      const html =
        buildCoverLetterHtml({
          profile,
          selectedJob,
          greeting,
          opening,
          relevantExperience,
          strengths,
          whyCompany,
          closing,
        });

      const {
        uri,
      } =
        await Print.printToFileAsync({
          html,
        });

      const sharingAvailable =
        await Sharing.isAvailableAsync();

      if (
        !sharingAvailable
      ) {
        throw new Error(
          "Sharing is not available on this device."
        );
      }

      await Sharing.shareAsync(
        uri,
        {
          UTI:
            "com.adobe.pdf",

          mimeType:
            "application/pdf",
        }
      );
    } catch (err) {
      if (
        err instanceof
        Error
      ) {
        setError(
          err.message
        );
      } else {
        setError(
          "Could not export PDF."
        );
      }
    } finally {
      setExportingPdf(false);
    }
  }


  async function handleExportWord() {
    if (!selectedJob) {
      setError(
        "Please select a role first."
      );

      return;
    }

    setExportingWord(true);
    setError("");

    try {
      const name =
        getProfileName(
          profile
        );

      const phone =
        getProfilePhone(
          profile
        );

      const email =
        getProfileEmail(
          profile
        );

      const location =
        getProfileLocation(
          profile
        );

      const role =
        selectedJob.title ??
        "Position";

      const company =
        selectedJob.company ??
        "";


      const contactParts =
        [
          phone
            ? `Phone: ${phone}`
            : "",

          email
            ? `Email: ${email}`
            : "",

          location,
        ].filter(Boolean);


      const contactLine =
        contactParts.join(
          "   *   "
        );


      const documentChildren:
        Paragraph[] = [];


      /*
       * NAME
       */

      documentChildren.push(
        new Paragraph({
          alignment:
            AlignmentType.CENTER,

          spacing: {
            after: 20,
          },

          children: [
            new TextRun({
              text: name,

              bold: true,

              size: 40,

              font:
                "Georgia",
            }),
          ],
        })
      );


      /*
       * TARGET ROLE
       */

      documentChildren.push(
        new Paragraph({
          alignment:
            AlignmentType.CENTER,

          spacing: {
            after: 120,
          },

          children: [
            new TextRun({
              text: role,

              italics: true,

              size: 28,

              font:
                "Georgia",
            }),
          ],
        })
      );


      /*
       * CONTACT LINE
       */

      if (contactLine) {
        documentChildren.push(
          new Paragraph({
            alignment:
              AlignmentType.CENTER,

            spacing: {
              after: 300,
            },

            children: [
              new TextRun({
                text:
                  contactLine,

                size: 19,

                font:
                  "Georgia",
              }),
            ],
          })
        );
      }


      /*
       * DATE
       */

      documentChildren.push(
        new Paragraph({
          spacing: {
            after: 180,
          },

          children: [
            new TextRun({
              text:
                formatShortDate(
                  new Date()
                ),

              size: 20,

              font:
                "Georgia",
            }),
          ],
        })
      );


      /*
       * COMPANY
       */

      documentChildren.push(
        new Paragraph({
          spacing: {
            after: 20,
          },

          children: [
            new TextRun({
              text:
                company,

              bold: true,

              size: 20,

              font:
                "Georgia",
            }),
          ],
        })
      );


      /*
       * HUMAN RESOURCES
       */

      documentChildren.push(
        new Paragraph({
          spacing: {
            after: 220,
          },

          children: [
            new TextRun({
              text:
                "Human Resources",

              italics: true,

              size: 20,

              font:
                "Georgia",
            }),
          ],
        })
      );


      /*
       * GREETING
       */

      if (
        greeting.trim()
      ) {
        documentChildren.push(
          new Paragraph({
            spacing: {
              after: 220,
            },

            children: [
              new TextRun({
                text:
                  greeting.trim(),

                size: 21,

                font:
                  "Georgia",
              }),
            ],
          })
        );
      }


      /*
       * BODY PARAGRAPHS
       */

      const bodySections =
        [
          opening,
          relevantExperience,
          strengths,
          whyCompany,
          closing,
        ];


      bodySections.forEach(
        (
          section
        ) => {
          if (
            !section.trim()
          ) {
            return;
          }

          documentChildren.push(
            new Paragraph({
              spacing: {
                after: 220,

                line: 290,
              },

              children: [
                new TextRun({
                  text:
                    section.trim(),

                  size: 20,

                  font:
                    "Arial",
                }),
              ],
            })
          );
        }
      );


      /*
       * SIGNATURE
       */

      documentChildren.push(
        new Paragraph({
          spacing: {
            before: 80,

            after: 180,
          },

          children: [
            new TextRun({
              text:
                "Sincerely,",

              size: 20,

              font:
                "Georgia",
            }),
          ],
        })
      );


      documentChildren.push(
        new Paragraph({
          children: [
            new TextRun({
              text:
                name,

              size: 20,

              font:
                "Georgia",
            }),
          ],
        })
      );


      const doc =
        new Document({
          sections: [
            {
              properties: {
                page: {
                  margin: {
                    top: 800,
                    right: 950,
                    bottom: 800,
                    left: 950,
                  },
                },
              },

              children:
                documentChildren,
            },
          ],
        });


      const base64 =
        await Packer.toBase64String(
          doc
        );


      const safeCompany =
        sanitizeFileName(
          company ||
            "Company"
        );

      const safeRole =
        sanitizeFileName(
          role
        );


      const fileName =
        `Cover_Letter_${safeCompany}_${safeRole}.docx`;


      const fileUri =
        `${FileSystem.cacheDirectory}${fileName}`;


      await FileSystem.writeAsStringAsync(
        fileUri,
        base64,
        {
          encoding:
            FileSystem.EncodingType
              .Base64,
        }
      );


      const sharingAvailable =
        await Sharing.isAvailableAsync();


      if (
        !sharingAvailable
      ) {
        throw new Error(
          "Sharing is not available on this device."
        );
      }


      await Sharing.shareAsync(
        fileUri,
        {
          UTI:
            "org.openxmlformats.wordprocessingml.document",

          mimeType:
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        }
      );
    } catch (err) {
      if (
        err instanceof
        Error
      ) {
        setError(
          err.message
        );
      } else {
        setError(
          "Could not export Word document."
        );
      }
    } finally {
      setExportingWord(false);
    }
  }


  const previewSections =
    useMemo(
      () =>
        [
          opening,
          relevantExperience,
          strengths,
          whyCompany,
          closing,
        ].filter(
          (
            section
          ) =>
            section
              .trim()
              .length >
            0
        ),
      [
        opening,
        relevantExperience,
        strengths,
        whyCompany,
        closing,
      ]
    );


  const wordCount =
    useMemo(() => {
      const text =
        [
          greeting,
          ...previewSections,
        ]
          .join(" ")
          .trim();

      if (!text) {
        return 0;
      }

      return text
        .split(/\s+/)
        .length;
    }, [
      greeting,
      previewSections,
    ]);


  if (loading) {
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
            Loading cover letter…
          </Text>
        </View>
      </SafeAreaView>
    );
  }


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
        keyboardShouldPersistTaps="handled"
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
          Cover Letter
        </Text>

        <Text
          style={
            styles.subtitle
          }
        >
          Build, edit and export a
          tailored cover letter for
          any saved role.
        </Text>


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


        {!!savedMessage && (
          <View
            style={
              styles.successCard
            }
          >
            <Text
              style={
                styles.successText
              }
            >
              {savedMessage}
            </Text>
          </View>
        )}


        {/* -------------------------
            SECTION 1
        ------------------------- */}

        <View
          style={
            styles.sectionHeader
          }
        >
          <View
            style={
              styles.stepCircle
            }
          >
            <Text
              style={
                styles.stepText
              }
            >
              1
            </Text>
          </View>

          <View>
            <Text
              style={
                styles.sectionHeading
              }
            >
              Select Role
            </Text>

            <Text
              style={
                styles.sectionDescription
              }
            >
              Choose a saved job.
            </Text>
          </View>
        </View>


        <View
          style={
            styles.card
          }
        >
          <TouchableOpacity
            style={
              styles.roleSelector
            }
            onPress={() =>
              setRolePickerOpen(
                !rolePickerOpen
              )
            }
          >
            <View
              style={{
                flex: 1,
              }}
            >
              <Text
                style={
                  styles.fieldLabel
                }
              >
                Role
              </Text>

              <Text
                style={
                  selectedJob
                    ? styles.roleValue
                    : styles.placeholder
                }
              >
                {selectedJob
                  ? `${selectedJob.title ?? "Untitled"} — ${selectedJob.company ?? "Unknown company"}`
                  : "Select a role"}
              </Text>
            </View>

            <Text
              style={
                styles.chevron
              }
            >
              {rolePickerOpen
                ? "⌃"
                : "⌄"}
            </Text>
          </TouchableOpacity>


          {rolePickerOpen && (
            <View
              style={
                styles.roleDropdown
              }
            >
              {jobs.length ===
              0 ? (
                <Text
                  style={
                    styles.emptyText
                  }
                >
                  No jobs available.
                </Text>
              ) : (
                jobs.map(
                  (
                    job
                  ) => (
                    <TouchableOpacity
                      key={
                        job.id
                      }
                      style={
                        styles.roleOption
                      }
                      onPress={() =>
                        selectJob(
                          job
                        )
                      }
                    >
                      <Text
                        style={
                          styles.roleOptionTitle
                        }
                      >
                        {job.title ??
                          "Untitled role"}
                      </Text>

                      <Text
                        style={
                          styles.roleOptionCompany
                        }
                      >
                        {job.company ??
                          "Unknown company"}
                      </Text>
                    </TouchableOpacity>
                  )
                )
              )}
            </View>
          )}


          {selectedJob && (
            <>
              <View
                style={
                  styles.divider
                }
              />

              <Text
                style={
                  styles.fieldLabel
                }
              >
                Company
              </Text>

              <Text
                style={
                  styles.autoValue
                }
              >
                {selectedJob.company ??
                  "Unknown company"}
              </Text>


              <Text
                style={[
                  styles.fieldLabel,
                  {
                    marginTop:
                      16,
                  },
                ]}
              >
                Role title
              </Text>

              <Text
                style={
                  styles.autoValue
                }
              >
                {selectedJob.title ??
                  "Untitled role"}
              </Text>


              <Text
                style={[
                  styles.fieldLabel,
                  {
                    marginTop:
                      16,
                  },
                ]}
              >
                Key skills identified
              </Text>

              <View
                style={
                  styles.skillsWrap
                }
              >
                {(
                  selectedJob.key_skills ??
                  []
                )
                  .slice(
                    0,
                    5
                  )
                  .map(
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

                {(
                  selectedJob.key_skills ??
                  []
                ).length ===
                  0 && (
                  <Text
                    style={
                      styles.noSkillsText
                    }
                  >
                    No key skills stored
                    for this role.
                  </Text>
                )}
              </View>
            </>
          )}
        </View>


        {/* -------------------------
            SECTION 2
        ------------------------- */}

        <View
          style={
            styles.sectionHeader
          }
        >
          <View
            style={
              styles.stepCircle
            }
          >
            <Text
              style={
                styles.stepText
              }
            >
              2
            </Text>
          </View>

          <View>
            <Text
              style={
                styles.sectionHeading
              }
            >
              Edit Template
            </Text>

            <Text
              style={
                styles.sectionDescription
              }
            >
              Every section is editable.
            </Text>
          </View>
        </View>


        <View
          style={
            styles.card
          }
        >
          <EditableSection
            label="Greeting"
            value={
              greeting
            }
            onChangeText={
              setGreeting
            }
            small
          />

          <EditableSection
            label="Opening / Current Position"
            value={
              opening
            }
            onChangeText={
              setOpening
            }
          />

          <EditableSection
            label="Relevant Experience"
            value={
              relevantExperience
            }
            onChangeText={
              setRelevantExperience
            }
          />

          <EditableSection
            label="Technical + Analytical Strengths"
            value={
              strengths
            }
            onChangeText={
              setStrengths
            }
          />

          <EditableSection
            label="Why This Company / Role"
            value={
              whyCompany
            }
            onChangeText={
              setWhyCompany
            }
          />

          <EditableSection
            label="Closing"
            value={
              closing
            }
            onChangeText={
              setClosing
            }
          />


          <TouchableOpacity
            style={[
              styles.saveButton,

              !selectedJob &&
                styles.buttonDisabled,
            ]}
            disabled={
              !selectedJob ||
              saving
            }
            onPress={
              handleSave
            }
          >
            {saving ? (
              <ActivityIndicator
                color="#FFFFFF"
              />
            ) : (
              <Text
                style={
                  styles.saveButtonText
                }
              >
                Save Draft
              </Text>
            )}
          </TouchableOpacity>
        </View>


        {/* -------------------------
            SECTION 3
        ------------------------- */}

        <View
          style={
            styles.sectionHeader
          }
        >
          <View
            style={
              styles.stepCircle
            }
          >
            <Text
              style={
                styles.stepText
              }
            >
              3
            </Text>
          </View>

          <View>
            <Text
              style={
                styles.sectionHeading
              }
            >
              Preview
            </Text>

            <Text
              style={
                styles.sectionDescription
              }
            >
              Vively-style final layout.
            </Text>
          </View>
        </View>


        <View
          style={
            styles.previewPaper
          }
        >
          <Text
            style={
              styles.previewName
            }
          >
            {getProfileName(
              profile
            )}
          </Text>


          <Text
            style={
              styles.previewTargetRole
            }
          >
            {selectedJob?.title ??
              "Target Role"}
          </Text>


          <Text
            style={
              styles.previewContact
            }
          >
            {buildContactLine(
              profile
            )}
          </Text>


          <View
            style={
              styles.previewMeta
            }
          >
            <Text
              style={
                styles.previewMetaText
              }
            >
              {formatShortDate(
                new Date()
              )}
            </Text>


            {!!selectedJob && (
              <>
                <Text
                  style={
                    styles.previewCompany
                  }
                >
                  {
                    selectedJob.company
                  }
                </Text>

                <Text
                  style={
                    styles.previewHr
                  }
                >
                  Human Resources
                </Text>
              </>
            )}
          </View>


          <Text
            style={
              styles.previewGreeting
            }
          >
            {greeting}
          </Text>


          {previewSections.map(
            (
              section,
              index
            ) => (
              <Text
                key={
                  index
                }
                style={
                  styles.previewParagraph
                }
              >
                {section}
              </Text>
            )
          )}


          <Text
            style={
              styles.previewSignature
            }
          >
            Sincerely,
          </Text>

          <Text
            style={
              styles.previewSignatureName
            }
          >
            {getProfileName(
              profile
            )}
          </Text>


          <Text
            style={
              styles.wordCount
            }
          >
            {wordCount} words
          </Text>
        </View>


        {/* -------------------------
            EXPORT
        ------------------------- */}

        <View
          style={
            styles.exportRow
          }
        >
          <TouchableOpacity
            style={[
              styles.exportButton,
              styles.wordButton,

              !selectedJob &&
                styles.buttonDisabled,
            ]}
            disabled={
              !selectedJob ||
              exportingWord
            }
            onPress={
              handleExportWord
            }
          >
            {exportingWord ? (
              <ActivityIndicator
                color="#007AFF"
              />
            ) : (
              <Text
                style={
                  styles.wordButtonText
                }
              >
                Download Word
              </Text>
            )}
          </TouchableOpacity>


          <TouchableOpacity
            style={[
              styles.exportButton,
              styles.pdfButton,

              !selectedJob &&
                styles.buttonDisabled,
            ]}
            disabled={
              !selectedJob ||
              exportingPdf
            }
            onPress={
              handleExportPdf
            }
          >
            {exportingPdf ? (
              <ActivityIndicator
                color="#FFFFFF"
              />
            ) : (
              <Text
                style={
                  styles.pdfButtonText
                }
              >
                Download PDF
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}


/*
 * EDITABLE SECTION
 */

function EditableSection({
  label,
  value,
  onChangeText,
  small = false,
}: {
  label: string;

  value: string;

  onChangeText: (
    value: string
  ) => void;

  small?: boolean;
}) {
  return (
    <View
      style={
        styles.editSection
      }
    >
      <Text
        style={
          styles.editLabel
        }
      >
        {label}
      </Text>

      <TextInput
        value={
          value
        }
        onChangeText={
          onChangeText
        }
        multiline
        textAlignVertical="top"
        style={[
          styles.textInput,

          small &&
            styles.smallInput,
        ]}
        placeholder={`Enter ${label.toLowerCase()}...`}
        placeholderTextColor="#AEAEB2"
      />
    </View>
  );
}


/*
 * PDF HTML
 *
 * Mirrors the 2025 cover-letter layout:
 * centred name,
 * centred italic role,
 * contact line,
 * date,
 * company,
 * Human Resources,
 * letter body,
 * signature.
 */

function buildCoverLetterHtml({
  profile,
  selectedJob,
  greeting,
  opening,
  relevantExperience,
  strengths,
  whyCompany,
  closing,
}: {
  profile:
    ProfileData | null;

  selectedJob:
    JobItem;

  greeting:
    string;

  opening:
    string;

  relevantExperience:
    string;

  strengths:
    string;

  whyCompany:
    string;

  closing:
    string;
}) {
  const name =
    escapeHtml(
      getProfileName(
        profile
      )
    );

  const email =
    escapeHtml(
      getProfileEmail(
        profile
      )
    );

  const phone =
    escapeHtml(
      getProfilePhone(
        profile
      )
    );

  const location =
    escapeHtml(
      getProfileLocation(
        profile
      )
    );

  const role =
    escapeHtml(
      selectedJob.title ??
        "Position"
    );

  const company =
    escapeHtml(
      selectedJob.company ??
        ""
    );


  const contactParts =
    [
      phone
        ? `Phone: ${phone}`
        : "",

      email
        ? `Email: <span class="email">${email}</span>`
        : "",

      location,
    ].filter(Boolean);


  const contactLine =
    contactParts.join(
      ` <span class="separator">*</span> `
    );


  const bodySections =
    [
      opening,
      relevantExperience,
      strengths,
      whyCompany,
      closing,
    ]
      .filter(
        (
          section
        ) =>
          section
            .trim()
            .length >
          0
      )
      .map(
        (
          section
        ) =>
          `<p>${escapeHtml(
            section.trim()
          )}</p>`
      )
      .join("");


  return `
<!DOCTYPE html>

<html>

<head>

<meta charset="utf-8" />

<style>

@page {
  size: A4;
  margin: 18mm 23mm 18mm 23mm;
}

html,
body {
  margin: 0;
  padding: 0;
}

body {
  color: #111111;

  font-family:
    Arial,
    Helvetica,
    sans-serif;

  font-size: 10.5pt;

  line-height: 1.42;
}

.header {
  text-align: center;

  margin-bottom: 22px;
}

.name {
  font-family:
    Georgia,
    "Times New Roman",
    serif;

  font-size: 24pt;

  font-weight: 700;

  line-height: 1.05;

  margin-bottom: 4px;
}

.role {
  font-family:
    Georgia,
    "Times New Roman",
    serif;

  font-size: 16pt;

  font-style: italic;

  line-height: 1.1;

  margin-bottom: 13px;
}

.contact {
  font-family:
    Georgia,
    "Times New Roman",
    serif;

  font-size: 9.5pt;

  white-space: nowrap;
}

.separator {
  margin:
    0 7px;
}

.email {
  color: #0066cc;

  text-decoration: underline;
}

.meta {
  font-family:
    Georgia,
    "Times New Roman",
    serif;

  font-size: 10pt;

  margin-top: 5px;
}

.date {
  margin-bottom: 16px;
}

.company {
  font-weight: 700;
}

.hr {
  font-style: italic;

  margin-top: 1px;

  margin-bottom: 18px;
}

.greeting {
  font-family:
    Georgia,
    "Times New Roman",
    serif;

  font-size: 10.5pt;

  margin-bottom: 17px;
}

.body {
  font-family:
    Arial,
    Helvetica,
    sans-serif;
}

.body p {
  margin:
    0 0 14px 0;

  orphans: 3;
  widows: 3;
}

.signature {
  font-family:
    Georgia,
    "Times New Roman",
    serif;

  font-size: 10.5pt;

  margin-top: 18px;
}

.signature-name {
  margin-top: 14px;
}

</style>

</head>


<body>


<div class="header">

  <div class="name">
    ${name}
  </div>

  <div class="role">
    ${role}
  </div>

  ${
    contactLine
      ? `
        <div class="contact">
          ${contactLine}
        </div>
      `
      : ""
  }

</div>


<div class="meta">

  <div class="date">
    ${escapeHtml(
      formatShortDate(
        new Date()
      )
    )}
  </div>

  <div class="company">
    ${company}
  </div>

  <div class="hr">
    Human Resources
  </div>

</div>


<div class="greeting">
  ${escapeHtml(
    greeting
  )}
</div>


<div class="body">
  ${bodySections}
</div>


<div class="signature">

  <div>
    Sincerely,
  </div>

  <div class="signature-name">
    ${name}
  </div>

</div>


</body>

</html>
`;
}


/*
 * PROFILE HELPERS
 */

function getProfileName(
  profile:
    ProfileData | null
) {
  return (
    profile?.name ??
    "Your Name"
  );
}


function getProfileEmail(
  profile:
    ProfileData | null
) {
  return (
    profile?.email ??
    profile?.contact?.email ??
    ""
  );
}


function getProfilePhone(
  profile:
    ProfileData | null
) {
  return (
    profile?.phone ??
    profile?.contact?.phone ??
    ""
  );
}


function getProfileLocation(
  profile:
    ProfileData | null
) {
  return (
    profile?.location ??
    profile?.contact?.location ??
    ""
  );
}


function buildContactLine(
  profile:
    ProfileData | null
) {
  const phone =
    getProfilePhone(
      profile
    );

  const email =
    getProfileEmail(
      profile
    );

  const location =
    getProfileLocation(
      profile
    );

  return [
    phone
      ? `Phone: ${phone}`
      : "",

    email
      ? `Email: ${email}`
      : "",

    location,
  ]
    .filter(Boolean)
    .join(
      "   *   "
    );
}


function getCurrentPosition(
  profile:
    ProfileData | null
) {
  if (
    profile?.current_position
  ) {
    return profile.current_position;
  }


  if (
    profile?.headline
  ) {
    return profile.headline;
  }


  const experience =
    profile?.experience ??
    profile?.work_experience ??
    [];


  if (
    Array.isArray(
      experience
    ) &&
    experience.length >
      0
  ) {
    const first =
      experience[0];


    const title =
      first?.title ??
      first?.role ??
      first?.position;


    const company =
      first?.company ??
      first?.organisation ??
      first?.organization;


    if (
      title &&
      company
    ) {
      return `${title} at ${company}`;
    }


    if (title) {
      return title;
    }
  }


  return "[Current Position]";
}


/*
 * DATE
 */

function formatShortDate(
  date:
    Date
) {
  const day =
    String(
      date.getDate()
    ).padStart(
      2,
      "0"
    );

  const month =
    String(
      date.getMonth() +
        1
    ).padStart(
      2,
      "0"
    );

  const year =
    String(
      date.getFullYear()
    ).slice(
      -2
    );

  return `${day}/${month}/${year}`;
}


/*
 * FILE NAME
 */

function sanitizeFileName(
  value:
    string
) {
  return value
    .replace(
      /[^a-zA-Z0-9]+/g,
      "_"
    )
    .replace(
      /^_+|_+$/g,
      ""
    );
}


/*
 * HTML SAFETY
 */

function escapeHtml(
  value:
    string
) {
  return value
    .replace(
      /&/g,
      "&amp;"
    )
    .replace(
      /</g,
      "&lt;"
    )
    .replace(
      />/g,
      "&gt;"
    )
    .replace(
      /"/g,
      "&quot;"
    )
    .replace(
      /'/g,
      "&#039;"
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
      padding: 20,

      paddingBottom:
        80,
    },


    loadingContainer: {
      flex: 1,

      alignItems:
        "center",

      justifyContent:
        "center",
    },


    loadingText: {
      marginTop:
        12,

      color:
        "#636366",
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
        26,

      color:
        "#636366",

      fontSize:
        16,

      lineHeight:
        23,
    },


    sectionHeader: {
      flexDirection:
        "row",

      alignItems:
        "center",

      gap: 12,

      marginBottom:
        12,

      marginTop:
        4,
    },


    stepCircle: {
      width:
        34,

      height:
        34,

      borderRadius:
        17,

      backgroundColor:
        "#007AFF",

      alignItems:
        "center",

      justifyContent:
        "center",
    },


    stepText: {
      color:
        "#FFFFFF",

      fontSize:
        14,

      fontWeight:
        "800",
    },


    sectionHeading: {
      fontSize:
        20,

      fontWeight:
        "800",

      color:
        "#1C1C1E",
    },


    sectionDescription: {
      marginTop:
        2,

      fontSize:
        12,

      color:
        "#8E8E93",
    },


    card: {
      backgroundColor:
        "#FFFFFF",

      borderRadius:
        20,

      padding: 18,

      marginBottom:
        28,
    },


    roleSelector: {
      flexDirection:
        "row",

      alignItems:
        "center",

      backgroundColor:
        "#F7F7F8",

      borderRadius:
        14,

      padding: 14,
    },


    fieldLabel: {
      fontSize:
        11,

      color:
        "#8E8E93",

      marginBottom:
        5,

      fontWeight:
        "600",
    },


    roleValue: {
      fontSize:
        15,

      fontWeight:
        "700",

      color:
        "#1C1C1E",
    },


    placeholder: {
      fontSize:
        15,

      color:
        "#AEAEB2",
    },


    chevron: {
      fontSize:
        20,

      color:
        "#636366",

      marginLeft:
        12,
    },


    roleDropdown: {
      marginTop:
        8,

      borderRadius:
        14,

      backgroundColor:
        "#F7F7F8",

      overflow:
        "hidden",
    },


    roleOption: {
      padding: 14,

      borderBottomWidth:
        StyleSheet.hairlineWidth,

      borderBottomColor:
        "#D1D1D6",
    },


    roleOptionTitle: {
      fontSize:
        14,

      fontWeight:
        "700",

      color:
        "#1C1C1E",
    },


    roleOptionCompany: {
      marginTop:
        3,

      fontSize:
        12,

      color:
        "#8E8E93",
    },


    divider: {
      height:
        StyleSheet.hairlineWidth,

      backgroundColor:
        "#D1D1D6",

      marginVertical:
        18,
    },


    autoValue: {
      fontSize:
        15,

      fontWeight:
        "600",

      color:
        "#1C1C1E",
    },


    skillsWrap: {
      flexDirection:
        "row",

      flexWrap:
        "wrap",

      gap: 7,

      marginTop:
        4,
    },


    skillChip: {
      backgroundColor:
        "#EEF4FF",

      paddingHorizontal:
        10,

      paddingVertical:
        6,

      borderRadius:
        14,
    },


    skillText: {
      color:
        "#2563EB",

      fontSize:
        12,

      fontWeight:
        "600",
    },


    noSkillsText: {
      color:
        "#8E8E93",

      fontSize:
        12,
    },


    editSection: {
      marginBottom:
        18,
    },


    editLabel: {
      fontSize:
        13,

      fontWeight:
        "700",

      color:
        "#3A3A3C",

      marginBottom:
        7,
    },


    textInput: {
      minHeight:
        120,

      backgroundColor:
        "#F7F7F8",

      borderRadius:
        14,

      padding:
        14,

      color:
        "#1C1C1E",

      fontSize:
        14,

      lineHeight:
        21,
    },


    smallInput: {
      minHeight:
        52,
    },


    saveButton: {
      backgroundColor:
        "#007AFF",

      borderRadius:
        14,

      paddingVertical:
        14,

      alignItems:
        "center",

      marginTop:
        4,
    },


    saveButtonText: {
      color:
        "#FFFFFF",

      fontSize:
        15,

      fontWeight:
        "700",
    },


    buttonDisabled: {
      opacity:
        0.4,
    },


    /*
     * COVER LETTER PREVIEW
     */

    previewPaper: {
      backgroundColor:
        "#FFFFFF",

      borderRadius:
        18,

      paddingHorizontal:
        20,

      paddingTop:
        24,

      paddingBottom:
        20,

      marginBottom:
        14,
    },


    previewName: {
      textAlign:
        "center",

      color:
        "#111111",

      fontSize:
        25,

      lineHeight:
        29,

      fontWeight:
        "700",

      fontFamily:
        "Georgia",
    },


    previewTargetRole: {
      textAlign:
        "center",

      color:
        "#111111",

      fontSize:
        17,

      lineHeight:
        21,

      fontStyle:
        "italic",

      fontFamily:
        "Georgia",

      marginTop:
        2,
    },


    previewContact: {
      textAlign:
        "center",

      color:
        "#333333",

      fontSize:
        9,

      lineHeight:
        14,

      fontFamily:
        "Georgia",

      marginTop:
        12,

      marginBottom:
        25,
    },


    previewMeta: {
      marginBottom:
        19,
    },


    previewMetaText: {
      color:
        "#111111",

      fontSize:
        11,

      fontFamily:
        "Georgia",

      marginBottom:
        16,
    },


    previewCompany: {
      color:
        "#111111",

      fontSize:
        11,

      fontWeight:
        "700",

      fontFamily:
        "Georgia",
    },


    previewHr: {
      color:
        "#111111",

      fontSize:
        11,

      fontStyle:
        "italic",

      fontFamily:
        "Georgia",

      marginTop:
        1,
    },


    previewGreeting: {
      color:
        "#111111",

      fontSize:
        11,

      lineHeight:
        17,

      fontFamily:
        "Georgia",

      marginBottom:
        17,
    },


    previewParagraph: {
      color:
        "#111111",

      fontSize:
        11,

      lineHeight:
        17,

      marginBottom:
        15,
    },


    previewSignature: {
      color:
        "#111111",

      fontSize:
        11,

      fontFamily:
        "Georgia",

      marginTop:
        3,
    },


    previewSignatureName: {
      color:
        "#111111",

      fontSize:
        11,

      fontFamily:
        "Georgia",

      marginTop:
        15,
    },


    wordCount: {
      textAlign:
        "right",

      color:
        "#8E8E93",

      fontSize:
        10,

      marginTop:
        22,
    },


    /*
     * EXPORT
     */

    exportRow: {
      flexDirection:
        "row",

      gap: 10,

      marginBottom:
        30,
    },


    exportButton: {
      flex: 1,

      borderRadius:
        14,

      paddingVertical:
        14,

      alignItems:
        "center",

      justifyContent:
        "center",

      minHeight:
        50,
    },


    wordButton: {
      backgroundColor:
        "#FFFFFF",

      borderWidth:
        1,

      borderColor:
        "#007AFF",
    },


    wordButtonText: {
      color:
        "#007AFF",

      fontWeight:
        "700",

      fontSize:
        14,
    },


    pdfButton: {
      backgroundColor:
        "#007AFF",
    },


    pdfButtonText: {
      color:
        "#FFFFFF",

      fontWeight:
        "700",

      fontSize:
        14,
    },


    /*
     * MESSAGES
     */

    errorCard: {
      backgroundColor:
        "#FFF1F0",

      borderRadius:
        14,

      padding: 14,

      marginBottom:
        18,
    },


    errorText: {
      color:
        "#B42318",
    },


    successCard: {
      backgroundColor:
        "#ECFDF3",

      borderRadius:
        14,

      padding: 14,

      marginBottom:
        18,
    },


    successText: {
      color:
        "#027A48",

      fontWeight:
        "600",
    },


    emptyText: {
      color:
        "#8E8E93",

      padding: 14,

      textAlign:
        "center",
    },
  });