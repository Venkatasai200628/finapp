// The user's "normal behavior" profile. In a real deployment this would be
// learned from that user's own transaction history (rolling average/stddev
// per category) instead of hardcoded — see engine.ts for where that upgrade
// plugs in once real data (Account Aggregator or SMS) is flowing.
export const behaviorBaseline = {
  categories: [
    { category: 'Food', merchants: ['Swiggy', 'Zomato', "Domino's", 'Starbucks'], avgAmount: 380, stdDev: 180 },
    { category: 'Groceries', merchants: ['Big Bazaar', 'DMart', 'BigBasket'], avgAmount: 1400, stdDev: 600 },
    { category: 'Transport', merchants: ['Uber', 'Ola', 'IRCTC'], avgAmount: 260, stdDev: 150 },
    { category: 'Shopping', merchants: ['Amazon', 'Flipkart', 'Myntra'], avgAmount: 1600, stdDev: 900 },
    { category: 'Subscription', merchants: ['Netflix', 'Spotify', 'Hotstar'], avgAmount: 550, stdDev: 200 },
  ],
  normalHourStart: 7,
  normalHourEnd: 23,
  maxNormalAmount: 3500,
};
