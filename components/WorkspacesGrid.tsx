"use client";

import WorkspaceCard from "@/components/WorkspaceCard";
import { motion } from "framer-motion";
import { staggerChildren } from "@/components/landing/animations";
import Link from "next/link";
import { Plus } from "lucide-react";

interface WorkspacesGridProps {
  workspaces: WorkspaceWithRole[];
  canCreateNew: boolean;
}

const WorkspacesGrid = ({ workspaces, canCreateNew }: WorkspacesGridProps) => {
  return (
    <motion.div
      variants={staggerChildren}
      initial="hidden"
      animate="visible"
      className="mt-10 grid w-full max-w-3xl grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
    >
      {workspaces.map((workspace) => (
        <WorkspaceCard key={workspace.id} workspace={workspace} />
      ))}

      {canCreateNew && (
        <motion.div
          variants={{
            hidden: { opacity: 0, y: 20 },
            visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
          }}
        >
          <Link
            href="/workspaces/new"
            className="flex h-full min-h-[200px] cursor-pointer flex-col items-center justify-center gap-3 rounded-[20px] border-2 border-dashed border-brand/50 p-6 text-light-200 transition-all hover:border-brand hover:text-brand"
          >
            <Plus className="size-8" />
            <span className="text-sm font-medium">New workspace</span>
          </Link>
        </motion.div>
      )}
    </motion.div>
  );
};

export default WorkspacesGrid;
