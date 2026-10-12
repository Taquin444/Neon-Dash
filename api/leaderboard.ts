import type { Request, Response } from 'express';

interface LeaderboardEntry {
  id: string;
  name: string;
  character: string;
  score: number;
  stage: number;
  wins: number;
  date: string;
}

let cachedLeaderboard: LeaderboardEntry[] = [];

export default function handler(req: Request, res: Response) {
  if (req.method === 'POST') {
    const { name, character, score, stage, wins } = req.body || {};
    if (!name || typeof score !== 'number') {
      return res.status(400).json({ error: 'Invalid payload' });
    }

    const existingIdx = cachedLeaderboard.findIndex((e) => e.name.toLowerCase() === name.toLowerCase());
    if (existingIdx >= 0) {
      if (score > cachedLeaderboard[existingIdx].score) {
        cachedLeaderboard[existingIdx].score = score;
        cachedLeaderboard[existingIdx].stage = Math.max(cachedLeaderboard[existingIdx].stage, stage || 1);
        cachedLeaderboard[existingIdx].character = character || cachedLeaderboard[existingIdx].character;
      }
      cachedLeaderboard[existingIdx].wins = Math.max(cachedLeaderboard[existingIdx].wins, wins || cachedLeaderboard[existingIdx].wins);
    } else {
      cachedLeaderboard.push({
        id: String(Date.now()),
        name,
        character: character || 'Neon Ninja',
        score,
        stage: stage || 1,
        wins: wins || 0,
        date: 'Just now',
      });
    }

    const sorted = [...cachedLeaderboard].sort((a, b) => b.score - a.score).slice(0, 20);
    return res.status(200).json({ success: true, leaderboard: sorted });
  }

  // GET
  const sorted = [...cachedLeaderboard].sort((a, b) => b.score - a.score).slice(0, 20);
  return res.status(200).json({ success: true, leaderboard: sorted });
}
