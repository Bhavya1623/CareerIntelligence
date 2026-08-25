import React, {
  useState,
} from "react";

import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import {
  fetchAndAnalyseJob,
  saveManualJob,
  saveReviewedJob,
} from "../src/services/api";


type KeywordItem = {
  keyword: string;
  category: string;
  importance: string;
};


type JobDraft = {
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
    boolean;

  contract_length:
    string | null;

  years_experience:
    number | null;

  raw_job_description:
    string;

  source:
    string | null;

  job_url:
    string | null;

  keywords:
    KeywordItem[];
};


export default function AddJobScreen() {
  /*
   * =================================
   * URL FLOW
   * =================================
   */

  const [
    jobUrl,
    setJobUrl,
  ] = useState("");


  const [
    analysing,
    setAnalysing,
  ] = useState(false);


  const [
    savingDraft,
    setSavingDraft,
  ] = useState(false);


  const [
    draft,
    setDraft,
  ] =
    useState<JobDraft | null>(
      null
    );


  /*
   * =================================
   * REVIEW FIELDS
   * =================================
   */

  const [
    reviewTitle,
    setReviewTitle,
  ] = useState("");


  const [
    reviewCompany,
    setReviewCompany,
  ] = useState("");


  const [
    reviewLocation,
    setReviewLocation,
  ] = useState("");


  const [
    reviewSeniority,
    setReviewSeniority,
  ] = useState("");


  const [
    reviewEmploymentType,
    setReviewEmploymentType,
  ] = useState("");


  const [
    reviewIsContract,
    setReviewIsContract,
  ] = useState(false);


  const [
    reviewContractLength,
    setReviewContractLength,
  ] = useState("");


  const [
    reviewYears,
    setReviewYears,
  ] = useState("");


  /*
   * This is the concise
   * AI-generated role description.
   */

  const [
    reviewDescription,
    setReviewDescription,
  ] = useState("");


  const [
    reviewKeywords,
    setReviewKeywords,
  ] = useState<
    KeywordItem[]
  >([]);


  const [
    newKeyword,
    setNewKeyword,
  ] = useState("");


  /*
   * =================================
   * MANUAL FLOW
   * =================================
   */

  const [
    manualOpen,
    setManualOpen,
  ] = useState(false);


  const [
    manualSaving,
    setManualSaving,
  ] = useState(false);


  const [
    manualTitle,
    setManualTitle,
  ] = useState("");


  const [
    manualCompany,
    setManualCompany,
  ] = useState("");


  const [
    manualLocation,
    setManualLocation,
  ] = useState("");


  const [
    manualEmploymentType,
    setManualEmploymentType,
  ] = useState("");


  const [
    manualSeniority,
    setManualSeniority,
  ] = useState("");


  const [
    manualIsContract,
    setManualIsContract,
  ] = useState(false);


  const [
    manualContractLength,
    setManualContractLength,
  ] = useState("");


  const [
    manualYearsExperience,
    setManualYearsExperience,
  ] = useState("");


  const [
    manualSummary,
    setManualSummary,
  ] = useState("");


  const [
    manualDescription,
    setManualDescription,
  ] = useState("");


  const [
    manualKeywords,
    setManualKeywords,
  ] = useState("");


  /*
   * =================================
   * MESSAGES
   * =================================
   */

  const [
    error,
    setError,
  ] = useState("");


  const [
    success,
    setSuccess,
  ] = useState("");


  /*
   * =================================
   * ANALYSE URL
   * =================================
   */

  async function handleAnalyse() {
    const cleanedUrl =
      jobUrl.trim();


    if (!cleanedUrl) {
      setError(
        "Enter a job URL first."
      );

      return;
    }


    setAnalysing(true);

    setError("");

    setSuccess("");

    setDraft(null);


    Keyboard.dismiss();


    try {
      const result =
        await fetchAndAnalyseJob(
          cleanedUrl
        );


      const analysed:
        JobDraft =
        result.draft;


      setDraft(
        analysed
      );


      setReviewTitle(
        analysed.title ??
          ""
      );


      setReviewCompany(
        analysed.company ??
          ""
      );


      setReviewLocation(
        analysed.location ??
          ""
      );


      setReviewSeniority(
        analysed.seniority ??
          ""
      );


      setReviewEmploymentType(
        analysed.employment_type ??
          ""
      );


      setReviewIsContract(
        analysed.is_contract ??
          false
      );


      setReviewContractLength(
        analysed.contract_length ??
          ""
      );


      setReviewYears(
        analysed.years_experience !==
          null &&
          analysed.years_experience !==
            undefined
          ? String(
              analysed.years_experience
            )
          : ""
      );


      /*
       * This now receives ONLY
       * the AI-generated 2–3
       * point role description.
       */

      setReviewDescription(
        analysed.raw_job_description ??
          analysed.summary ??
          ""
      );


      setReviewKeywords(
        analysed.keywords ??
          []
      );


      setSuccess(
        "Analysis complete. Review the fields before saving."
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
          "Could not analyse job."
        );
      }
    } finally {
      setAnalysing(false);
    }
  }


  /*
   * =================================
   * SAVE REVIEWED JOB
   * =================================
   */

  async function handleSaveReviewed() {
    if (!draft) {
      return;
    }


    setError("");

    setSuccess("");


    if (
      !reviewTitle.trim()
    ) {
      setError(
        "Role title is required."
      );

      return;
    }


    if (
      !reviewCompany.trim()
    ) {
      setError(
        "Company is required."
      );

      return;
    }


    if (
      !reviewDescription.trim()
    ) {
      setError(
        "Role description is required."
      );

      return;
    }


    let years:
      number | null =
      null;


    if (
      reviewYears.trim()
    ) {
      years =
        Number(
          reviewYears
        );


      if (
        Number.isNaN(
          years
        ) ||
        years < 0
      ) {
        setError(
          "Years experience must be a valid number."
        );

        return;
      }
    }


    setSavingDraft(true);


    try {
      await saveReviewedJob({
        title:
          reviewTitle,

        company:
          reviewCompany,

        location:
          reviewLocation,

        /*
         * Summary and description
         * use the reviewed AI
         * role summary.
         */

        summary:
          reviewDescription,

        seniority:
          reviewSeniority,

        employment_type:
          reviewEmploymentType,

        is_contract:
          reviewIsContract,

        contract_length:
          reviewContractLength,

        years_experience:
          years,

        raw_job_description:
          reviewDescription,

        source:
          draft.source,

        job_url:
          draft.job_url,

        keywords:
          reviewKeywords,
      });


      setSuccess(
        "Job saved successfully."
      );


      resetUrlFlow();
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
          "Could not save job."
        );
      }
    } finally {
      setSavingDraft(false);
    }
  }


  /*
   * =================================
   * REVIEW KEYWORDS
   * =================================
   */

  function addReviewKeyword() {
    const cleaned =
      newKeyword.trim();


    if (!cleaned) {
      return;
    }


    const exists =
      reviewKeywords.some(
        (item) =>
          item.keyword
            .trim()
            .toLowerCase() ===
          cleaned.toLowerCase()
      );


    if (!exists) {
      setReviewKeywords(
        [
          ...reviewKeywords,

          {
            keyword:
              cleaned,

            category:
              "other",

            importance:
              "medium",
          },
        ]
      );
    }


    setNewKeyword("");
  }


  function removeReviewKeyword(
    index: number
  ) {
    setReviewKeywords(
      reviewKeywords.filter(
        (
          _,
          itemIndex
        ) =>
          itemIndex !==
          index
      )
    );
  }


  /*
   * =================================
   * RESET URL FLOW
   * =================================
   */

  function resetUrlFlow() {
    setJobUrl("");

    setDraft(null);

    setReviewTitle("");

    setReviewCompany("");

    setReviewLocation("");

    setReviewSeniority("");

    setReviewEmploymentType("");

    setReviewIsContract(false);

    setReviewContractLength("");

    setReviewYears("");

    setReviewDescription("");

    setReviewKeywords([]);

    setNewKeyword("");
  }


  /*
   * =================================
   * MANUAL SAVE
   * =================================
   */

  async function handleSaveManual() {
    setError("");

    setSuccess("");


    if (
      !manualTitle.trim()
    ) {
      setError(
        "Role title is required."
      );

      return;
    }


    if (
      !manualCompany.trim()
    ) {
      setError(
        "Company is required."
      );

      return;
    }


    if (
      !manualDescription.trim()
    ) {
      setError(
        "Role description is required."
      );

      return;
    }


    const years =
      manualYearsExperience.trim()
        ? Number(
            manualYearsExperience
          )
        : null;


    if (
      years !== null &&
      (
        Number.isNaN(
          years
        ) ||
        years < 0
      )
    ) {
      setError(
        "Years experience must be valid."
      );

      return;
    }


    const parsedKeywords =
      manualKeywords
        .split(",")
        .map(
          (item) =>
            item.trim()
        )
        .filter(Boolean);


    setManualSaving(true);


    try {
      await saveManualJob({
        title:
          manualTitle,

        company:
          manualCompany,

        location:
          manualLocation,

        /*
         * If a separate manual
         * summary was supplied,
         * use it.
         *
         * Otherwise use the
         * description.
         */

        summary:
          manualSummary.trim() ||
          manualDescription,

        seniority:
          manualSeniority,

        employment_type:
          manualEmploymentType,

        is_contract:
          manualIsContract,

        contract_length:
          manualContractLength,

        years_experience:
          years,

        raw_job_description:
          manualDescription,

        keywords:
          parsedKeywords,
      });


      setSuccess(
        "Manual role saved successfully."
      );


      resetManual();

      setManualOpen(false);
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
          "Could not save manual role."
        );
      }
    } finally {
      setManualSaving(false);
    }
  }


  /*
   * =================================
   * RESET MANUAL
   * =================================
   */

  function resetManual() {
    setManualTitle("");

    setManualCompany("");

    setManualLocation("");

    setManualEmploymentType("");

    setManualSeniority("");

    setManualIsContract(false);

    setManualContractLength("");

    setManualYearsExperience("");

    setManualSummary("");

    setManualDescription("");

    setManualKeywords("");
  }


  /*
   * =================================
   * UI
   * =================================
   */

  return (
    <SafeAreaView
      style={
        styles.container
      }
    >
      <KeyboardAvoidingView
        style={{
          flex: 1,
        }}
        behavior={
          Platform.OS ===
          "ios"
            ? "padding"
            : undefined
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
            Add Job
          </Text>


          <Text
            style={
              styles.subtitle
            }
          >
            Analyse a job advertisement,
            review the extracted data,
            then save it.
          </Text>


          {/* ERROR */}

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


          {/* SUCCESS */}

          {!!success && (
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
                {success}
              </Text>
            </View>
          )}


          {/* =========================
              JOB URL
          ========================= */}

          <View
            style={
              styles.card
            }
          >
            <Text
              style={
                styles.cardTitle
              }
            >
              Job Advertisement
            </Text>


            <Text
              style={
                styles.cardSubtitle
              }
            >
              Paste a job link and let
              Career Intelligence extract
              the role details.
            </Text>


            <TextInput
              value={
                jobUrl
              }
              onChangeText={
                setJobUrl
              }
              placeholder="https://..."
              placeholderTextColor="#AEAEB2"
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
              style={
                styles.input
              }
            />


            <TouchableOpacity
              style={[
                styles.primaryButton,

                (
                  analysing ||
                  !jobUrl.trim()
                ) &&
                  styles.disabled,
              ]}
              disabled={
                analysing ||
                !jobUrl.trim()
              }
              onPress={
                handleAnalyse
              }
            >
              {analysing ? (
                <ActivityIndicator
                  color="#FFFFFF"
                />
              ) : (
                <Text
                  style={
                    styles.primaryButtonText
                  }
                >
                  Fetch & Analyse
                </Text>
              )}
            </TouchableOpacity>
          </View>


          {/* =========================
              REVIEW
          ========================= */}

          {draft && (
            <View
              style={
                styles.reviewCard
              }
            >
              <Text
                style={
                  styles.reviewTitle
                }
              >
                Review Job
              </Text>


              <Text
                style={
                  styles.reviewSubtitle
                }
              >
                Check the extracted
                information. Missing
                fields can be entered
                manually and everything
                can be edited before
                saving.
              </Text>


              <Field
                label="Role Title"
                required
                value={
                  reviewTitle
                }
                onChangeText={
                  setReviewTitle
                }
                placeholder="Enter role title"
              />


              <Field
                label="Company"
                required
                value={
                  reviewCompany
                }
                onChangeText={
                  setReviewCompany
                }
                placeholder="Enter company"
              />


              <Field
                label="Location"
                value={
                  reviewLocation
                }
                onChangeText={
                  setReviewLocation
                }
                placeholder="Enter location"
              />


              <Field
                label="Seniority"
                value={
                  reviewSeniority
                }
                onChangeText={
                  setReviewSeniority
                }
                placeholder="e.g. Senior"
              />


              <Field
                label="Employment Type"
                value={
                  reviewEmploymentType
                }
                onChangeText={
                  setReviewEmploymentType
                }
                placeholder="e.g. Full-time"
              />


              <View
                style={
                  styles.switchRow
                }
              >
                <View>
                  <Text
                    style={
                      styles.fieldLabel
                    }
                  >
                    Contract Role
                  </Text>


                  <Text
                    style={
                      styles.hint
                    }
                  >
                    Fixed-term or contract.
                  </Text>
                </View>


                <Switch
                  value={
                    reviewIsContract
                  }
                  onValueChange={
                    setReviewIsContract
                  }
                />
              </View>


              {reviewIsContract && (
                <Field
                  label="Contract Length"
                  value={
                    reviewContractLength
                  }
                  onChangeText={
                    setReviewContractLength
                  }
                  placeholder="e.g. 12 months"
                />
              )}


              <Field
                label="Years Experience"
                value={
                  reviewYears
                }
                onChangeText={
                  setReviewYears
                }
                placeholder="e.g. 3"
                keyboardType="decimal-pad"
              />


              {/* ROLE DESCRIPTION */}

              <Field
                label="Role Description"
                required
                value={
                  reviewDescription
                }
                onChangeText={
                  setReviewDescription
                }
                placeholder={
                  "• Core responsibility\n• Business purpose\n• Key responsibility"
                }
                multiline
                large
              />


              {/* KEYWORDS */}

              <Text
                style={
                  styles.fieldLabel
                }
              >
                Key Skills
              </Text>


              <View
                style={
                  styles.skillsWrap
                }
              >
                {reviewKeywords.map(
                  (
                    item,
                    index
                  ) => (
                    <TouchableOpacity
                      key={`${item.keyword}-${index}`}
                      style={
                        styles.skillChip
                      }
                      onPress={() =>
                        removeReviewKeyword(
                          index
                        )
                      }
                    >
                      <Text
                        style={
                          styles.skillText
                        }
                      >
                        {item.keyword} ×
                      </Text>
                    </TouchableOpacity>
                  )
                )}
              </View>


              <View
                style={
                  styles.addKeywordRow
                }
              >
                <TextInput
                  value={
                    newKeyword
                  }
                  onChangeText={
                    setNewKeyword
                  }
                  placeholder="Add skill"
                  placeholderTextColor="#AEAEB2"
                  style={
                    styles.keywordInput
                  }
                  onSubmitEditing={
                    addReviewKeyword
                  }
                />


                <TouchableOpacity
                  style={
                    styles.addButton
                  }
                  onPress={
                    addReviewKeyword
                  }
                >
                  <Text
                    style={
                      styles.addButtonText
                    }
                  >
                    Add
                  </Text>
                </TouchableOpacity>
              </View>


              {/* SAVE */}

              <TouchableOpacity
                style={[
                  styles.primaryButton,

                  savingDraft &&
                    styles.disabled,
                ]}
                disabled={
                  savingDraft
                }
                onPress={
                  handleSaveReviewed
                }
              >
                {savingDraft ? (
                  <ActivityIndicator
                    color="#FFFFFF"
                  />
                ) : (
                  <Text
                    style={
                      styles.primaryButtonText
                    }
                  >
                    Save Job
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          )}


          {/* =========================
              MANUAL ROLE
          ========================= */}

          <TouchableOpacity
            style={
              styles.manualToggle
            }
            onPress={() => {
              setManualOpen(
                !manualOpen
              );

              setError("");
            }}
          >
            <View>
              <Text
                style={
                  styles.manualTitle
                }
              >
                + Add Manually
              </Text>


              <Text
                style={
                  styles.manualSubtitle
                }
              >
                Enter a role without a
                job-ad link.
              </Text>
            </View>


            <Text
              style={
                styles.chevron
              }
            >
              {manualOpen
                ? "⌃"
                : "⌄"}
            </Text>
          </TouchableOpacity>


          {manualOpen && (
            <View
              style={
                styles.reviewCard
              }
            >
              <Text
                style={
                  styles.reviewTitle
                }
              >
                Manual Role
              </Text>


              <Text
                style={
                  styles.reviewSubtitle
                }
              >
                Enter the role details
                directly.
              </Text>


              <Field
                label="Role Title"
                required
                value={
                  manualTitle
                }
                onChangeText={
                  setManualTitle
                }
                placeholder="Data Analyst"
              />


              <Field
                label="Company"
                required
                value={
                  manualCompany
                }
                onChangeText={
                  setManualCompany
                }
                placeholder="Company"
              />


              <Field
                label="Location"
                value={
                  manualLocation
                }
                onChangeText={
                  setManualLocation
                }
                placeholder="Sydney, NSW"
              />


              <Field
                label="Seniority"
                value={
                  manualSeniority
                }
                onChangeText={
                  setManualSeniority
                }
                placeholder="Associate"
              />


              <Field
                label="Employment Type"
                value={
                  manualEmploymentType
                }
                onChangeText={
                  setManualEmploymentType
                }
                placeholder="Full-time"
              />


              <View
                style={
                  styles.switchRow
                }
              >
                <View>
                  <Text
                    style={
                      styles.fieldLabel
                    }
                  >
                    Contract Role
                  </Text>

                  <Text
                    style={
                      styles.hint
                    }
                  >
                    Fixed-term or contract.
                  </Text>
                </View>


                <Switch
                  value={
                    manualIsContract
                  }
                  onValueChange={
                    setManualIsContract
                  }
                />
              </View>


              {manualIsContract && (
                <Field
                  label="Contract Length"
                  value={
                    manualContractLength
                  }
                  onChangeText={
                    setManualContractLength
                  }
                  placeholder="12 months"
                />
              )}


              <Field
                label="Years Experience"
                value={
                  manualYearsExperience
                }
                onChangeText={
                  setManualYearsExperience
                }
                placeholder="2"
                keyboardType="decimal-pad"
              />


              <Field
                label="Short Summary"
                value={
                  manualSummary
                }
                onChangeText={
                  setManualSummary
                }
                placeholder="Optional short summary"
                multiline
              />


              <Field
                label="Role Description"
                required
                value={
                  manualDescription
                }
                onChangeText={
                  setManualDescription
                }
                placeholder={
                  "• Core responsibility\n• Business purpose\n• Key responsibility"
                }
                multiline
                large
              />


              <Field
                label="Skills / Keywords"
                value={
                  manualKeywords
                }
                onChangeText={
                  setManualKeywords
                }
                placeholder="SQL, Python, Power BI"
                multiline
              />


              <TouchableOpacity
                style={[
                  styles.primaryButton,

                  manualSaving &&
                    styles.disabled,
                ]}
                onPress={
                  handleSaveManual
                }
                disabled={
                  manualSaving
                }
              >
                {manualSaving ? (
                  <ActivityIndicator
                    color="#FFFFFF"
                  />
                ) : (
                  <Text
                    style={
                      styles.primaryButtonText
                    }
                  >
                    Save Manual Role
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}


/*
 * =================================
 * REUSABLE FIELD
 * =================================
 */

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  required = false,
  multiline = false,
  large = false,
  keyboardType = "default",
}: {
  label: string;

  value: string;

  onChangeText:
    (value: string) =>
      void;

  placeholder: string;

  required?: boolean;

  multiline?: boolean;

  large?: boolean;

  keyboardType?: any;
}) {
  return (
    <View
      style={
        styles.fieldContainer
      }
    >
      <Text
        style={
          styles.fieldLabel
        }
      >
        {label}


        {required && (
          <Text
            style={
              styles.required
            }
          >
            {" "}*
          </Text>
        )}
      </Text>


      <TextInput
        value={
          value
        }
        onChangeText={
          onChangeText
        }
        placeholder={
          placeholder
        }
        placeholderTextColor="#AEAEB2"
        multiline={
          multiline
        }
        keyboardType={
          keyboardType
        }
        textAlignVertical={
          multiline
            ? "top"
            : "center"
        }
        style={[
          styles.input,

          multiline &&
            styles.multiline,

          large &&
            styles.large,
        ]}
      />
    </View>
  );
}


/*
 * =================================
 * STYLES
 * =================================
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
      color:
        "#636366",

      fontSize:
        16,

      lineHeight:
        23,

      marginTop:
        7,

      marginBottom:
        24,
    },


    card: {
      backgroundColor:
        "#FFFFFF",

      borderRadius:
        20,

      padding:
        18,

      marginBottom:
        18,
    },


    cardTitle: {
      fontSize:
        18,

      fontWeight:
        "800",

      color:
        "#1C1C1E",
    },


    cardSubtitle: {
      color:
        "#8E8E93",

      fontSize:
        13,

      lineHeight:
        18,

      marginTop:
        4,

      marginBottom:
        14,
    },


    reviewCard: {
      backgroundColor:
        "#FFFFFF",

      borderRadius:
        20,

      padding:
        18,

      marginBottom:
        22,
    },


    reviewTitle: {
      fontSize:
        20,

      fontWeight:
        "800",

      color:
        "#1C1C1E",
    },


    reviewSubtitle: {
      fontSize:
        13,

      lineHeight:
        18,

      color:
        "#8E8E93",

      marginTop:
        4,

      marginBottom:
        20,
    },


    fieldContainer: {
      marginBottom:
        16,
    },


    fieldLabel: {
      fontSize:
        12,

      fontWeight:
        "600",

      color:
        "#636366",

      marginBottom:
        7,
    },


    required: {
      color:
        "#D92D20",
    },


    input: {
      backgroundColor:
        "#F7F7F8",

      minHeight:
        48,

      borderRadius:
        14,

      paddingHorizontal:
        14,

      paddingVertical:
        12,

      fontSize:
        14,

      color:
        "#1C1C1E",
    },


    multiline: {
      minHeight:
        90,

      lineHeight:
        20,
    },


    large: {
      minHeight:
        135,
    },


    switchRow: {
      backgroundColor:
        "#F7F7F8",

      borderRadius:
        14,

      padding:
        14,

      flexDirection:
        "row",

      justifyContent:
        "space-between",

      alignItems:
        "center",

      marginBottom:
        16,
    },


    hint: {
      color:
        "#8E8E93",

      fontSize:
        11,

      marginTop:
        2,
    },


    primaryButton: {
      minHeight:
        50,

      borderRadius:
        14,

      backgroundColor:
        "#007AFF",

      alignItems:
        "center",

      justifyContent:
        "center",
    },


    primaryButtonText: {
      color:
        "#FFFFFF",

      fontSize:
        15,

      fontWeight:
        "700",
    },


    disabled: {
      opacity:
        0.45,
    },


    skillsWrap: {
      flexDirection:
        "row",

      flexWrap:
        "wrap",

      gap:
        8,

      marginBottom:
        12,
    },


    skillChip: {
      backgroundColor:
        "#EEF4FF",

      borderRadius:
        14,

      paddingHorizontal:
        10,

      paddingVertical:
        7,
    },


    skillText: {
      color:
        "#2563EB",

      fontSize:
        12,

      fontWeight:
        "600",
    },


    addKeywordRow: {
      flexDirection:
        "row",

      gap:
        8,

      marginBottom:
        18,
    },


    keywordInput: {
      flex: 1,

      backgroundColor:
        "#F7F7F8",

      borderRadius:
        14,

      paddingHorizontal:
        14,

      minHeight:
        45,

      color:
        "#1C1C1E",
    },


    addButton: {
      backgroundColor:
        "#EEF4FF",

      borderRadius:
        14,

      paddingHorizontal:
        18,

      alignItems:
        "center",

      justifyContent:
        "center",
    },


    addButtonText: {
      color:
        "#007AFF",

      fontWeight:
        "700",
    },


    manualToggle: {
      backgroundColor:
        "#FFFFFF",

      borderRadius:
        20,

      padding:
        18,

      flexDirection:
        "row",

      alignItems:
        "center",

      justifyContent:
        "space-between",

      marginBottom:
        18,
    },


    manualTitle: {
      fontSize:
        16,

      fontWeight:
        "700",

      color:
        "#1C1C1E",
    },


    manualSubtitle: {
      fontSize:
        12,

      color:
        "#8E8E93",

      marginTop:
        3,
    },


    chevron: {
      fontSize:
        20,

      color:
        "#8E8E93",
    },


    errorCard: {
      backgroundColor:
        "#FFF1F0",

      borderRadius:
        14,

      padding:
        14,

      marginBottom:
        18,
    },


    errorText: {
      color:
        "#B42318",

      fontSize:
        13,

      lineHeight:
        18,
    },


    successCard: {
      backgroundColor:
        "#ECFDF3",

      borderRadius:
        14,

      padding:
        14,

      marginBottom:
        18,
    },


    successText: {
      color:
        "#027A48",

      fontWeight:
        "600",

      fontSize:
        13,
    },
  });