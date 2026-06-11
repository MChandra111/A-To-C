-- Run in Supabase SQL Editor after applying migration 002_checkin_delete_policies.sql
-- Wipes bogus check-in data and restores baseline Investment Score 0 for every roadmap.

DELETE FROM investment_scores;
DELETE FROM completions;
DELETE FROM checkins;

INSERT INTO investment_scores (user_id, roadmap_id, score, checkin_id)
SELECT a.user_id, r.id, 0, NULL
FROM roadmaps r
JOIN aspirations a ON a.id = r.aspiration_id;

UPDATE streaks SET current_streak = 0, longest_streak = 0, last_checkin_date = NULL;
