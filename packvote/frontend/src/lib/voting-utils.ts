import { Recommendation } from '@/lib/api'

/**
 * Helper to get the personalized cost for a user for a specific recommendation.
 * Falls back to the estimated cost if no specific breakdown is available.
 */
export const getUserCost = (
    rec: Recommendation,
    currentUserId: string,
    userCostBreakdown?: Record<string, Record<string, number>>
): number => {
    // Check for AI-generated breakdown in meta
    const costData = rec.cost_breakdown?.[currentUserId] || rec.meta?.cost_breakdown?.[currentUserId];

    if (costData) {
        if (typeof costData === 'object' && 'amount' in costData) {
            return costData.amount;
        }
        // If it's a string (legacy), we can't easily convert to number without parsing, 
        // but typically we want the display string anyway. 
        // For sorting/logic that needs a number, we might need to parse.
        // For now, return 0 or try to parse if it's a simple number string.
        const parsed = parseFloat(costData as string);
        return isNaN(parsed) ? (rec.estimated_cost || 0) : parsed;
    }

    // Check for passed-in breakdown (legacy/mock)
    if (userCostBreakdown && userCostBreakdown[rec.id] && userCostBreakdown[rec.id][currentUserId]) {
        return userCostBreakdown[rec.id][currentUserId]
    }
    return rec.estimated_cost || 0
}

export const getUserCostDisplay = (
    rec: Recommendation,
    currentUserId: string,
    defaultCurrency: string,
    userCostBreakdown?: Record<string, Record<string, number>>
): string => {
    // Check for AI-generated breakdown in meta
    const costData = rec.cost_breakdown?.[currentUserId] || rec.meta?.cost_breakdown?.[currentUserId];

    if (costData) {
        if (typeof costData === 'object' && 'display_string' in costData) {
            return costData.display_string;
        }
        if (typeof costData === 'string') {
            return costData;
        }
    }

    // Fallback to numeric formatting
    const cost = getUserCost(rec, currentUserId, userCostBreakdown)
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: defaultCurrency,
        maximumFractionDigits: 0
    }).format(cost)
}

/**
 * Generates a mock cost breakdown for demonstration purposes.
 * Creates slightly different costs for each user to simulate personalization.
 */
export const generateMockCostBreakdown = (
    recommendations: Recommendation[],
    userIds: string[]
): Record<string, Record<string, number>> => {
    const breakdown: Record<string, Record<string, number>> = {}

    recommendations.forEach(rec => {
        const baseCost = rec.estimated_cost || 1000
        breakdown[rec.id] = {}

        userIds.forEach(userId => {
            // Vary cost by +/- 10% based on user ID hash or random
            const variance = (Math.random() * 0.2) - 0.1
            const personalizedCost = Math.round(baseCost * (1 + variance))
            breakdown[rec.id][userId] = personalizedCost
        })
    })

    return breakdown
}

/**
 * Generates mock social proof data (who liked what).
 * Returns a map of recId -> list of userIds who liked it.
 */
export const generateMockSocialProof = (
    recommendations: Recommendation[],
    userIds: string[]
): Record<string, string[]> => {
    const socialProof: Record<string, string[]> = {}

    recommendations.forEach(rec => {
        // Randomly assign 0-3 users who "liked" this recommendation
        // We filter out the current user usually in the UI, but here we just generate for "others"
        const numLikes = Math.floor(Math.random() * 4) // 0 to 3 likes
        const shuffledUsers = [...userIds].sort(() => 0.5 - Math.random())
        socialProof[rec.id] = shuffledUsers.slice(0, numLikes)
    })

    return socialProof
}
