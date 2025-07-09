export type ExamSimulator = {
  id: string;
  created_at: string;
  title: string;
  description: string;
  type: "Standard" | "Github Repo" | "live-code";
  duration: number;
  learning_goals: string;
  is_public: boolean;
  user_id: string;
  repoUrl?: string; // Optional: for Github Repo type
  fullScan?: boolean; // Optional: for Github Repo type
};
