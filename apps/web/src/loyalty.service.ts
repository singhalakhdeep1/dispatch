/**
 * Customer Loyalty Program Service
 * Manages customer loyalty points, tiers, and rewards
 */

import { Injectable } from '@nestjs/common';

interface CustomerProfile {
  id: string;
  name: string;
  email: string;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  points: number;
  totalSpent: number;
  orderCount: number;
  rewards: string[];
  preferences: {
    favoriteRestaurants: string[];
    dietaryRestrictions: string[];
  };
}

interface LoyaltyTier {
  name: string;
  pointsRequired: number;
  benefits: string[];
  multiplier: number; // Points multiplier
}

interface Reward {
  id: string;
  name: string;
  description: string;
  pointsCost: number;
  tierRequired: string;
  available: boolean;
}

@Injectable()
export class LoyaltyService {
  private customerProfiles: Map<string, CustomerProfile> = new Map();
  private tiers: Map<string, LoyaltyTier> = new Map();
  private rewards: Reward[] = [];

  constructor() {
    this.initializeTiers();
    this.initializeRewards();
  }

  /**
   * Initialize loyalty tiers
   */
  private initializeTiers(): void {
    this.tiers.set('bronze', {
      name: 'Bronze',
      pointsRequired: 0,
      benefits: ['1 point per $1 spent', 'Birthday reward'],
      multiplier: 1.0,
    });

    this.tiers.set('silver', {
      name: 'Silver',
      pointsRequired: 1000,
      benefits: ['1.25x points', 'Free delivery on orders over $20', 'Priority support'],
      multiplier: 1.25,
    });

    this.tiers.set('gold', {
      name: 'Gold',
      pointsRequired: 5000,
      benefits: ['1.5x points', 'Free delivery always', 'Exclusive promotions', 'Birthday month bonus'],
      multiplier: 1.5,
    });

    this.tiers.set('platinum', {
      name: 'Platinum',
      pointsRequired: 15000,
      benefits: ['2x points', 'VIP treatment', 'Exclusive events', 'Personal concierge', 'Free premium items'],
      multiplier: 2.0,
    });
  }

  /**
   * Initialize rewards catalog
   */
  private initializeRewards(): void {
    this.rewards = [
      {
        id: 'free_delivery',
        name: 'Free Delivery',
        description: 'Free delivery on your next order',
        pointsCost: 100,
        tierRequired: 'bronze',
        available: true,
      },
      {
        id: 'discount_10',
        name: '10% Off',
        description: '10% discount on your next order',
        pointsCost: 250,
        tierRequired: 'bronze',
        available: true,
      },
      {
        id: 'free_item',
        name: 'Free Item',
        description: 'Get a free item up to $10 value',
        pointsCost: 500,
        tierRequired: 'silver',
        available: true,
      },
      {
        id: 'discount_25',
        name: '25% Off',
        description: '25% discount on your next order',
        pointsCost: 750,
        tierRequired: 'silver',
        available: true,
      },
      {
        id: 'free_meal',
        name: 'Free Meal',
        description: 'Get a free meal up to $25 value',
        pointsCost: 1500,
        tierRequired: 'gold',
        available: true,
      },
      {
        id: 'vip_access',
        name: 'VIP Access',
        description: 'Exclusive VIP access for 1 month',
        pointsCost: 3000,
        tierRequired: 'gold',
        available: true,
      },
      {
        id: 'private_event',
        name: 'Private Event',
        description: 'Private chef experience',
        pointsCost: 10000,
        tierRequired: 'platinum',
        available: true,
      },
    ];
  }

  /**
   * Get customer profile
   */
  getCustomerProfile(customerId: string): CustomerProfile {
    if (!this.customerProfiles.has(customerId)) {
      this.customerProfiles.set(customerId, {
        id: customerId,
        name: '',
        email: '',
        tier: 'bronze',
        points: 0,
        totalSpent: 0,
        orderCount: 0,
        rewards: [],
        preferences: {
          favoriteRestaurants: [],
          dietaryRestrictions: [],
        },
      });
    }
    return this.customerProfiles.get(customerId)!;
  }

  /**
   * Record order and award points
   */
  recordOrder(customerId: string, amount: number, restaurantId: string): void {
    const profile = this.getCustomerProfile(customerId);
    const tier = this.tiers.get(profile.tier)!;

    profile.totalSpent += amount;
    profile.orderCount++;

    // Award points based on tier multiplier
    const pointsEarned = Math.floor(amount * tier.multiplier);
    profile.points += pointsEarned;

    // Update favorite restaurants
    if (!profile.preferences.favoriteRestaurants.includes(restaurantId)) {
      profile.preferences.favoriteRestaurants.push(restaurantId);
      if (profile.preferences.favoriteRestaurants.length > 5) {
        profile.preferences.favoriteRestaurants.shift();
      }
    }

    // Check for tier upgrade
    this.checkTierUpgrade(customerId);
  }

  /**
   * Check and upgrade tier if eligible
   */
  private checkTierUpgrade(customerId: string): void {
    const profile = this.getCustomerProfile(customerId);

    // Check tiers in order
    const tierOrder = ['bronze', 'silver', 'gold', 'platinum'];
    const currentIndex = tierOrder.indexOf(profile.tier);

    for (let i = currentIndex + 1; i < tierOrder.length; i++) {
      const nextTier = tierOrder[i];
      const tierInfo = this.tiers.get(nextTier)!;

      if (profile.points >= tierInfo.pointsRequired) {
        profile.tier = nextTier as any;
        // Award tier upgrade bonus
        profile.points += 500;
      }
    }
  }

  /**
   * Get available rewards for customer
   */
  getAvailableRewards(customerId: string): Reward[] {
    const profile = this.getCustomerProfile(customerId);
    const tierOrder = ['bronze', 'silver', 'gold', 'platinum'];
    const currentTierIndex = tierOrder.indexOf(profile.tier);

    return this.rewards.filter(reward => {
      const rewardTierIndex = tierOrder.indexOf(reward.tierRequired);
      return rewardTierIndex <= currentTierIndex && profile.points >= reward.pointsCost;
    });
  }

  /**
   * Redeem reward
   */
  redeemReward(customerId: string, rewardId: string): boolean {
    const profile = this.getCustomerProfile(customerId);
    const reward = this.rewards.find(r => r.id === rewardId);

    if (!reward) return false;

    const availableRewards = this.getAvailableRewards(customerId);
    if (!availableRewards.find(r => r.id === rewardId)) {
      return false;
    }

    profile.points -= reward.pointsCost;
    profile.rewards.push(rewardId);

    return true;
  }

  /**
   * Get tier progress
   */
  getTierProgress(customerId: string): {
    currentTier: string;
    currentPoints: number;
    nextTier?: string;
    pointsToNextTier?: number;
    progress: number;
  } {
    const profile = this.getCustomerProfile(customerId);
    const tierOrder = ['bronze', 'silver', 'gold', 'platinum'];
    const currentIndex = tierOrder.indexOf(profile.tier);

    if (currentIndex >= tierOrder.length - 1) {
      return {
        currentTier: profile.tier,
        currentPoints: profile.points,
        progress: 100,
      };
    }

    const nextTier = tierOrder[currentIndex + 1];
    const pointsRequired = this.tiers.get(nextTier)!.pointsRequired;
    const progress = (profile.points / pointsRequired) * 100;

    return {
      currentTier: profile.tier,
      currentPoints: profile.points,
      nextTier,
      pointsToNextTier: pointsRequired - profile.points,
      progress: Math.min(100, Math.round(progress)),
    };
  }

  /**
   * Get referral bonus
   */
  processReferral(referrerId: string, referredId: string): void {
    const referrer = this.getCustomerProfile(referrerId);
    const referred = this.getCustomerProfile(referredId);

    // Award referrer
    referrer.points += 500;
    referrer.rewards.push('referral_bonus');

    // Award new customer
    referred.points += 200;
    referred.rewards.push('welcome_bonus');

    this.checkTierUpgrade(referrerId);
  }

  /**
   * Get loyalty statistics
   */
  getLoyaltyStatistics(): {
    totalCustomers: number;
    tierDistribution: Record<string, number>;
    totalPointsAwarded: number;
    totalRewardsRedeemed: number;
  } {
    const profiles = Array.from(this.customerProfiles.values());

    const tierDistribution: Record<string, number> = {
      bronze: 0,
      silver: 0,
      gold: 0,
      platinum: 0,
    };

    let totalPoints = 0;
    let totalRewards = 0;

    profiles.forEach(profile => {
      tierDistribution[profile.tier]++;
      totalPoints += profile.points;
      totalRewards += profile.rewards.length;
    });

    return {
      totalCustomers: profiles.length,
      tierDistribution,
      totalPointsAwarded: totalPoints,
      totalRewardsRedeemed: totalRewards,
    };
  }

  /**
   * Get personalized offers
   */
  getPersonalizedOffers(customerId: string): Array<{
    id: string;
    title: string;
    description: string;
    discount: number;
    expiresAt: Date;
  }> {
    const profile = this.getCustomerProfile(customerId);
    const offers = [];

    // Birthday offer
    const today = new Date();
    const birthday = new Date(profile.email); // Simplified - would use actual birthday
    if (birthday.getMonth() === today.getMonth() && birthday.getDate() === today.getDate()) {
      offers.push({
        id: 'birthday_special',
        title: 'Happy Birthday!',
        description: '20% off your order today',
        discount: 20,
        expiresAt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
      });
    }

    // Inactive customer offer
    if (profile.orderCount > 0 && profile.orderCount < 5) {
      offers.push({
        id: 'comeback',
        title: 'We Miss You!',
        description: '15% off your next order',
        discount: 15,
        expiresAt: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000),
      });
    }

    // High-value customer offer
    if (profile.totalSpent > 500) {
      offers.push({
        id: 'vip_exclusive',
        title: 'VIP Exclusive',
        description: 'Free premium item with your next order',
        discount: 0,
        expiresAt: new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000),
      });
    }

    return offers;
  }
}
