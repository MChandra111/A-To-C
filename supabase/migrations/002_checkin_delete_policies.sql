-- Allow users to delete their own check-in data (for progress repair / reset)

CREATE POLICY "Users can delete own completions"
  ON completions FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own checkins"
  ON checkins FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own investment scores"
  ON investment_scores FOR DELETE
  USING (auth.uid() = user_id);
