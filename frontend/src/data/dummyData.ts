import { Eye, Heart, MessageSquare, Users, type LucideIcon } from 'lucide-react';

export interface DashboardStat {
  id: string;
  label: string;
  value: string;
  change: string;
  icon: LucideIcon;
}

export interface RoommateMatch {
  id: string;
  name: string;
  age: number;
  occupation: string;
  location: string;
  budget: string;
  matchPercent: number;
  tags: string[];
}

export interface ActivityItem {
  id: string;
  text: string;
  time: string;
}

export const DASHBOARD_STATS: DashboardStat[] = [
  { id: 'matches', label: 'New Matches', value: '12', change: '+4 this week', icon: Users },
  { id: 'messages', label: 'Messages', value: '5', change: '2 unread', icon: MessageSquare },
  { id: 'saved', label: 'Saved Profiles', value: '9', change: '+1 today', icon: Heart },
  { id: 'views', label: 'Profile Views', value: '148', change: '+23% vs last week', icon: Eye },
];

export const ROOMMATE_MATCHES: RoommateMatch[] = [
  { id: 'm1', name: 'Arjun Menon', age: 26, occupation: 'Software Engineer', location: 'Technopark, Trivandrum', budget: '₹8,000 / mo', matchPercent: 94, tags: ['Non-smoker', 'Early riser', 'Vegetarian'] },
  { id: 'm2', name: 'Nithin Raj', age: 24, occupation: 'UI Designer', location: 'Kazhakkoottam', budget: '₹7,500 / mo', matchPercent: 89, tags: ['Night owl', 'Pet friendly', 'Gamer'] },
  { id: 'm3', name: 'Sreejith K', age: 27, occupation: 'Data Analyst', location: 'Pattom', budget: '₹9,000 / mo', matchPercent: 85, tags: ['Non-smoker', 'Fitness', 'Quiet'] },
];

export const RECENT_ACTIVITY: ActivityItem[] = [
  { id: 'a1', text: 'Arjun Menon viewed your profile', time: '5 min ago' },
  { id: 'a2', text: 'You have a new match: Nithin Raj (89%)', time: '1 hour ago' },
  { id: 'a3', text: 'Sreejith K sent you a message', time: 'Yesterday' },
  { id: 'a4', text: 'Complete your profile to get better matches', time: '2 days ago' },
];
