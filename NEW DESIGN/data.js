/* BulletBank AI — sample data (clean, realistic resume content) */
window.BB = {
  user: { name: "Sarah Pendleton", initials: "SP", role: "Senior Marketing Manager" },

  // Bullet bank, grouped by employer + role
  bank: [
    {
      id: "nw",
      company: "Northwind Commerce",
      role: "Senior Marketing Manager",
      dates: "2021 — Present",
      color: "#3b6ea5",
      mono: "N",
      bullets: [
        { id: "nw1", text: "Orchestrated 12 integrated social campaigns across four launch quarters, lifting audience engagement <b>25% year over year</b>." },
        { id: "nw2", text: "Managed a <b>$1.4M paid media budget</b>, improving blended ROAS from 2.1x to 3.6x within nine months." },
        { id: "nw3", text: "Launched the brand's first lifecycle email program, recovering <b>18% of abandoned carts</b> and adding $720K in revenue." },
        { id: "nw4", text: "Led a cross-functional team of 6 across creative, growth, and analytics to ship the Q3 rebrand on schedule." },
      ],
    },
    {
      id: "lm",
      company: "Lumen Media",
      role: "Marketing Analyst",
      dates: "2019 — 2021",
      color: "#4a8c6f",
      mono: "L",
      bullets: [
        { id: "lm1", text: "Ran weekly <b>data analysis</b> across six acquisition channels to optimize spend allocation and pacing." },
        { id: "lm2", text: "Reduced customer acquisition cost <b>22%</b> by reallocating budget toward high-intent audience segments." },
        { id: "lm3", text: "Partnered with sales on an account-based marketing pilot that sourced <b>$480K in qualified pipeline</b>." },
      ],
    },
    {
      id: "bw",
      company: "Brightwave Studios",
      role: "Marketing Specialist",
      dates: "2017 — 2019",
      color: "#a5683b",
      mono: "B",
      bullets: [
        { id: "bw1", text: "Produced <b>40+ content assets</b> per quarter supporting three concurrent product launches." },
        { id: "bw2", text: "Grew organic social following from 8K to <b>34K</b> through a structured creator partnership program." },
      ],
    },
  ],

  // Job description for matching
  jobTitle: "Marketing Manager",
  jobCompany: "Vireo Health",
  jd: `Marketing Manager — Vireo Health

We're hiring a Marketing Manager to own integrated campaigns across paid, organic, and lifecycle. You'll lead strategic planning with cross-functional teams, run rigorous data analysis on campaign performance, and manage budget across channels.

Responsibilities
• Plan and execute multi-channel campaigns end to end
• Own weekly reporting and data analysis to improve campaign performance
• Manage media budget and forecast spend against pipeline targets
• Partner with sales and product on positioning and launches

Requirements
• 5+ years in B2C or B2B marketing with proven campaign ownership
• Strong analytical background; comfortable with attribution and ROAS
• Experience with budget management across paid channels`,

  // matched bullets (relevance-ranked subset)
  matched: [
    { id: "lm1", text: "Ran weekly <b>data analysis</b> across six acquisition channels to optimize spend allocation and pacing." },
    { id: "nw1", text: "Orchestrated 12 integrated social campaigns, lifting <b>campaign performance</b> 25% year over year." },
    { id: "nw2", text: "Managed a <b>$1.4M paid media budget</b>, improving blended ROAS from 2.1x to 3.6x." },
    { id: "lm2", text: "Reduced customer acquisition cost 22% through <b>data analysis</b> of high-intent segments." },
    { id: "lm3", text: "Partnered with sales on an ABM pilot that sourced <b>$480K in qualified pipeline</b>." },
  ],

  // AI suggestion (modal)
  suggestion: {
    original: "Managed social media campaigns.",
    enhanced: 'Orchestrated 12 integrated social campaigns for four product launches, increasing audience engagement <b>25% year over year</b>.',
    scoreOriginal: 4,
    scoreEnhanced: 9,
  },

  // extraction step rows
  extracted: [
    { company: "Northwind Commerce", role: "Senior Marketing Manager", dates: "2021 — Present", count: 4 },
    { company: "Lumen Media", role: "Marketing Analyst", dates: "2019 — 2021", count: 3 },
    { company: "Brightwave Studios", role: "Marketing Specialist", dates: "2017 — 2019", count: 2 },
  ],
};
