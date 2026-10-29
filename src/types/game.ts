export interface PlayerState {
  name: string;
  level: number;
  speed: number; // raw speed points
  wins: number;
  hearts: number;
  maxHearts: number;
  currentWorld: number;
  currentStage: number;
  highestWorld: number;
  highestStage: number;
  equippedTrailId: string;
  ownedTrailIds: string[];
  equippedSkinId: string;
  ownedSkinIds: string[];
  rebirths: number;
  rebirthMultiplier: number;
  streakMultiplier: number;
  streakCount: number;
  soundEnabled: boolean;
  totalDistanceRun: number;
}

export interface TrailItem {
  id: string;
  name: string;
  multiplier: number;
  price: number;
  color: string;
  particleColor: string;
  icon: string;
  tier: string;
}

export interface SkinItem {
  id: string;
  name: string;
  hatColor: string;
  bodyColor: string;
  pantsColor: string;
  hatType: 'tophat' | 'wizard' | 'pumpkin' | 'crown' | 'cap';
  price: number;
  currency: 'wins' | 'speed';
}

export interface WorldInfo {
  id: number;
  name: string;
  requiredLevel: number;
  stagesCount: number;
  theme: 'halloween' | 'clouds' | 'lava' | 'cyber' | 'galaxy';
  bgColor: string;
  description: string;
  accentColor: string;
}

export interface LeaderboardEntry {
  rank: number;
  name: string;
  speedText: string;
  speedValue: number;
  winsText: string;
  isPlayer?: boolean;
}

export interface MathQuestion {
  num1: number;
  num2: number;
  answer: number;
}
