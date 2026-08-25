const OLLAMA_API_URL =
  "https://ollama.com/api/chat";

const OLLAMA_MODEL =
  "gpt-oss:20b-cloud";


const corsHeaders = {
  "Access-Control-Allow-Origin": "*",

  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};


Deno.serve(async (req) => {
  /*
   * -------------------------
   * CORS
   * -------------------------
   */

  if (req.method === "OPTIONS") {
    return new Response(
      "ok",
      {
        headers: corsHeaders,
      }
    );
  }


  try {
    /*
     * -------------------------
     * OLLAMA SECRET
     * -------------------------
     */

    const ollamaApiKey =
      Deno.env.get(
        "OLLAMA_API_KEY"
      );


    if (!ollamaApiKey) {
      throw new Error(
        "OLLAMA_API_KEY is not configured."
      );
    }


    /*
     * -------------------------
     * REQUEST
     * -------------------------
     */

    const body =
      await req.json();


    const jobUrl =
      body?.job_url?.trim();


    if (!jobUrl) {
      return jsonResponse(
        {
          error:
            "job_url is required.",
        },
        400
      );
    }


    /*
     * -------------------------
     * VALIDATE URL
     * -------------------------
     */

    let parsedUrl: URL;


    try {
      parsedUrl =
        new URL(jobUrl);
    } catch {
      return jsonResponse(
        {
          error:
            "Invalid job URL.",
        },
        400
      );
    }


    if (
      ![
        "http:",
        "https:",
      ].includes(
        parsedUrl.protocol
      )
    ) {
      return jsonResponse(
        {
          error:
            "Only HTTP and HTTPS URLs are supported.",
        },
        400
      );
    }


    /*
     * -------------------------
     * FETCH JOB PAGE
     * -------------------------
     */

    const pageResponse =
      await fetch(
        jobUrl,
        {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/126 Safari/537.36",

            Accept:
              "text/html,application/xhtml+xml",
          },

          redirect:
            "follow",
        }
      );


    if (!pageResponse.ok) {
      throw new Error(
        `Could not fetch job page. HTTP ${pageResponse.status}`
      );
    }


    const html =
      await pageResponse.text();


    /*
     * -------------------------
     * CLEAN WEBSITE TEXT
     * -------------------------
     */

    const cleanedText =
      cleanJobHtml(
        html
      );


    if (
      cleanedText.length <
      250
    ) {
      throw new Error(
        "The job page did not contain enough readable text."
      );
    }


    /*
     * -------------------------
     * BUILD AI PROMPT
     * -------------------------
     */

    const prompt =
      buildPrompt(
        cleanedText,
        jobUrl
      );


    /*
     * -------------------------
     * OLLAMA CLOUD
     * -------------------------
     */

    const ollamaResponse =
      await fetch(
        OLLAMA_API_URL,
        {
          method: "POST",

          headers: {
            Authorization:
              `Bearer ${ollamaApiKey}`,

            "Content-Type":
              "application/json",
          },

          body:
            JSON.stringify({
              model:
                OLLAMA_MODEL,

              messages: [
                {
                  role:
                    "user",

                  content:
                    prompt,
                },
              ],

              stream:
                false,
            }),
        }
      );


    if (!ollamaResponse.ok) {
      const errorText =
        await ollamaResponse.text();


      throw new Error(
        `Ollama Cloud error: ${errorText}`
      );
    }


    const ollamaJson =
      await ollamaResponse.json();


    const rawContent =
      ollamaJson
        ?.message
        ?.content;


    if (!rawContent) {
      throw new Error(
        "Ollama returned no content."
      );
    }


    /*
     * -------------------------
     * PARSE MODEL JSON
     * -------------------------
     */

    const parsed =
      parseModelJson(
        rawContent
      );


    /*
     * -------------------------
     * AI ROLE SUMMARY
     *
     * This is what will appear
     * in the editable Job
     * Description field.
     * -------------------------
     */

    const aiSummary =
      cleanString(
        parsed.summary
      ) ?? "";


    /*
     * -------------------------
     * RETURN EDITABLE DRAFT
     *
     * IMPORTANT:
     *
     * Nothing is inserted into
     * Supabase yet.
     *
     * Missing fields are allowed.
     * -------------------------
     */

    const draft = {
      title:
        cleanString(
          parsed.title
        ),

      company:
        cleanString(
          parsed.company
        ),

      location:
        cleanString(
          parsed.location
        ),

      /*
       * Keep summary separately
       * for compatibility.
       */

      summary:
        aiSummary,

      seniority:
        cleanString(
          parsed.seniority
        ),

      employment_type:
        cleanString(
          parsed.employment_type
        ),

      is_contract:
        Boolean(
          parsed.is_contract
        ),

      contract_length:
        cleanString(
          parsed.contract_length
        ),

      years_experience:
        parseYearsExperience(
          parsed.years_experience
        ),

      /*
       * This is deliberately
       * the concise AI summary,
       * NOT the entire scraped page.
       */

      raw_job_description:
        aiSummary,

      job_url:
        jobUrl,

      source:
        parsedUrl.hostname,

      keywords:
        normaliseKeywords(
          parsed.keywords
        ),
    };


    return jsonResponse(
      {
        draft,
      },
      200
    );
  } catch (error) {
    console.error(
      "parse-job-url error:",
      error
    );


    return jsonResponse(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unexpected error.",
      },
      500
    );
  }
});


/*
 * =================================
 * HTML CLEANING
 * =================================
 */

function cleanJobHtml(
  html: string
) {
  let text =
    html;


  /*
   * Remove scripts,
   * styles and visual junk.
   */

  text =
    text.replace(
      /<script[\s\S]*?<\/script>/gi,
      " "
    );


  text =
    text.replace(
      /<style[\s\S]*?<\/style>/gi,
      " "
    );


  text =
    text.replace(
      /<noscript[\s\S]*?<\/noscript>/gi,
      " "
    );


  text =
    text.replace(
      /<svg[\s\S]*?<\/svg>/gi,
      " "
    );


  /*
   * Preserve some structure
   * before removing tags.
   */

  text =
    text.replace(
      /<\/(p|div|li|section|article|h1|h2|h3|h4|h5|h6|br)>/gi,
      "\n"
    );


  /*
   * Remove remaining HTML tags.
   */

  text =
    text.replace(
      /<[^>]+>/g,
      " "
    );


  /*
   * Decode common HTML entities.
   */

  text =
    text
      .replace(
        /&nbsp;/gi,
        " "
      )
      .replace(
        /&amp;/gi,
        "&"
      )
      .replace(
        /&quot;/gi,
        '"'
      )
      .replace(
        /&#39;/gi,
        "'"
      )
      .replace(
        /&lt;/gi,
        "<"
      )
      .replace(
        /&gt;/gi,
        ">"
      );


  /*
   * Clean whitespace.
   */

  text =
    text
      .replace(
        /\r/g,
        "\n"
      )
      .replace(
        /[ \t]+/g,
        " "
      )
      .replace(
        /\n\s*\n\s*\n+/g,
        "\n\n"
      )
      .trim();


  /*
   * Prevent excessively large
   * requests to the model.
   */

  const MAX_CHARS =
    60000;


  if (
    text.length >
    MAX_CHARS
  ) {
    text =
      text.slice(
        0,
        MAX_CHARS
      );
  }


  return text;
}


/*
 * =================================
 * MODEL PROMPT
 * =================================
 */

function buildPrompt(
  jobText: string,
  jobUrl: string
) {
  return `
You are a job advertisement parsing system.

Extract structured information from the job advertisement below.

Return ONLY valid JSON.

Do not include markdown.

Do not include reasoning.

Do not include commentary.

Do not wrap the response in triple backticks.

Never invent information.

If a field cannot be determined reliably, return null.

Use exactly this schema:

{
  "title": string | null,
  "company": string | null,
  "location": string | null,
  "summary": string | null,
  "seniority": string | null,
  "employment_type": string | null,
  "is_contract": boolean,
  "contract_length": string | null,
  "years_experience": integer | null,
  "keywords": [
    {
      "keyword": string,
      "category": string,
      "importance": "high" | "medium" | "low"
    }
  ]
}


SUMMARY RULES:

The "summary" field is particularly important.

It must describe the ROLE itself.

Return exactly 2 or 3 concise bullet points.

Each bullet should describe meaningful aspects of the position such as:

- what the person will actually do,
- the main analytical, technical or business purpose of the role,
- the most important responsibilities,
- or the kinds of problems the person will solve.

Use this exact style:

• First concise role point
• Second concise role point
• Third concise role point

Use only 2 bullets if a third useful point is not justified.

Do NOT:

- copy entire sections from the advertisement,
- include long blocks of text,
- include generic company marketing,
- include diversity statements,
- include benefits,
- include application instructions,
- include legal disclaimers,
- include generic culture statements.

The summary should normally be around 40-90 words total.


OTHER RULES:

1. Never guess the title or company.

2. Return null if a value is unclear.

3. seniority should describe the apparent role level where possible, such as:

Graduate
Junior
Associate
Mid
Senior
Lead
Manager
Director

4. employment_type should preferably use values such as:

Full-time
Part-time
Contract
Casual
Internship
Graduate

5. is_contract should be true only when the advertisement clearly describes a contract or fixed-term position.

6. contract_length should only be populated if a duration is actually stated.

7. years_experience should represent the clearest minimum number of years required.

If no clear minimum exists, return null.

8. Extract approximately 10-25 useful keywords when justified.

9. Keywords should focus on employability signals such as:

programming languages
databases
cloud platforms
data engineering tools
BI platforms
analytics tools
machine learning methods
statistical methods
data governance
risk and regulatory knowledge
business domains
commercial capabilities
important specialist tools

10. Avoid generic filler skills unless unusually important.

11. Normalise obvious naming variants.

Examples:

PowerBI -> Power BI
Structured Query Language -> SQL
MS Excel -> Excel

12. category should preferably use one of:

programming
database
cloud
data_engineering
analytics
visualisation
machine_learning
statistics
governance
domain
business
tool
soft_skill
other

13. importance means:

high = essential, explicitly required, or repeatedly emphasised

medium = clearly relevant to performing the role

low = desirable, preferred or incidental


SOURCE URL:

${jobUrl}


JOB ADVERTISEMENT:

${jobText}
`;
}


/*
 * =================================
 * MODEL JSON PARSER
 * =================================
 */

function parseModelJson(
  content: string
) {
  let cleaned =
    content.trim();


  cleaned =
    cleaned.replace(
      /^```json\s*/i,
      ""
    );


  cleaned =
    cleaned.replace(
      /^```\s*/i,
      ""
    );


  cleaned =
    cleaned.replace(
      /\s*```$/,
      ""
    );


  const firstBrace =
    cleaned.indexOf(
      "{"
    );


  const lastBrace =
    cleaned.lastIndexOf(
      "}"
    );


  if (
    firstBrace !== -1 &&
    lastBrace !== -1
  ) {
    cleaned =
      cleaned.slice(
        firstBrace,
        lastBrace + 1
      );
  }


  try {
    return JSON.parse(
      cleaned
    );
  } catch {
    throw new Error(
      "Model returned invalid JSON."
    );
  }
}


/*
 * =================================
 * KEYWORDS
 * =================================
 */

function normaliseKeywords(
  value: unknown
) {
  if (
    !Array.isArray(
      value
    )
  ) {
    return [];
  }


  const result: {
    keyword: string;
    category: string;
    importance: string;
  }[] = [];


  const seen =
    new Set<string>();


  for (
    const item of value
  ) {
    if (
      !item ||
      typeof item !==
        "object"
    ) {
      continue;
    }


    const keyword =
      cleanString(
        (item as any)
          .keyword
      );


    if (!keyword) {
      continue;
    }


    const key =
      keyword
        .toLowerCase()
        .trim();


    if (
      seen.has(key)
    ) {
      continue;
    }


    seen.add(key);


    result.push({
      keyword,

      category:
        cleanString(
          (item as any)
            .category
        ) ??
        "other",

      importance:
        normaliseImportance(
          (item as any)
            .importance
        ),
    });
  }


  return result;
}


/*
 * =================================
 * HELPERS
 * =================================
 */

function cleanString(
  value: unknown
):
  | string
  | null {
  if (
    typeof value !==
      "string"
  ) {
    return null;
  }


  const cleaned =
    value.trim();


  return cleaned ||
    null;
}


function parseYearsExperience(
  value: unknown
):
  | number
  | null {
  if (
    value === null ||
    value === undefined
  ) {
    return null;
  }


  const parsed =
    Number(value);


  if (
    Number.isNaN(
      parsed
    ) ||
    parsed < 0
  ) {
    return null;
  }


  return Math.round(
    parsed
  );
}


function normaliseImportance(
  value: unknown
) {
  const cleaned =
    String(
      value ?? ""
    )
      .trim()
      .toLowerCase();


  if (
    cleaned ===
    "high"
  ) {
    return "high";
  }


  if (
    cleaned ===
    "low"
  ) {
    return "low";
  }


  return "medium";
}


function jsonResponse(
  data: unknown,
  status: number
) {
  return new Response(
    JSON.stringify(
      data
    ),
    {
      status,

      headers: {
        ...corsHeaders,

        "Content-Type":
          "application/json",
      },
    }
  );
}