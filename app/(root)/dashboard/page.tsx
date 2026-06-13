import Image from "next/image";
import Link from "next/link";

import ActionsDropdown from "@/components/ActionsDropdown";
import Chart from "@/components/Chart";
import FormattedDateTime from "@/components/FormattedDateTime";
import Thumbnail from "@/components/Thumbnail";
import { Separator } from "@/components/ui/separator";
import { getFiles, getTotalSpaceUsed, getStorageSnapshot } from "@/lib/actions/file.actions";
import { convertFileSize, getUsageSummary } from "@/lib/utils";
import EmptyState from "@/components/EmptyState";

const Dashboard = async () => {
  // Parallel requests
  const [files, totalSpace, snapshot] = await Promise.all([
    getFiles({ types: [], limit: 10 }),
    getTotalSpaceUsed(),
    getStorageSnapshot(),
  ]);

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

      {/* Recent files uploaded */}
      <section className="dashboard-recent-files">
        <h2 className="h3 xl:h2 text-light-100 font-dynapuff tracking-wider">
          Recently uploaded files
        </h2>
        {files.documents.length > 0 ? (
          <ul className="mt-5 flex flex-col gap-5">
            {files.documents.map((file: FileItem) => (
              <Link
                href={file.downloadUrl || file.url || "#"}
                target="_blank"
                className="flex items-center gap-3"
                key={file.id}
              >
                <Thumbnail
                  type={file.type}
                  extension={file.extension}
                  url={file.url}
                />

                <div className="recent-file-details">
                  <div className="flex flex-col gap-1">
                    <p className="recent-file-name">{file.name}</p>
                    <FormattedDateTime
                      date={file.createdAt}
                      className="caption"
                    />
                  </div>
                  <ActionsDropdown file={file} />
                </div>
              </Link>
            ))}
          </ul>
        ) : (
          <EmptyState />
        )}
      </section>
    </div>
  );
};

export default Dashboard;
