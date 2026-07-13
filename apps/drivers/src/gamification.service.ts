/**
 * Driver Gamification Service
 * Gamifies driver performance with points, levels, and rewards
 */

import { Injectable } from '@nestjs/common';

interface DriverProfile {
  id: string;
  name: string;
  level: number;
  xp: number;
  points: number;
  streak: number;
  badges: string[];
  stats: {
    totalDeliveries: number;
    onTimeDeliveries: number;
    perfectRatings: number;
    totalEarnings: number;
  };
}

interface Achievement {
  id: string;
  name: string;
  description: string;
  xpReward: number;
  pointsReward: number;
  badge: string;
  condition: (stats: any) => boolean;
}

@Injectable()
export class GamificationService {
  private driverProfiles: Map<string, DriverProfile> = new Map();
  private achievements: Achievement[] = [];

  constructor() {
    this.initializeAchievements();
  }

  /**
   * Initialize achievement definitions
   */
  private initializeAchievements(): void {
    this.achievements = [
      {
        id: 'first_delivery',
        name: 'First Delivery',
        description: 'Complete your first delivery',
        xpReward: 100,
        pointsReward: 50,
        badge: '🚀',
        condition: (stats) => stats.totalDeliveries >= 1,
      },
      {
        id: 'speed_demon',
        name: 'Speed Demon',
        description: 'Complete 10 deliveries in under 30 minutes each',
        xpReward: 500,
        pointsReward: 200,
        badge: '⚡',
        condition: (stats) => stats.totalDeliveries >= 10 && stats.onTimeDeliveries >= 9,
      },
      {
        id: 'perfectionist',
        name: 'Perfectionist',
        description: 'Get 10 perfect 5-star ratings',
        xpReward: 750,
        pointsReward: 300,
        badge: '⭐',
        condition: (stats) => stats.perfectRatings >= 10,
      },
      {
        id: 'millionaire',
        name: 'Millionaire',
        description: 'Earn $1,000 in total',
        xpReward: 1000,
        pointsReward: 500,
        badge: '💰',
        condition: (stats) => stats.totalEarnings >= 1000,
      },
      {
        id: 'streak_master',
        name: 'Streak Master',
        description: 'Maintain a 7-day delivery streak',
        xpReward: 600,
        pointsReward: 250,
        badge: '🔥',
        condition: (stats) => stats.streak >= 7,
      },
      {
        id: 'century',
        name: 'Century',
        description: 'Complete 100 deliveries',
        xpReward: 2000,
        pointsReward: 1000,
        badge: '💯',
        condition: (stats) => stats.totalDeliveries >= 100,
      },
    ];
  }

  /**
   * Get driver profile
   */
  getDriverProfile(driverId: string): DriverProfile {
    if (!this.driverProfiles.has(driverId)) {
      this.driverProfiles.set(driverId, {
        id: driverId,
        name: '',
        level: 1,
        xp: 0,
        points: 0,
        streak: 0,
        badges: [],
        stats: {
          totalDeliveries: 0,
          onTimeDeliveries: 0,
          perfectRatings: 0,
          totalEarnings: 0,
        },
      });
    }
    return this.driverProfiles.get(driverId)!;
  }

  /**
   * Record delivery completion
   */
  recordDelivery(
    driverId: string,
    onTime: boolean,
    rating: number,
    earnings: number,
  ): void {
    const profile = this.getDriverProfile(driverId);

    profile.stats.totalDeliveries++;
    if (onTime) profile.stats.onTimeDeliveries++;
    if (rating === 5) profile.stats.perfectRatings++;
    profile.stats.totalEarnings += earnings;

    // Award XP
    const baseXP = 50;
    const onTimeBonus = onTime ? 25 : 0;
    const ratingBonus = rating * 10;
    const totalXP = baseXP + onTimeBonus + ratingBonus;

    this.addXP(driverId, totalXP);

    // Award points
    const points = Math.round(earnings * 0.1);
    this.addPoints(driverId, points);

    // Update streak
    if (onTime && rating >= 4) {
      profile.streak++;
    } else {
      profile.streak = 0;
    }

    // Check achievements
    this.checkAchievements(driverId);
  }

  /**
   * Add XP to driver
   */
  addXP(driverId: string, xp: number): void {
    const profile = this.getDriverProfile(driverId);
    profile.xp += xp;

    // Check for level up
    const xpForNextLevel = this.getXPForLevel(profile.level + 1);
    while (profile.xp >= xpForNextLevel) {
      profile.xp -= xpForNextLevel;
      profile.level++;
      // Level up bonus
      profile.points += profile.level * 100;
    }
  }

  /**
   * Add points to driver
   */
  addPoints(driverId: string, points: number): void {
    const profile = this.getDriverProfile(driverId);
    profile.points += points;
  }

  /**
   * Get XP required for a level
   */
  private getXPForLevel(level: number): number {
    return Math.floor(100 * Math.pow(1.5, level - 1));
  }

  /**
   * Check and award achievements
   */
  private checkAchievements(driverId: string): void {
    const profile = this.getDriverProfile(driverId);

    for (const achievement of this.achievements) {
      if (!profile.badges.includes(achievement.badge) && achievement.condition(profile.stats)) {
        this.awardAchievement(driverId, achievement);
      }
    }
  }

  /**
   * Award achievement to driver
   */
  awardAchievement(driverId: string, achievement: Achievement): void {
    const profile = this.getDriverProfile(driverId);
    profile.badges.push(achievement.badge);
    this.addXP(driverId, achievement.xpReward);
    this.addPoints(driverId, achievement.pointsReward);
  }

  /**
   * Get leaderboard
   */
  getLeaderboard(limit: number = 10): Array<{
    driverId: string;
    level: number;
    points: number;
    totalDeliveries: number;
  }> {
    return Array.from(this.driverProfiles.values())
      .map(profile => ({
        driverId: profile.id,
        level: profile.level,
        points: profile.points,
        totalDeliveries: profile.stats.totalDeliveries,
      }))
      .sort((a, b) => b.points - a.points)
      .slice(0, limit);
  }

  /**
   * Get available rewards
   */
  getAvailableRewards(driverId: string): Array<{
    id: string;
    name: string;
    cost: number;
    description: string;
  }> {
    const profile = this.getDriverProfile(driverId);
    
    const rewards = [
      {
        id: 'bonus_earnings',
        name: 'Bonus Earnings',
        cost: 500,
        description: 'Get 10% bonus on next 10 deliveries',
      },
      {
        id: 'priority_orders',
        name: 'Priority Orders',
        cost: 300,
        description: 'Get priority access to high-value orders for 1 day',
      },
      {
        id: 'flex_schedule',
        name: 'Flexible Schedule',
        cost: 200,
        description: 'No minimum hours requirement for 1 week',
      },
      {
        id: 'fuel_discount',
        name: 'Fuel Discount',
        cost: 400,
        description: '5% fuel discount for 1 week',
      },
    ];

    return rewards.filter(reward => profile.points >= reward.cost);
  }

  /**
   * Redeem reward
   */
  redeemReward(driverId: string, rewardId: string): boolean {
    const profile = this.getDriverProfile(driverId);
    const rewards = this.getAvailableRewards(driverId);
    const reward = rewards.find(r => r.id === rewardId);

    if (!reward || profile.points < reward.cost) {
      return false;
    }

    profile.points -= reward.cost;
    return true;
  }

  /**
   * Get daily challenges
   */
  getDailyChallenges(): Array<{
    id: string;
    title: string;
    description: string;
    xpReward: number;
    pointsReward: number;
    progress: number;
    target: number;
  }> {
    return [
      {
        id: 'daily_deliveries',
        title: 'Daily Deliveries',
        description: 'Complete 15 deliveries today',
        xpReward: 200,
        pointsReward: 100,
        progress: 0,
        target: 15,
      },
      {
        id: 'on_time_streak',
        title: 'On-Time Streak',
        description: 'Complete 5 on-time deliveries in a row',
        xpReward: 150,
        pointsReward: 75,
        progress: 0,
        target: 5,
      },
      {
        id: 'perfect_ratings',
        title: 'Perfect Ratings',
        description: 'Get 5 perfect 5-star ratings',
        xpReward: 300,
        pointsReward: 150,
        progress: 0,
        target: 5,
      },
    ];
  }

  /**
   * Get level progress
   */
  getLevelProgress(driverId: string): {
    currentLevel: number;
    currentXP: number;
    xpForNextLevel: number;
    progress: number;
  } {
    const profile = this.getDriverProfile(driverId);
    const xpForNextLevel = this.getXPForLevel(profile.level + 1);
    const progress = (profile.xp / xpForNextLevel) * 100;

    return {
      currentLevel: profile.level,
      currentXP: profile.xp,
      xpForNextLevel,
      progress: Math.min(100, Math.round(progress)),
    };
  }
}
