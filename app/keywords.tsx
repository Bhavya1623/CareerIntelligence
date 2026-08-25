import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  ActivityIndicator,
  Dimensions,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import DateTimePicker from "@react-native-community/datetimepicker";

import Svg, {
  Rect,
  Text as SvgText,
} from "react-native-svg";

import {
  hierarchy,
  treemap,
} from "d3-hierarchy";

import {
  fetchKeywordAnalytics,
  fetchProfile,
} from "../src/services/api";


type KeywordItem = {
  keyword: string;
  category: string;
  frequency: number;
};


type AnalyticsResponse = {
  start_date?: string | null;
  end_date?: string | null;
  keywords: KeywordItem[];
};


type Preset =
  | "7D"
  | "30D"
  | "90D"
  | "ALL"
  | "CUSTOM";


export default function KeywordsScreen() {
  const [
    keywords,
    setKeywords,
  ] = useState<KeywordItem[]>([]);

  const [
    profileSkills,
    setProfileSkills,
  ] = useState<string[]>([]);

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    refreshing,
    setRefreshing,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  const [
    preset,
    setPreset,
  ] = useState<Preset>("30D");

  const [
    startDate,
    setStartDate,
  ] = useState<Date>(
    daysAgo(30)
  );

  const [
    endDate,
    setEndDate,
  ] = useState<Date>(
    new Date()
  );


  useEffect(() => {
    loadInitialData();
  }, []);


  async function loadInitialData() {
    setLoading(true);
    setError("");

    try {
      await Promise.all([
        loadProfileSkills(),

        loadAnalytics(
          "30D",
          startDate,
          endDate,
          false,
          false
        ),
      ]);
    } catch (err) {
      if (err instanceof Error) {
        setError(
          err.message
        );
      } else {
        setError(
          "Could not load keyword data."
        );
      }
    } finally {
      setLoading(false);
    }
  }


  async function loadProfileSkills() {
    const response =
      await fetchProfile();

    const profile =
      response.profile ?? {};

    const skills =
      extractProfileSkills(
        profile
      );

    setProfileSkills(
      skills
    );
  }


  async function loadAnalytics(
    nextPreset: Preset = preset,
    customStart: Date = startDate,
    customEnd: Date = endDate,
    isRefresh = false,
    manageLoading = true
  ) {
    if (manageLoading) {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
    }

    setError("");

    try {
      let start:
        string | undefined;

      let end:
        string | undefined;


      if (
        nextPreset === "7D"
      ) {
        start =
          formatDate(
            daysAgo(7)
          );

        end =
          formatDate(
            new Date()
          );
      }


      if (
        nextPreset === "30D"
      ) {
        start =
          formatDate(
            daysAgo(30)
          );

        end =
          formatDate(
            new Date()
          );
      }


      if (
        nextPreset === "90D"
      ) {
        start =
          formatDate(
            daysAgo(90)
          );

        end =
          formatDate(
            new Date()
          );
      }


      if (
        nextPreset ===
        "CUSTOM"
      ) {
        start =
          formatDate(
            customStart
          );

        end =
          formatDate(
            customEnd
          );
      }


      const response:
        AnalyticsResponse =
        await fetchKeywordAnalytics(
          start,
          end
        );


      setKeywords(
        response.keywords ?? []
      );

      setPreset(
        nextPreset
      );
    } catch (err) {
      if (err instanceof Error) {
        setError(
          err.message
        );
      } else {
        setError(
          "Could not load keyword analytics."
        );
      }
    } finally {
      if (manageLoading) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }


  async function handleRefresh() {
    setRefreshing(true);
    setError("");

    try {
      await Promise.all([
        loadProfileSkills(),

        loadAnalytics(
          preset,
          startDate,
          endDate,
          true,
          false
        ),
      ]);
    } catch (err) {
      if (err instanceof Error) {
        setError(
          err.message
        );
      } else {
        setError(
          "Could not refresh data."
        );
      }
    } finally {
      setRefreshing(false);
    }
  }


  function choosePreset(
    value: Preset
  ) {
    setPreset(
      value
    );

    if (
      value !== "CUSTOM"
    ) {
      loadAnalytics(
        value
      );
    }
  }


  function applyCustomDates() {
    setPreset(
      "CUSTOM"
    );

    loadAnalytics(
      "CUSTOM",
      startDate,
      endDate
    );
  }


  const normalizedProfileSkills =
    useMemo(() => {
      return new Set(
        profileSkills.map(
          normalizeSkill
        )
      );
    }, [
      profileSkills,
    ]);


  const uniqueKeywordCount =
    useMemo(() => {
      const uniqueKeywords =
        new Set(
          keywords.map(
            (item) =>
              normalizeSkill(
                item.keyword
              )
          )
        );

      return (
        uniqueKeywords.size
      );
    }, [
      keywords,
    ]);


  const top20Keywords =
    useMemo(() => {
      return keywords.slice(
        0,
        20
      );
    }, [
      keywords,
    ]);


  const missingSkillCount =
    useMemo(() => {
      return top20Keywords.filter(
        (item) =>
          !skillExistsInProfile(
            item.keyword,
            normalizedProfileSkills
          )
      ).length;
    }, [
      top20Keywords,
      normalizedProfileSkills,
    ]);


  const matchedSkillCount =
    top20Keywords.length -
    missingSkillCount;


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
              handleRefresh
            }
          />
        }
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
          Keywords
        </Text>

        <Text
          style={
            styles.subtitle
          }
        >
          See which skills and
          concepts appear most
          often across your
          collected job ads.
        </Text>


        <View
          style={
            styles.filterCard
          }
        >
          <Text
            style={
              styles.sectionTitle
            }
          >
            Date range
          </Text>


          <View
            style={
              styles.presetRow
            }
          >
            {(
              [
                "7D",
                "30D",
                "90D",
                "ALL",
              ] as Preset[]
            ).map(
              (item) => (
                <TouchableOpacity
                  key={
                    item
                  }
                  onPress={() =>
                    choosePreset(
                      item
                    )
                  }
                  style={[
                    styles.presetButton,

                    preset ===
                      item &&
                      styles.presetButtonActive,
                  ]}
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


          <View
            style={
              styles.customRow
            }
          >
            <View
              style={
                styles.dateButton
              }
            >
              <Text
                style={
                  styles.dateLabel
                }
              >
                From
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
                maximumDate={
                  endDate
                }
                themeVariant="light"
                onChange={(
                  _,
                  date
                ) => {
                  if (date) {
                    setStartDate(
                      date
                    );
                  }
                }}
                style={
                  styles.hiddenDatePicker
                }
              />
            </View>


            <View
              style={
                styles.dateButton
              }
            >
              <Text
                style={
                  styles.dateLabel
                }
              >
                To
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
                minimumDate={
                  startDate
                }
                maximumDate={
                  new Date()
                }
                themeVariant="light"
                onChange={(
                  _,
                  date
                ) => {
                  if (date) {
                    setEndDate(
                      date
                    );
                  }
                }}
                style={
                  styles.hiddenDatePicker
                }
              />
            </View>
          </View>


          <TouchableOpacity
            onPress={
              applyCustomDates
            }
            style={
              styles.applyButton
            }
          >
            <Text
              style={
                styles.applyButtonText
              }
            >
              Apply custom range
            </Text>
          </TouchableOpacity>
        </View>


        {loading && (
          <View
            style={
              styles.loadingCard
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
              Loading keyword
              analytics…
            </Text>
          </View>
        )}


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


        {!loading &&
          !error && (
            <>
              <View
                style={
                  styles.statRow
                }
              >
                <View
                  style={
                    styles.statCard
                  }
                >
                  <Text
                    style={
                      styles.statValue
                    }
                  >
                    {
                      uniqueKeywordCount
                    }
                  </Text>

                  <Text
                    style={
                      styles.statLabel
                    }
                  >
                    Keywords Analysed
                  </Text>
                </View>


                <View
                  style={
                    styles.statCard
                  }
                >
                  <Text
                    style={[
                      styles.statValue,

                      missingSkillCount >
                        0 &&
                        styles.missingStatValue,
                    ]}
                  >
                    {
                      missingSkillCount
                    }
                  </Text>

                  <Text
                    style={
                      styles.statLabel
                    }
                  >
                    Missing from Profile
                  </Text>
                </View>
              </View>


              <Text
                style={
                  styles.sectionHeading
                }
              >
                Keyword Treemap
              </Text>


              <View
                style={
                  styles.treemapCard
                }
              >
                {top20Keywords.length ===
                0 ? (
                  <Text
                    style={
                      styles.emptyText
                    }
                  >
                    No keyword data
                    for this period.
                  </Text>
                ) : (
                  <KeywordTreemap
                    data={
                      top20Keywords
                    }
                  />
                )}
              </View>


              <View
                style={
                  styles.listHeader
                }
              >
                <Text
                  style={
                    styles.sectionHeading
                  }
                >
                  Top 20
                </Text>

                <Text
                  style={
                    styles.listHint
                  }
                >
                  Red = missing
                </Text>
              </View>


              {top20Keywords.map(
                (
                  item,
                  index
                ) => {
                  const isMissing =
                    !skillExistsInProfile(
                      item.keyword,
                      normalizedProfileSkills
                    );

                  return (
                    <View
                      key={`${item.keyword}-${item.category}-${index}`}
                      style={[
                        styles.keywordRow,

                        isMissing &&
                          styles.missingKeywordRow,
                      ]}
                    >
                      <View
                        style={[
                          styles.rankCircle,

                          isMissing &&
                            styles.missingRankCircle,
                        ]}
                      >
                        <Text
                          style={[
                            styles.rankText,

                            isMissing &&
                              styles.missingRankText,
                          ]}
                        >
                          {
                            index +
                            1
                          }
                        </Text>
                      </View>


                      <View
                        style={
                          styles.keywordInfo
                        }
                      >
                        <Text
                          style={[
                            styles.keywordName,

                            isMissing &&
                              styles.keywordMissing,
                          ]}
                        >
                          {
                            item.keyword
                          }
                        </Text>


                        <View
                          style={
                            styles.keywordMetaRow
                          }
                        >
                          <Text
                            style={
                              styles.category
                            }
                          >
                            {formatCategory(
                              item.category
                            )}
                          </Text>


                          {isMissing && (
                            <Text
                              style={
                                styles.missingLabel
                              }
                            >
                              Missing from
                              profile
                            </Text>
                          )}
                        </View>
                      </View>


                      <View
                        style={[
                          styles.frequencyBadge,

                          isMissing &&
                            styles.missingFrequencyBadge,
                        ]}
                      >
                        <Text
                          style={[
                            styles.frequency,

                            isMissing &&
                              styles.missingFrequency,
                          ]}
                        >
                          {
                            item.frequency
                          }
                        </Text>
                      </View>
                    </View>
                  );
                }
              )}


              <View
                style={
                  styles.summaryCard
                }
              >
                <Text
                  style={
                    styles.summaryTitle
                  }
                >
                  Profile coverage
                </Text>

                <Text
                  style={
                    styles.summaryText
                  }
                >
                  {
                    matchedSkillCount
                  }{" "}
                  of{" "}
                  {
                    top20Keywords.length
                  }{" "}
                  top market keywords
                  appear in your
                  profile skills.
                </Text>
              </View>
            </>
          )}
      </ScrollView>
    </SafeAreaView>
  );
}


function KeywordTreemap({
  data,
}: {
  data: KeywordItem[];
}) {
  const [
    selected,
    setSelected,
  ] = useState<
    KeywordItem | null
  >(null);

  const screenWidth =
    Dimensions.get(
      "window"
    ).width;

  const width =
    screenWidth - 72;

  const height = 360;

  const root =
    hierarchy<{
      children?: KeywordItem[];
    }>({
      children: data,
    })
      .sum(
        (node: any) =>
          node.frequency ?? 0
      )
      .sort(
        (a, b) =>
          (b.value ?? 0) -
          (a.value ?? 0)
      );

  treemap<any>()
    .size([
      width,
      height,
    ])
    .paddingInner(3)
    .round(true)(root);

  const leaves =
    root.leaves();

  return (
    <View>
      <Svg
        width={width}
        height={height}
      >
        {leaves.map(
          (leaf, index) => {
            const item =
              leaf.data as KeywordItem;

            const x =
              leaf.x0;

            const y =
              leaf.y0;

            const blockWidth =
              leaf.x1 -
              leaf.x0;

            const blockHeight =
              leaf.y1 -
              leaf.y0;

            const isSelected =
              selected?.keyword ===
                item.keyword &&
              selected?.category ===
                item.category;

            const lines =
              wrapTreemapText(
                item.keyword,
                blockWidth,
                blockHeight
              );

            const fontSize =
              getTreemapFontSize(
                blockWidth,
                blockHeight
              );

            const lineHeight =
              fontSize + 2;

            const textHeight =
              lines.length *
              lineHeight;

            const startY =
              y +
              Math.max(
                fontSize + 6,
                (
                  blockHeight -
                  textHeight
                ) /
                  2 +
                  fontSize
              );


            return (
              <React.Fragment
                key={`${item.keyword}-${index}`}
              >
                <Rect
                  x={x}
                  y={y}
                  width={
                    blockWidth
                  }
                  height={
                    blockHeight
                  }
                  rx={6}
                  ry={6}
                  fill={
                    categoryColor(
                      item.category
                    )
                  }
                  opacity={
                    selected &&
                    !isSelected
                      ? 0.55
                      : 1
                  }
                  stroke={
                    isSelected
                      ? "#1C1C1E"
                      : "#FFFFFF"
                  }
                  strokeWidth={
                    isSelected
                      ? 4
                      : 2
                  }
                  onPress={() =>
                    setSelected(
                      isSelected
                        ? null
                        : item
                    )
                  }
                />

                {lines.map(
                  (
                    line,
                    lineIndex
                  ) => (
                    <SvgText
                      key={`${item.keyword}-line-${lineIndex}`}
                      x={
                        x +
                        blockWidth /
                          2
                      }
                      y={
                        startY +
                        lineIndex *
                          lineHeight
                      }
                      fill="#FFFFFF"
                      fontSize={
                        fontSize
                      }
                      fontWeight="700"
                      textAnchor="middle"
                      pointerEvents="none"
                    >
                      {line}
                    </SvgText>
                  )
                )}

              </React.Fragment>
            );
          }
        )}
      </Svg>

      {selected ? (
        <View
          style={
            styles.treemapTooltip
          }
        >
          <View
            style={{
              flex: 1,
            }}
          >
            <Text
              style={
                styles.treemapTooltipKeyword
              }
            >
              {
                selected.keyword
              }
            </Text>

            <Text
              style={
                styles.treemapTooltipCategory
              }
            >
              {formatCategory(
                selected.category
              )}
            </Text>
          </View>

          <View
            style={
              styles.treemapTooltipCount
            }
          >
            <Text
              style={
                styles.treemapTooltipNumber
              }
            >
              {
                selected.frequency
              }
            </Text>

            <Text
              style={
                styles.treemapTooltipLabel
              }
            >
              jobs
            </Text>
          </View>
        </View>
      ) : (
        <Text
          style={
            styles.treemapHint
          }
        >
          Tap a block to see details
        </Text>
      )}
    </View>
  );
}

function getTreemapFontSize(
  width: number,
  height: number
) {
  if (
    width < 45 ||
    height < 25
  ) {
    return 8;
  }

  if (
    width < 70 ||
    height < 40
  ) {
    return 9;
  }

  if (
    width < 100 ||
    height < 55
  ) {
    return 10;
  }

  return 12;
}

function wrapTreemapText(
  value: string,
  width: number,
  height: number
) {
  if (
    width < 28 ||
    height < 18
  ) {
    return [];
  }

  const fontSize =
    getTreemapFontSize(
      width,
      height
    );

  const approximateCharWidth =
    fontSize * 0.58;

  const maxCharsPerLine =
    Math.max(
      3,
      Math.floor(
        (
          width - 10
        ) /
          approximateCharWidth
      )
    );

  const maxLines =
    Math.max(
      1,
      Math.floor(
        (
          height - 10
        ) /
          (
            fontSize +
            2
          )
      )
    );

  const words =
    value
      .trim()
      .split(/\s+/);

  const lines:
    string[] = [];

  let currentLine = "";

  for (
    const word
    of words
  ) {
    const candidate =
      currentLine
        ? `${currentLine} ${word}`
        : word;

    if (
      candidate.length <=
      maxCharsPerLine
    ) {
      currentLine =
        candidate;
    } else {
      if (currentLine) {
        lines.push(
          currentLine
        );
      }

      if (
        word.length >
        maxCharsPerLine
      ) {
        lines.push(
          word.slice(
            0,
            Math.max(
              2,
              maxCharsPerLine -
                1
            )
          ) + "…"
        );

        currentLine =
          "";
      } else {
        currentLine =
          word;
      }
    }

    if (
      lines.length >=
      maxLines
    ) {
      break;
    }
  }

  if (
    currentLine &&
    lines.length <
      maxLines
  ) {
    lines.push(
      currentLine
    );
  }

  if (
    lines.length >
    maxLines
  ) {
    lines.length =
      maxLines;
  }

  if (
    lines.length ===
      maxLines &&
    words.join(" ").length >
      lines.join(" ").length
  ) {
    const lastIndex =
      lines.length - 1;

    const lastLine =
      lines[lastIndex];

    if (
      !lastLine.endsWith(
        "…"
      )
    ) {
      lines[lastIndex] =
        lastLine.length >
        2
          ? `${lastLine.slice(
              0,
              -1
            )}…`
          : lastLine;
    }
  }

  return lines;
}

function extractProfileSkills(
  profile: any
): string[] {
  const rawSkills =
    profile?.skills;


  if (!rawSkills) {
    return [];
  }


  if (
    Array.isArray(
      rawSkills
    )
  ) {
    const result:
      string[] = [];


    for (
      const item
      of rawSkills
    ) {
      if (
        typeof item ===
        "string"
      ) {
        result.push(
          item
        );
      }


      if (
        typeof item ===
          "object" &&
        item !== null
      ) {
        if (
          typeof item.name ===
          "string"
        ) {
          result.push(
            item.name
          );
        }


        if (
          Array.isArray(
            item.skills
          )
        ) {
          for (
            const skill
            of item.skills
          ) {
            if (
              typeof skill ===
              "string"
            ) {
              result.push(
                skill
              );
            }
          }
        }


        if (
          Array.isArray(
            item.items
          )
        ) {
          for (
            const skill
            of item.items
          ) {
            if (
              typeof skill ===
              "string"
            ) {
              result.push(
                skill
              );
            }
          }
        }
      }
    }


    return result;
  }


  if (
    typeof rawSkills ===
    "object"
  ) {
    const result:
      string[] = [];


    for (
      const value
      of Object.values(
        rawSkills
      )
    ) {
      if (
        typeof value ===
        "string"
      ) {
        result.push(
          value
        );
      }


      if (
        Array.isArray(
          value
        )
      ) {
        for (
          const skill
          of value
        ) {
          if (
            typeof skill ===
            "string"
          ) {
            result.push(
              skill
            );
          }
        }
      }
    }


    return result;
  }


  return [];
}


function normalizeSkill(
  value: string
) {
  return value
    .toLowerCase()
    .trim()
    .replace(
      /[^\w\s+#.-]/g,
      ""
    )
    .replace(
      /\s+/g,
      " "
    );
}


function skillExistsInProfile(
  keyword: string,
  profileSkills:
    Set<string>
) {
  const normalizedKeyword =
    normalizeSkill(
      keyword
    );


  if (
    profileSkills.has(
      normalizedKeyword
    )
  ) {
    return true;
  }


  for (
    const profileSkill
    of profileSkills
  ) {
    if (
      normalizedKeyword.length >
        2 &&
      (
        profileSkill.includes(
          normalizedKeyword
        ) ||
        normalizedKeyword.includes(
          profileSkill
        )
      )
    ) {
      return true;
    }
  }


  return false;
}


function categoryColor(
  category?: string
) {
  switch (
    category
  ) {
    case "technical_skill":
      return "#2563EB";

    case "tool":
      return "#7C3AED";

    case "soft_skill":
      return "#059669";

    case "domain":
      return "#D97706";

    case "industry":
      return "#DC2626";

    case "qualification":
      return "#0891B2";

    case "methodology":
      return "#4F46E5";

    case "responsibility":
      return "#9333EA";

    default:
      return "#64748B";
  }
}


function truncateKeyword(
  value: string,
  width: number
) {
  const approximateCharacters =
    Math.max(
      5,
      Math.floor(
        width /
          8
      )
    );


  if (
    value.length <=
    approximateCharacters
  ) {
    return value;
  }


  return `${value.slice(
    0,
    approximateCharacters -
      1
  )}…`;
}


function daysAgo(
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


function formatDate(
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
        "2-digit",

      month:
        "short",

      year:
        "numeric",
    }
  );
}


function formatCategory(
  category?: string
) {
  if (!category) {
    return "Other";
  }


  return category
    .replace(
      /_/g,
      " "
    )
    .replace(
      /\b\w/g,
      (
        letter
      ) =>
        letter.toUpperCase()
    );
}


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
        70,
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
        24,

      fontSize:
        16,

      lineHeight:
        23,

      color:
        "#636366",
    },


    filterCard: {
      backgroundColor:
        "#FFFFFF",

      borderRadius:
        20,

      padding:
        18,

      marginBottom:
        24,
    },


    sectionTitle: {
      fontSize:
        18,

      fontWeight:
        "700",

      color:
        "#1C1C1E",

      marginBottom:
        14,
    },


    presetRow: {
      flexDirection:
        "row",

      gap:
        8,

      marginBottom:
        16,
    },


    presetButton: {
      flex:
        1,

      paddingVertical:
        10,

      backgroundColor:
        "#F2F2F7",

      borderRadius:
        10,

      alignItems:
        "center",
    },


    presetButtonActive: {
      backgroundColor:
        "#007AFF",
    },


    presetText: {
      color:
        "#636366",

      fontSize:
        13,

      fontWeight:
        "700",
    },


    presetTextActive: {
      color:
        "#FFFFFF",
    },


    customRow: {
      flexDirection:
        "row",

      gap:
        10,
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


    applyButton: {
      marginTop:
        12,

      borderRadius:
        12,

      borderWidth:
        1,

      borderColor:
        "#007AFF",

      paddingVertical:
        12,

      alignItems:
        "center",
    },


    applyButtonText: {
      color:
        "#007AFF",

      fontWeight:
        "700",

      fontSize:
        14,
    },


    loadingCard: {
      backgroundColor:
        "#FFFFFF",

      borderRadius:
        20,

      padding:
        30,

      alignItems:
        "center",
    },


    loadingText: {
      marginTop:
        12,

      color:
        "#636366",
    },


    errorCard: {
      backgroundColor:
        "#FFF1F0",

      padding:
        16,

      borderRadius:
        14,

      marginBottom:
        18,
    },


    errorText: {
      color:
        "#B42318",
    },


    statRow: {
      flexDirection:
        "row",

      gap:
        12,

      marginBottom:
        26,
    },


    statCard: {
      flex:
        1,

      backgroundColor:
        "#FFFFFF",

      borderRadius:
        18,

      padding:
        18,
    },


    statValue: {
      fontSize:
        26,

      fontWeight:
        "800",

      color:
        "#1C1C1E",
    },


    missingStatValue: {
      color:
        "#D92D20",
    },


    statLabel: {
      marginTop:
        4,

      fontSize:
        13,

      color:
        "#8E8E93",
    },


    sectionHeading: {
      fontSize:
        21,

      fontWeight:
        "700",

      color:
        "#1C1C1E",

      marginBottom:
        12,
    },


    treemapCard: {
      backgroundColor:
        "#FFFFFF",

      borderRadius:
        20,

      padding:
        16,

      marginBottom:
        30,

      overflow:
        "hidden",
    },


    emptyText: {
      color:
        "#8E8E93",

      textAlign:
        "center",

      padding:
        20,
    },


    treemapTooltip: {
      marginTop:
        12,

      backgroundColor:
        "#F2F2F7",

      borderRadius:
        14,

      padding:
        14,

      flexDirection:
        "row",

      alignItems:
        "center",
    },


    treemapTooltipKeyword: {
      fontSize:
        16,

      fontWeight:
        "700",

      color:
        "#1C1C1E",
    },


    treemapTooltipCategory: {
      marginTop:
        3,

      fontSize:
        12,

      color:
        "#8E8E93",
    },


    treemapTooltipCount: {
      alignItems:
        "center",

      marginLeft:
        14,
    },


    treemapTooltipNumber: {
      fontSize:
        22,

      fontWeight:
        "800",

      color:
        "#1C1C1E",
    },


    treemapTooltipLabel: {
      fontSize:
        11,

      color:
        "#8E8E93",
    },


    treemapHint: {
      marginTop:
        10,

      textAlign:
        "center",

      fontSize:
        12,

      color:
        "#8E8E93",
    },


    listHeader: {
      flexDirection:
        "row",

      alignItems:
        "center",
    },


    listHint: {
      marginLeft:
        "auto",

      marginBottom:
        12,

      fontSize:
        12,

      color:
        "#D92D20",

      fontWeight:
        "600",
    },


    keywordRow: {
      backgroundColor:
        "#FFFFFF",

      borderRadius:
        16,

      padding:
        14,

      marginBottom:
        10,

      flexDirection:
        "row",

      alignItems:
        "center",
    },


    missingKeywordRow: {
      borderWidth:
        1,

      borderColor:
        "#FECACA",

      backgroundColor:
        "#FFF8F7",
    },


    rankCircle: {
      width:
        34,

      height:
        34,

      borderRadius:
        17,

      backgroundColor:
        "#F2F2F7",

      alignItems:
        "center",

      justifyContent:
        "center",

      marginRight:
        12,
    },


    missingRankCircle: {
      backgroundColor:
        "#FEE4E2",
    },


    rankText: {
      fontSize:
        13,

      fontWeight:
        "700",

      color:
        "#636366",
    },


    missingRankText: {
      color:
        "#D92D20",
    },


    keywordInfo: {
      flex:
        1,
    },


    keywordName: {
      fontSize:
        16,

      fontWeight:
        "700",

      color:
        "#1C1C1E",
    },


    keywordMissing: {
      color:
        "#D92D20",
    },


    keywordMetaRow: {
      flexDirection:
        "row",

      flexWrap:
        "wrap",

      alignItems:
        "center",

      marginTop:
        3,

      gap:
        8,
    },


    category: {
      fontSize:
        12,

      color:
        "#8E8E93",
    },


    missingLabel: {
      fontSize:
        11,

      fontWeight:
        "700",

      color:
        "#D92D20",
    },


    frequencyBadge: {
      backgroundColor:
        "#F2F2F7",

      borderRadius:
        20,

      paddingHorizontal:
        12,

      paddingVertical:
        7,
    },


    missingFrequencyBadge: {
      backgroundColor:
        "#FEE4E2",
    },


    frequency: {
      fontSize:
        14,

      fontWeight:
        "800",

      color:
        "#1C1C1E",
    },


    missingFrequency: {
      color:
        "#D92D20",
    },


    summaryCard: {
      marginTop:
        12,

      backgroundColor:
        "#FFFFFF",

      borderRadius:
        18,

      padding:
        18,
    },


    summaryTitle: {
      fontSize:
        16,

      fontWeight:
        "700",

      color:
        "#1C1C1E",
    },


    summaryText: {
      marginTop:
        6,

      fontSize:
        14,

      lineHeight:
        20,

      color:
        "#636366",
    },
  });