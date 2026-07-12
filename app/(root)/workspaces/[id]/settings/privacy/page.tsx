import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/actions/user.actions";
import { redirect } from "next/navigation";

interface AiFileRow {
  file_id: string;
  processing_status: string;
  summary: string | null;
  tags: string[] | null;
  processed_at: string | null;
  file: {
    name: string;
  } | null;
}

interface PrivacyPageProps {
  params: Promise<{ id: string }>;
}

const PrivacyPage = async ({ params }: PrivacyPageProps) => {
  const { id: workspaceId } = await params;
  const currentUser = await getCurrentUser();
  if (!currentUser) return redirect("/sign-in");

  const supabase = createSupabaseAdmin();

  // Verify the user is a member of this workspace
  const { data: memberData } = await supabase
    .from("workspace_members")
    .select("id")
    .eq("workspace_id", workspaceId)
    .eq("user_id", currentUser.id)
    .single();

  if (!memberData) return redirect("/dashboard");

  // Fetch AI metadata stats for the workspace
  const { data: allFiles } = await supabase
    .from("files")
    .select("id")
    .eq("workspace_id", workspaceId)
    .eq("is_trashed", false);

  const fileIds = (allFiles || []).map((f) => f.id);
  const totalFiles = fileIds.length;

  // Fetch ai_metadata for all workspace files
  const { data: aiRows } = await supabase
    .from("ai_metadata")
    .select(
      "file_id, processing_status, summary, tags, processed_at, file:files!ai_metadata_file_id_fkey(name)",
    )
    .in("file_id", fileIds.length > 0 ? fileIds : ["00000000-0000-0000-0000-000000000000"]);

  const aiData = (aiRows || []) as unknown as AiFileRow[];

  const completedCount = aiData.filter(
    (r) => r.processing_status === "completed",
  ).length;
  const pendingCount = aiData.filter(
    (r) =>
      r.processing_status === "pending" ||
      r.processing_status === "processing",
  ).length;
  const notApplicableCount = aiData.filter(
    (r) => r.processing_status === "not_applicable",
  ).length;
  const failedCount = aiData.filter(
    (r) => r.processing_status === "failed",
  ).length;

  // Recently processed files (completed, limit 20)
  const recentProcessed = aiData
    .filter((r) => r.processing_status === "completed")
    .sort(
      (a, b) =>
        new Date(b.processed_at || 0).getTime() -
        new Date(a.processed_at || 0).getTime(),
    )
    .slice(0, 20);

  return (
    <div className="mx-auto max-w-4xl space-y-10 px-4 py-8">
      <div>
        <h1 className="h3 xl:h2 text-light-100 font-dynapuff tracking-wider">
          Privacy
        </h1>
        <p className="body-2 text-light-200 mt-1">
          Understand how Storey uses AI to process your files.
        </p>
      </div>

      {/* Section 1: Your AI Data */}
      <section className="space-y-6">
        <h3 className="text-lg font-semibold text-dark-100">Your AI Data</h3>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          <StatCard label="Total files" value={totalFiles} />
          <StatCard label="AI processed" value={completedCount} />
          <StatCard label="Pending" value={pendingCount} />
          <StatCard label="Not applicable" value={notApplicableCount} />
          <StatCard label="Failed" value={failedCount} />
        </div>

        {/* Processed files table */}
        {recentProcessed.length > 0 && (
          <div className="overflow-x-auto rounded-xl border border-light-400">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-light-400 bg-light-400/30">
                  <th className="px-4 py-2.5 text-left font-medium text-dark-100">
                    File
                  </th>
                  <th className="px-4 py-2.5 text-left font-medium text-dark-100">
                    Tags
                  </th>
                  <th className="px-4 py-2.5 text-left font-medium text-dark-100">
                    Summary
                  </th>
                  <th className="px-4 py-2.5 text-left font-medium text-dark-100">
                    Processed
                  </th>
                </tr>
              </thead>
              <tbody>
                {recentProcessed.map((row) => (
                  <tr
                    key={row.file_id}
                    className="border-b border-light-400 last:border-0"
                  >
                    <td className="px-4 py-2.5 text-light-100 max-w-48 truncate">
                      {row.file?.name || "Unknown"}
                    </td>
                    <td className="px-4 py-2.5 text-light-200">
                      {row.tags?.length || 0} tags
                    </td>
                    <td className="px-4 py-2.5 text-light-200">
                      {row.summary ? "✓ Yes" : "— No"}
                    </td>
                    <td className="px-4 py-2.5 text-light-200 whitespace-nowrap">
                      {row.processed_at
                        ? new Date(row.processed_at).toLocaleDateString()
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Section 2: How Storey Uses AI */}
      <section className="space-y-4">
        <h3 className="text-lg font-semibold text-dark-100">
          How Storey Uses AI
        </h3>

        <div className="space-y-4 body-2 text-light-100">
          <p>
            When you upload a document or image, Storey automatically processes
            it with Google&apos;s Gemini AI to generate descriptive tags and a
            vector embedding. This enables smart search and auto-categorization
            of your files.
          </p>

          <div>
            <p className="font-semibold text-dark-100 mb-1">
              What data is sent to Gemini:
            </p>
            <ul className="list-disc list-inside space-y-0.5 text-light-200">
              <li>File content (text extracted from documents, or image bytes)</li>
              <li>File name</li>
            </ul>
          </div>

          <div>
            <p className="font-semibold text-dark-100 mb-1">
              What is stored in your workspace:
            </p>
            <ul className="list-disc list-inside space-y-0.5 text-light-200">
              <li>AI-generated tags (3–5 short keywords per file)</li>
              <li>
                Vector embeddings (numeric representations used for semantic
                search)
              </li>
              <li>
                On-demand summaries (2–3 sentence descriptions, generated only
                when you open file details)
              </li>
            </ul>
          </div>

          <div>
            <p className="font-semibold text-dark-100 mb-1">
              What is never sent to any AI service:
            </p>
            <ul className="list-disc list-inside space-y-0.5 text-light-200">
              <li>Your identity, email address, or account information</li>
              <li>Passwords or authentication tokens</li>
              <li>Workspace metadata, member lists, or sharing settings</li>
              <li>Video, audio, archive, or code file contents</li>
            </ul>
          </div>

          <p className="text-light-200 text-xs mt-4">
            The Privacy Dashboard above shows exactly which files have been
            processed by AI, what tags were generated, and whether a summary
            exists. Use this to audit your workspace&apos;s AI data at any time.
          </p>
        </div>
      </section>
    </div>
  );
};

const StatCard = ({ label, value }: { label: string; value: number }) => (
  <div className="rounded-xl border border-light-400 p-4 text-center">
    <p className="text-2xl font-semibold text-dark-100">{value}</p>
    <p className="caption text-light-200 mt-0.5">{label}</p>
  </div>
);

export default PrivacyPage;
