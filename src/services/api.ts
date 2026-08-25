import { supabase } from "./supabase";


/*
 * ============================================================
 * TYPES
 * ============================================================
 */

export type ApplicationStatus =
  | "saved"
  | "applying"
  | "applied"
  | "interviewing"
  | "rejected"
  | "offer"
  | "withdrawn";


/*
 * ============================================================
 * PROFILE
 * ============================================================
 */

export async function fetchProfile() {
  const {
    data,
    error,
  } = await supabase
    .from("profiles")
    .select(
      "profile_data, updated_at"
    )
    .order(
      "updated_at",
      {
        ascending: false,
      }
    )
    .limit(1)
    .maybeSingle();


  if (error) {
    throw new Error(
      `Could not load profile: ${error.message}`
    );
  }


  return {
    profile:
      data?.profile_data ??
      null,

    updated_at:
      data?.updated_at ??
      null,
  };
}


/*
 * ============================================================
 * KEYWORD ANALYTICS
 * ============================================================
 */

export async function fetchKeywordAnalytics(
  startDate?: string,
  endDate?: string
) {
  const {
    data,
    error,
  } = await supabase.rpc(
    "get_keyword_analytics",
    {
      start_date_param:
        startDate
          ? `${startDate}T00:00:00Z`
          : null,

      end_date_param:
        endDate
          ? `${endDate}T23:59:59Z`
          : null,
    }
  );


  if (error) {
    throw new Error(
      `Could not load keyword analytics: ${error.message}`
    );
  }


  return {
    keywords:
      data ?? [],
  };
}


/*
 * ============================================================
 * JOBS
 * ============================================================
 */

export async function fetchJobs(
  startDate?: string,
  endDate?: string,
  status?: string
) {
  let query =
    supabase
      .from("jobs")
      .select(
        `
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
        `
      )
      .order(
        "created_at",
        {
          ascending: false,
        }
      );


  if (startDate) {
    query =
      query.gte(
        "created_at",
        `${startDate}T00:00:00Z`
      );
  }


  if (endDate) {
    query =
      query.lte(
        "created_at",
        `${endDate}T23:59:59Z`
      );
  }


  const {
    data: jobs,
    error: jobsError,
  } =
    await query;


  if (jobsError) {
    throw new Error(
      `Could not load jobs: ${jobsError.message}`
    );
  }


  if (
    !jobs ||
    jobs.length === 0
  ) {
    return {
      jobs: [],
    };
  }


  const jobIds =
    jobs.map(
      (job) => job.id
    );


  const [
    keywordResult,
    applicationResult,
  ] =
    await Promise.all([
      supabase
        .from(
          "job_keywords"
        )
        .select(
          `
          job_id,
          keyword,
          category,
          importance
          `
        )
        .in(
          "job_id",
          jobIds
        ),

      supabase
        .from(
          "applications"
        )
        .select(
          `
          job_id,
          status,
          applied_at,
          interview_at,
          offer_at,
          rejected_at,
          notes,
          updated_at
          `
        )
        .in(
          "job_id",
          jobIds
        ),
    ]);


  if (
    keywordResult.error
  ) {
    throw new Error(
      `Could not load job keywords: ${keywordResult.error.message}`
    );
  }


  if (
    applicationResult.error
  ) {
    throw new Error(
      `Could not load applications: ${applicationResult.error.message}`
    );
  }


  const keywordMap =
    new Map<
      string,
      {
        keyword: string;
        category: string | null;
        importance: string | null;
      }[]
    >();


  for (
    const row of
    keywordResult.data ??
    []
  ) {
    const existing =
      keywordMap.get(
        row.job_id
      ) ??
      [];


    existing.push({
      keyword:
        row.keyword,

      category:
        row.category,

      importance:
        row.importance,
    });


    keywordMap.set(
      row.job_id,
      existing
    );
  }


  const applicationMap =
    new Map<
      string,
      any
    >();


  for (
    const application of
    applicationResult.data ??
    []
  ) {
    applicationMap.set(
      application.job_id,
      application
    );
  }


  let mergedJobs =
    jobs.map(
      (job) => {
        const allKeywords =
          keywordMap.get(
            job.id
          ) ??
          [];


        /*
         * Prioritise HIGH,
         * then MEDIUM,
         * then everything else.
         */

        const sortedKeywords =
          [...allKeywords].sort(
            (a, b) => {
              const weight =
                (
                  importance:
                    string | null
                ) => {
                  switch (
                    importance
                  ) {
                    case "high":
                      return 3;

                    case "medium":
                      return 2;

                    case "low":
                      return 1;

                    default:
                      return 0;
                  }
                };


              return (
                weight(
                  b.importance
                ) -
                weight(
                  a.importance
                )
              );
            }
          );


        const application =
          applicationMap.get(
            job.id
          );


        return {
          ...job,

          key_skills:
            sortedKeywords
              .slice(
                0,
                5
              )
              .map(
                (item) =>
                  item.keyword
              ),

          keywords:
            allKeywords,

          application_status:
            application?.status ??
            "saved",

          status:
            application?.status ??
            "saved",

          application:
            application ??
            null,
        };
      }
    );


  if (status) {
    mergedJobs =
      mergedJobs.filter(
        (job) =>
          job.application_status ===
          status
      );
  }


  return {
    jobs:
      mergedJobs.slice(
        0,
        20
      ),
  };
}


/*
 * ============================================================
 * DELETE JOB
 * ============================================================
 */

export async function deleteJob(
  jobId: string
) {
  const {
    error,
  } = await supabase
    .from("jobs")
    .delete()
    .eq(
      "id",
      jobId
    );


  if (error) {
    throw new Error(
      `Could not delete job: ${error.message}`
    );
  }


  return true;
}


/*
 * ============================================================
 * APPLICATION STATUS
 * ============================================================
 */

export async function updateApplicationStatus(
  jobId: string,
  status: ApplicationStatus
) {
  const validStatuses:
    ApplicationStatus[] =
    [
      "saved",
      "applying",
      "applied",
      "interviewing",
      "rejected",
      "offer",
      "withdrawn",
    ];


  if (
    !validStatuses.includes(
      status
    )
  ) {
    throw new Error(
      "Invalid application status."
    );
  }


  const {
    data: job,
    error: jobError,
  } =
    await supabase
      .from("jobs")
      .select(
        "title, company"
      )
      .eq(
        "id",
        jobId
      )
      .single();


  if (jobError) {
    throw new Error(
      `Could not find job: ${jobError.message}`
    );
  }


  const now =
    new Date()
      .toISOString();


  const update: any = {
    job_id:
      jobId,

    company_name:
      job.company,

    role_title:
      job.title,

    status,

    updated_at:
      now,
  };


  if (
    status ===
    "applied"
  ) {
    update.applied_at =
      now;
  }


  if (
    status ===
    "interviewing"
  ) {
    update.interview_at =
      now;
  }


  if (
    status ===
    "offer"
  ) {
    update.offer_at =
      now;
  }


  if (
    status ===
    "rejected"
  ) {
    update.rejected_at =
      now;
  }


  const {
    data,
    error,
  } =
    await supabase
      .from(
        "applications"
      )
      .upsert(
        update,
        {
          onConflict:
            "job_id",
        }
      )
      .select()
      .single();


  if (error) {
    throw new Error(
      `Could not update application status: ${error.message}`
    );
  }


  return data;
}


/*
 * ============================================================
 * EDGE FUNCTION — ANALYSE JOB
 * ============================================================
 */

export async function fetchAndAnalyseJob(
  jobUrl: string
) {
  const {
    data,
    error,
  } =
    await supabase.functions.invoke(
      "parse-job-url",
      {
        body: {
          job_url:
            jobUrl.trim(),
        },
      }
    );


  if (error) {
    const context =
      (error as any)
        ?.context;


    if (context) {
      try {
        const body =
          await context.json();


        if (
          body?.error
        ) {
          throw new Error(
            body.error
          );
        }
      } catch (
        parseError
      ) {
        if (
          parseError instanceof
            Error &&
          parseError.message !==
            error.message
        ) {
          throw parseError;
        }
      }
    }


    throw new Error(
      error.message
    );
  }


  if (
    data?.error
  ) {
    throw new Error(
      data.error
    );
  }


  if (
    !data?.draft
  ) {
    throw new Error(
      "No job draft was returned."
    );
  }


  return data;
}


/*
 * ============================================================
 * SAVE REVIEWED AI JOB
 * ============================================================
 */

export async function saveReviewedJob(
  input: {
    title: string;
    company: string;
    location: string;
    summary: string;
    seniority: string;
    employment_type: string;
    is_contract: boolean;
    contract_length: string;

    years_experience:
      number | null;

    raw_job_description:
      string;

    source:
      string | null;

    job_url:
      string | null;

    keywords: {
      keyword: string;
      category?: string;
      importance?: string;
    }[];
  }
) {
  const {
    data: job,
    error: jobError,
  } =
    await supabase
      .from("jobs")
      .insert({
        title:
          input.title.trim(),

        company:
          input.company.trim(),

        location:
          input.location.trim() ||
          null,

        summary:
          input.summary.trim() ||
          null,

        seniority:
          input.seniority.trim() ||
          null,

        employment_type:
          input.employment_type.trim() ||
          null,

        is_contract:
          input.is_contract,

        contract_length:
          input.is_contract
            ? input.contract_length.trim() ||
              null
            : null,

        years_experience:
          input.years_experience,

        raw_job_description:
          input.raw_job_description.trim(),

        source:
          input.source,

        job_url:
          input.job_url,
      })
      .select()
      .single();


  if (jobError) {
    throw new Error(
      `Could not save job: ${jobError.message}`
    );
  }


  const seen =
    new Set<string>();


  const cleanedKeywords =
    input.keywords
      .map(
        (item) => ({
          keyword:
            item.keyword.trim(),

          category:
            item.category?.trim() ||
            "other",

          importance:
            item.importance?.trim() ||
            "medium",
        })
      )
      .filter(
        (item) => {
          if (
            !item.keyword
          ) {
            return false;
          }


          const key =
            item.keyword
              .toLowerCase();


          if (
            seen.has(key)
          ) {
            return false;
          }


          seen.add(key);

          return true;
        }
      );


  if (
    cleanedKeywords.length >
    0
  ) {
    const {
      error:
        keywordError,
    } =
      await supabase
        .from(
          "job_keywords"
        )
        .insert(
          cleanedKeywords.map(
            (item) => ({
              job_id:
                job.id,

              keyword:
                item.keyword,

              category:
                item.category,

              importance:
                item.importance,

              company:
                input.company.trim(),

              role_title:
                input.title.trim(),
            })
          )
        );


    if (
      keywordError
    ) {
      await supabase
        .from("jobs")
        .delete()
        .eq(
          "id",
          job.id
        );


      throw new Error(
        `Could not save keywords: ${keywordError.message}`
      );
    }
  }


  return {
    job,

    keywords:
      cleanedKeywords,
  };
}


/*
 * ============================================================
 * SAVE MANUAL JOB
 * ============================================================
 */

export async function saveManualJob(
  input: {
    title: string;
    company: string;
    location: string;
    summary: string;
    seniority: string;
    employment_type: string;
    is_contract: boolean;
    contract_length: string;

    years_experience:
      number | null;

    raw_job_description:
      string;

    keywords:
      string[];
  }
) {
  const {
    data: job,
    error: jobError,
  } =
    await supabase
      .from("jobs")
      .insert({
        title:
          input.title.trim(),

        company:
          input.company.trim(),

        location:
          input.location.trim() ||
          null,

        summary:
          input.summary.trim() ||
          null,

        seniority:
          input.seniority.trim() ||
          null,

        employment_type:
          input.employment_type.trim() ||
          null,

        is_contract:
          input.is_contract,

        contract_length:
          input.is_contract
            ? input.contract_length.trim() ||
              null
            : null,

        years_experience:
          input.years_experience,

        raw_job_description:
          input.raw_job_description.trim(),

        source:
          "manual",

        job_url:
          null,
      })
      .select()
      .single();


  if (jobError) {
    throw new Error(
      `Could not save manual job: ${jobError.message}`
    );
  }


  const cleanedKeywords =
    Array.from(
      new Set(
        input.keywords
          .map(
            (keyword) =>
              keyword.trim()
          )
          .filter(Boolean)
      )
    );


  if (
    cleanedKeywords.length >
    0
  ) {
    const {
      error:
        keywordError,
    } =
      await supabase
        .from(
          "job_keywords"
        )
        .insert(
          cleanedKeywords.map(
            (keyword) => ({
              job_id:
                job.id,

              keyword,

              category:
                "other",

              importance:
                "medium",

              company:
                input.company.trim(),

              role_title:
                input.title.trim(),
            })
          )
        );


    if (
      keywordError
    ) {
      await supabase
        .from("jobs")
        .delete()
        .eq(
          "id",
          job.id
        );


      throw new Error(
        `Could not save job keywords: ${keywordError.message}`
      );
    }
  }


  return {
    job,

    keywords:
      cleanedKeywords,
  };
}


/*
 * ============================================================
 * DASHBOARD
 * ============================================================
 */

export async function fetchDashboard() {
  const [
    jobsResult,
    applicationsResult,
    analyticsResult,
  ] = await Promise.all([
    supabase
      .from("jobs")
      .select(
        `
        id,
        title,
        company,
        location,
        seniority,
        employment_type,
        created_at
        `
      )
      .order(
        "created_at",
        {
          ascending: false,
        }
      ),

    supabase
      .from("applications")
      .select(
        `
        job_id,
        status
        `
      ),

    supabase.rpc(
      "get_keyword_analytics",
      {
        start_date_param: null,
        end_date_param: null,
      }
    ),
  ]);


  if (jobsResult.error) {
    throw new Error(
      `Could not load dashboard jobs: ${jobsResult.error.message}`
    );
  }


  if (applicationsResult.error) {
    throw new Error(
      `Could not load dashboard applications: ${applicationsResult.error.message}`
    );
  }


  if (analyticsResult.error) {
    throw new Error(
      `Could not load dashboard analytics: ${analyticsResult.error.message}`
    );
  }


  const jobs =
    jobsResult.data ?? [];


  const applications =
    applicationsResult.data ?? [];


  const keywords =
    analyticsResult.data ?? [];


  /*
   * Map application status
   * against each job.
   *
   * Jobs with no application
   * row count as Saved.
   */

  const statusMap =
    new Map<string, string>();


  for (
    const application
    of applications
  ) {
    statusMap.set(
      application.job_id,
      application.status
    );
  }


  const counts = {
    saved: 0,
    applying: 0,
    applied: 0,
    interviewing: 0,
    rejected: 0,
    offer: 0,
    withdrawn: 0,
  };


  for (
    const job
    of jobs
  ) {
    const status =
      statusMap.get(
        job.id
      ) ?? "saved";


    switch (status) {
      case "applying":
        counts.applying++;
        break;

      case "applied":
        counts.applied++;
        break;

      case "interviewing":
        counts.interviewing++;
        break;

      case "rejected":
        counts.rejected++;
        break;

      case "offer":
        counts.offer++;
        break;

      case "withdrawn":
        counts.withdrawn++;
        break;

      default:
        counts.saved++;
        break;
    }
  }


  /*
   * Recent jobs
   */

  const recentJobs =
    jobs
      .slice(
        0,
        5
      )
      .map(
        (job) => ({
          ...job,

          status:
            statusMap.get(
              job.id
            ) ?? "saved",

          application_status:
            statusMap.get(
              job.id
            ) ?? "saved",
        })
      );


  /*
   * Response rate
   */

  const applicationsWithOutcome =
    counts.applied +
    counts.interviewing +
    counts.offer +
    counts.rejected;


  const positiveResponses =
    counts.interviewing +
    counts.offer;


  const responseRate =
    applicationsWithOutcome > 0
      ? Math.round(
          (
            positiveResponses /
            applicationsWithOutcome
          ) * 100
        )
      : 0;


  /*
   * Return BOTH the original
   * structure expected by Home
   * and the newer convenient
   * fields.
   */

  return {
    summary: {
      total_jobs:
        jobs.length,

      jobs_saved:
        counts.saved,

      jobs_applying:
        counts.applying,

      jobs_applied:
        counts.applied,

      jobs_interviewing:
        counts.interviewing,

      jobs_offer:
        counts.offer,

      jobs_rejected:
        counts.rejected,

      jobs_withdrawn:
        counts.withdrawn,

      response_rate:
        responseRate,

      keywords_tracked:
        keywords.length,
    },


    pipeline: {
      saved:
        counts.saved,

      applying:
        counts.applying,

      applied:
        counts.applied,

      interviewing:
        counts.interviewing,

      offer:
        counts.offer,

      rejected:
        counts.rejected,

      withdrawn:
        counts.withdrawn,
    },


    recent_jobs:
      recentJobs,


    top_keywords:
      keywords.slice(
        0,
        5
      ),


    /*
     * Extra aliases.
     */

    total_jobs:
      jobs.length,

    response_rate:
      responseRate,

    total_keywords:
      keywords.length,
  };
}

/*
 * ============================================================
 * COVER LETTER
 * ============================================================
 */

export async function fetchCoverLetter(
  jobId: string
) {
  const {
    data,
    error,
  } =
    await supabase
      .from(
        "cover_letters"
      )
      .select("*")
      .eq(
        "job_id",
        jobId
      )
      .maybeSingle();


  if (error) {
    throw new Error(
      `Could not load cover letter: ${error.message}`
    );
  }


  return data;
}


export async function saveCoverLetter(
  coverLetter: {
    job_id: string;

    company_name?:
      string | null;

    role_title?:
      string | null;

    greeting: string;

    opening: string;

    relevant_experience:
      string;

    strengths: string;

    why_company: string;

    closing: string;
  }
) {
  const now =
    new Date()
      .toISOString();


  const {
    data,
    error,
  } =
    await supabase
      .from(
        "cover_letters"
      )
      .upsert(
        {
          ...coverLetter,

          updated_at:
            now,
        },
        {
          onConflict:
            "job_id",
        }
      )
      .select()
      .single();


  if (error) {
    throw new Error(
      `Could not save cover letter: ${error.message}`
    );
  }


  return data;
}

export async function fetchJobDetails(
  jobId: string
) {
  const {
    data: job,
    error: jobError,
  } = await supabase
    .from("jobs")
    .select("*")
    .eq("id", jobId)
    .single();


  if (jobError) {
    throw new Error(
      `Could not load job: ${jobError.message}`
    );
  }


  const {
    data: keywords,
    error: keywordError,
  } = await supabase
    .from("job_keywords")
    .select(
      `
      keyword,
      category,
      importance
      `
    )
    .eq(
      "job_id",
      jobId
    );


  if (keywordError) {
    throw new Error(
      `Could not load job keywords: ${keywordError.message}`
    );
  }


  const {
    data: application,
    error: applicationError,
  } = await supabase
    .from("applications")
    .select("*")
    .eq(
      "job_id",
      jobId
    )
    .maybeSingle();


  if (applicationError) {
    throw new Error(
      `Could not load application: ${applicationError.message}`
    );
  }


  return {
    ...job,

    keywords:
      keywords ?? [],

    application:
      application ?? null,

    application_status:
      application?.status ??
      "saved",
  };
}



export async function fetchJobMLScore(
  jobId: string
) {
  const baseUrl =
    process.env
      .EXPO_PUBLIC_ML_API_URL;


  if (!baseUrl) {
    throw new Error(
      "Missing EXPO_PUBLIC_ML_API_URL."
    );
  }


  const response =
    await fetch(
      `${baseUrl}/score/job`,
      {
        method:
          "POST",

        headers: {
          "Content-Type":
            "application/json",
        },

        body:
          JSON.stringify({
            job_id:
              jobId,
          }),
      }
    );


  let data: any;


  try {
    data =
      await response.json();
  } catch {
    throw new Error(
      "ML service returned an invalid response."
    );
  }


  if (!response.ok) {
    throw new Error(
      data?.detail ??
        "Could not calculate job score."
    );
  }


  return data;
}