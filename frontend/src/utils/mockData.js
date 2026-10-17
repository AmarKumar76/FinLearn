/**
 * Isolated preview fixtures for Phase 2 UI demonstrations.
 * Invariants: These fixtures are strictly labeled and never stored into production user state.
 */

export const INITIAL_TRANSACTIONS = [
  {
    id: 'tx_001',
    title: 'Monthly Salary Credit',
    type: 'income',
    category: 'Salary',
    amountPaise: 6500000, // ₹65,000
    date: '2026-10-01',
    description: 'Direct payroll deposit from employer',
  },
  {
    id: 'tx_002',
    title: 'Apartment Rent',
    type: 'expense',
    category: 'Housing',
    amountPaise: 1800000, // ₹18,000
    date: '2026-10-03',
    description: 'Monthly flat rent transfer',
  },
  {
    id: 'tx_003',
    title: 'Grocery Supplies',
    type: 'expense',
    category: 'Food & Groceries',
    amountPaise: 425050, // ₹4,250.50
    date: '2026-10-07',
    description: 'Weekly organic mart provisions',
  },
  {
    id: 'tx_004',
    title: 'Broadband Fiber Bill',
    type: 'expense',
    category: 'Utilities',
    amountPaise: 119900, // ₹1,199
    date: '2026-10-10',
    description: 'High-speed home internet',
  },
  {
    id: 'tx_005',
    title: 'Freelance Design Retainer',
    type: 'income',
    category: 'Freelance',
    amountPaise: 1500000, // ₹15,000
    date: '2026-10-12',
    description: 'Brand identity consultation project',
  },
];

export const INITIAL_BUDGETS = [
  {
    id: 'bud_001',
    category: 'Food & Groceries',
    limitPaise: 1500000, // ₹15,000
    spentPaise: 845000,  // ₹8,450
    period: 'October 2026',
    thresholdPct: 80,
  },
  {
    id: 'bud_002',
    category: 'Housing & Rent',
    limitPaise: 2000000, // ₹20,000
    spentPaise: 1800000, // ₹18,000
    period: 'October 2026',
    thresholdPct: 90,
  },
  {
    id: 'bud_003',
    category: 'Transportation',
    limitPaise: 600000, // ₹6,000
    spentPaise: 320000,  // ₹3,200
    period: 'October 2026',
    thresholdPct: 80,
  },
  {
    id: 'bud_004',
    category: 'Utilities & Bills',
    limitPaise: 500000, // ₹5,000
    spentPaise: 245000,  // ₹2,450
    period: 'October 2026',
    thresholdPct: 80,
  },
];

export const INITIAL_SAVINGS_GOALS = [
  {
    id: 'sav_001',
    name: 'Emergency Reserve Fund',
    targetPaise: 15000000, // ₹1,50,000
    savedPaise: 9500000,   // ₹95,000
    targetDate: '2027-03-31',
    category: 'Security',
  },
  {
    id: 'sav_002',
    name: 'Mutual Fund SIP Accelerator',
    targetPaise: 5000000, // ₹50,000
    savedPaise: 3000000,  // ₹30,000
    targetDate: '2026-12-31',
    category: 'Investment',
  },
  {
    id: 'sav_003',
    name: 'Annual Health Insurance Premium',
    targetPaise: 1800000, // ₹18,000
    savedPaise: 1200000,  // ₹12,000
    targetDate: '2027-01-15',
    category: 'Healthcare',
  },
];

export const INITIAL_COMMITMENTS = [
  {
    id: 'com_001',
    title: 'HDFC Two-Wheeler EMI',
    type: 'EMI',
    amountPaise: 425000, // ₹4,250
    dueDate: '2026-10-15',
    recurrence: 'Monthly',
    status: 'Due Soon',
    category: 'Loan EMI',
  },
  {
    id: 'com_002',
    title: 'Nifty 50 Index Fund SIP',
    type: 'SIP',
    amountPaise: 500000, // ₹5,000
    dueDate: '2026-10-20',
    recurrence: 'Monthly',
    status: 'Scheduled',
    category: 'Investment',
  },
  {
    id: 'com_003',
    title: 'Electricity & Power Utility',
    type: 'Bill',
    amountPaise: 165000, // ₹1,650
    dueDate: '2026-10-13',
    recurrence: 'Monthly',
    status: 'Due Today',
    category: 'Utilities',
  },
  {
    id: 'com_004',
    title: 'Term Life Insurance Premium',
    type: 'Insurance',
    amountPaise: 950000, // ₹9,500
    dueDate: '2026-09-25',
    recurrence: 'Yearly',
    status: 'Paid',
    category: 'Insurance',
  },
];

export const INITIAL_COURSES = [
  {
    id: 'crs_001',
    title: 'Money Management Fundamentals',
    category: 'Budgeting',
    difficulty: 'Beginner',
    duration: '45 mins',
    lessonCount: 6,
    completedLessons: 4,
    description: 'Learn the fundamentals of income allocation, needs vs wants, and building personal emergency funds in India.',
    lessons: [
      { id: 'les_001', title: '1. The 50-30-20 Rule Adapted to Indian Costs', duration: '8 mins', isCompleted: true },
      { id: 'les_002', title: '2. Tracking Cash Flow with Precision', duration: '7 mins', isCompleted: true },
      { id: 'les_003', title: '3. Building Your Emergency Fund', duration: '10 mins', isCompleted: true },
      { id: 'les_004', title: '4. Understanding Inflation in India (CPI)', duration: '10 mins', isCompleted: true },
      { id: 'les_005', title: '5. Budgeting for Irregular & Festival Expenses', duration: '6 mins', isCompleted: false },
      { id: 'les_006', title: '6. Review & Practice Budget Exercise', duration: '4 mins', isCompleted: false },
    ],
  },
  {
    id: 'crs_002',
    title: 'Smart Borrowing & Loan Safety',
    category: 'Loans & EMI',
    difficulty: 'Intermediate',
    duration: '60 mins',
    lessonCount: 5,
    completedLessons: 1,
    description: 'Master reducing-balance loans, calculate true APR including processing fees, and avoid predatory lending apps.',
    lessons: [
      { id: 'les_201', title: '1. Fixed vs Reducing Balance Interest Rates', duration: '12 mins', isCompleted: true },
      { id: 'les_202', title: '2. Hidden Processing Fees, Foreclosure & GST', duration: '10 mins', isCompleted: false },
      { id: 'les_203', title: '3. Credit Score (CIBIL) Impact Factors', duration: '15 mins', isCompleted: false },
      { id: 'les_204', title: '4. Spotting Illegal Instant Loan Apps', duration: '12 mins', isCompleted: false },
      { id: 'les_205', title: '5. RBI Digital Lending Guidelines', duration: '11 mins', isCompleted: false },
    ],
  },
  {
    id: 'crs_003',
    title: 'Financial Safety & Cyber Fraud Prevention',
    category: 'Safety',
    difficulty: 'All Levels',
    duration: '35 mins',
    lessonCount: 4,
    completedLessons: 0,
    description: 'Essential defense against UPI PIN fraud, fake KYC scams, Telegram trading schemes, and impersonation traps.',
    lessons: [
      { id: 'les_301', title: '1. UPI PIN: Money Out, Never Money In', duration: '8 mins', isCompleted: false },
      { id: 'les_302', title: '2. Remote Access Trojan Apps (AnyDesk, TeamViewer)', duration: '10 mins', isCompleted: false },
      { id: 'les_303', title: '3. Spotting Guaranteed Return Schemes', duration: '9 mins', isCompleted: false },
      { id: 'les_304', title: '4. The Golden Hour: Reporting to 1930 & Cybercrime Portal', duration: '8 mins', isCompleted: false },
    ],
  },
  {
    id: 'crs_004',
    title: 'Investment Fundamentals & Risk Guide',
    category: 'Investments',
    difficulty: 'Beginner',
    duration: '50 mins',
    lessonCount: 5,
    completedLessons: 0,
    description: 'Understanding risk vs return across Fixed Deposits, Public Provident Fund (PPF), Mutual Funds, and Equity.',
    lessons: [
      { id: 'les_401', title: '1. The Risk-Return Spectrum in India', duration: '10 mins', isCompleted: false },
      { id: 'les_402', title: '2. Debt vs Equity: Safety vs Inflation Beating', duration: '10 mins', isCompleted: false },
      { id: 'les_403', title: '3. Systematic Investment Plans (SIP) Demystified', duration: '10 mins', isCompleted: false },
      { id: 'les_404', title: '4. Diversification & Asset Allocation', duration: '10 mins', isCompleted: false },
      { id: 'les_405', title: '5. Verifying SEBI Registered Advisers', duration: '10 mins', isCompleted: false },
    ],
  },
];

export const INITIAL_QUIZ = {
  id: 'qz_001',
  title: 'Financial Safety & Loan EMI Master Quiz',
  courseName: 'Money Management Fundamentals',
  timeMinutes: 10,
  questions: [
    {
      id: 'q1',
      question: 'When receiving money from someone via UPI, which action is required on your phone?',
      options: [
        'Enter your 4-digit or 6-digit UPI PIN to confirm receipt',
        'Share the SMS OTP received from your bank',
        'No PIN or OTP is ever needed to receive money into your account',
        'Install a remote screen sharing application for identity verification',
      ],
      correctIndex: 2,
      explanation: 'Entering a UPI PIN or sharing an OTP ALWAYS debits money from your bank account. Legitimate UPI credit transactions happen automatically without requiring your PIN.',
    },
    {
      id: 'q2',
      question: 'A lender offers a "Flat 8% interest rate" on a ₹1,00,000 personal loan for 3 years. What is the approximate true reducing-balance APR?',
      options: [
        'Approximately 8.0%',
        'Approximately 4.0%',
        'Approximately 14.5% to 15.0%',
        'Zero, because flat rates have no interest',
      ],
      correctIndex: 2,
      explanation: 'Under a flat rate, interest is calculated on the full initial principal for all 3 years even as you pay down the balance. A flat 8% rate translates to an effective reducing-balance APR of nearly 14.5%–15%.',
    },
    {
      id: 'q3',
      question: 'If you fall victim to financial cyber fraud and lose money via unauthorized UPI transfer, what should be your immediate first step?',
      options: [
        'Post about the scam on social media and wait for a response',
        'Call 1930 immediately and notify your bank to freeze transactions',
        'Contact a private hacker who promises guaranteed fund recovery for an advance fee',
        'Delete your UPI app and turn off your phone',
      ],
      correctIndex: 1,
      explanation: 'Calling 1930 within the "golden hour" alerts the Indian National Cyber Crime Reporting system and banks to freeze the fraudulent transaction path before funds are cashed out.',
    },
    {
      id: 'q4',
      question: 'Under standard reducing-balance loan calculations, if the interest rate is 0%, how is the monthly EMI calculated?',
      options: [
        'EMI cannot be calculated due to division by zero',
        'EMI = Principal divided by the number of tenure months (P / n)',
        'EMI = Principal multiplied by the loan tenure (P * n)',
        'EMI = Half of the total processing fee',
      ],
      correctIndex: 1,
      explanation: 'At 0% promotional interest, the reducing balance formula reduces to pure linear amortization: EMI = Principal / tenureMonths (P / n).',
    },
  ],
};

export const INITIAL_NOTIFICATIONS = [
  {
    id: 'notif_001',
    title: 'Bill Due Today: Electricity & Power Utility',
    message: '₹1,650 is due today (13 Oct 2026). Remember to record payment after completing.',
    time: '2 hours ago',
    type: 'commitment',
    isRead: false,
  },
  {
    id: 'notif_002',
    title: 'Budget Alert: Food & Groceries at 56%',
    message: 'You have utilized ₹8,450 out of your ₹15,000 monthly limit.',
    time: 'Yesterday',
    type: 'budget',
    isRead: false,
  },
  {
    id: 'notif_003',
    title: 'Upcoming EMI: HDFC Two-Wheeler',
    message: '₹4,250 due in 2 days on 15 Oct 2026.',
    time: '2 days ago',
    type: 'commitment',
    isRead: true,
  },
  {
    id: 'notif_004',
    title: 'New Lesson Available in Safety Lab',
    message: 'Review "The Golden Hour: Reporting to 1930 & Cybercrime Portal" to protect your finances.',
    time: '3 days ago',
    type: 'learning',
    isRead: true,
  },
];
