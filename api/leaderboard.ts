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

const defaultLeaderboards: LeaderboardEntry[] = [
  { id: '1', name: 'CyberPhantom', character: 'Neon Ninja', score: 28450, stage: 5, wins: 42, date: 'Today' },
  { id: '2', name: 'Valkyrie99', character: 'Valkyrie Mecha', score: 24100, stage: 5, wins: 36, date: 'Today' },
  { id: '3', name: 'GlitchRunner', character: 'Cyber Punk', score: 19800, stage: 4, wins: 28, date: 'Yesterday' },
  { id: '4', name: 'ShadowX', character: 'Shadow Ronin', score: 17500, stage: 4, wins: 21, date: '2d ago' },
  { id: '5', name: 'HyperPulse', character: 'Neon Ninja', score: 15320, stage: 3, wins: 15, date: '3d ago' },
  { id: '6', name: 'NovaStrike', character: 'Valkyrie Mecha', score: 12900, stage: 3, wins: 12, date: '3d ago' },
  { id: '7', name: 'AeroZero', character: 'Cyber Punk', score: 10400, stage: 2, wins: 9, date: '4d ago' },
  { id: '8', name: 'ByteMaster', character: 'Shadow Ronin', score: 8650, stage: 2, wins: 6, date: '5d ago' },
];

let cachedLeaderboard: LeaderboardEntry[] = [...defaultLeaderboards];

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
