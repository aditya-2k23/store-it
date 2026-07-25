import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import Chart from "@/components/Chart";
import FormattedDateTime from "@/components/FormattedDateTime";
import { Separator } from "@/components/ui/separator";
import {
  getFiles,
  getTotalSpaceUsed,
  getStorageSnapshot,
  getTrashedFiles,
} from "@/lib/actions/file.actions";
import {
  getActiveWorkspaceId,
  getUserWorkspaces,
} from "@/lib/actions/workspace.actions";
import { convertFileSize, getUsageSummary } from "@/lib/utils";
import DashboardAccordion from "@/components/DashboardAccordion";

export async function generateMetadata(): Promise<Metadata> {
  const activeWorkspaceId = await getActiveWorkspaceId();
  if (activeWorkspaceId) {
    const workspaces = await getUserWorkspaces();
    const activeWorkspace = (workspaces || []).find(
      (w: any) => w.id === activeWorkspaceId,
    );
    if (activeWorkspace) {
      return {
        title: `Storey - ${activeWorkspace.name} Dashboard`,
      };
    }
  }
  return {
    title: "Storey - Dashboard",
  };
}

const Dashboard = async () => {
  // Parallel requests
  const [files, trashedFilesRes, totalSpace, snapshot, activeWorkspaceId] =
    await Promise.all([
      getFiles({ types: [], limit: 10 }),
      getTrashedFiles(),
      getTotalSpaceUsed(),
      getStorageSnapshot().catch((err) => {
        console.error("Failed to load storage snapshot:", err);
        return null;
      }),
      getActiveWorkspaceId().catch((err) => {
        console.error("Failed to load active workspace ID:", err);
        return "";
      }),
    ]);

  const trashedFiles = trashedFilesRes?.documents?.slice(0, 10) || [];

  // Get usage summary
  const usageSummary = getUsageSummary(totalSpace);

  // Build AI insight text
  const snapshotText = snapshot
    ? `You uploaded ${snapshot.uploadedLastWeek} file${snapshot.uploadedLastWeek !== 1 ? "s" : ""} last week, mostly ${snapshot.dominantType}s. ${snapshot.aiProcessedCount} file${snapshot.aiProcessedCount !== 1 ? "s are" : " is"} AI-ready.`
    : null;

  return (
    <div className="dashboard-container">
      <section>
        <Chart
          used={totalSpace.used}
          insightText={convertFileSize(totalSpace.used ?? 0) || "0 B"}
          snapshotText={snapshotText}
          workspaceId={activeWorkspaceId || ""}
        />

        {/* Uploaded file type summaries */}
        <ul className="dashboard-summary-list">
          {usageSummary.map((summary) => (
            <Link
              href={summary.url}
              key={summary.title}
              className="dashboard-summary-card"
            >
              <div className="space-y-4">
                <div className="flex justify-between gap-3">
                  <Image
                    src={summary.icon}
                    width={100}
                    height={100}
                    alt="uploaded image"
                    className="summary-type-icon"
                    loading="eager"
                  />
                  <h4 className="summary-type-size">
                    {convertFileSize(summary.size) || 0}
                  </h4>
                </div>

                <h5 className="summary-type-title">{summary.title}</h5>
                <Separator className="bg-light-400" />
                <FormattedDateTime
                  date={summary.latestDate}
                  className="text-center"
                />
              </div>
            </Link>
          ))}
        </ul>
      </section>

      <DashboardAccordion
        uploadedFiles={files.documents}
        trashedFiles={trashedFiles}
      />
    </div>
  );
};

export default Dashboard;
