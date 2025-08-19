export type CodeReviewTemplate = {
  id: string;
  created_at: string;
  title: string;
  description: string;
  type: "Standard" | "Github Repo";
  duration: number;
  learning_goals: string;
  is_public: boolean;
  user_id: string;
  repoUrl?: string;
  fullScan?: boolean;
};
