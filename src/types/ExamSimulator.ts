export type ExamSimulator = {
  id: string;
  created_at?: string;
  title: string;
  description: string;
  type: string;
  duration: number;
  learning_goals: string;
  is_public: boolean;
  user_id: string;
};
