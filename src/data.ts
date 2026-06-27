/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ExamInfo, NotesUnit, ExamCategoryType, HandwrittenPage } from './types';

export const EXAMS_INFO: ExamInfo[] = [
  {
    id: 'RSMSSB_BCI',
    title: 'RSMSSB BCI',
    subtitle: 'Rajasthan Basic Computer Instructor',
    badge: 'State Level',
    totalUnits: 13,
    description: 'Comprehensive notes covering Pedagogy, Tech Core, Web Development, Databases, and IT fundamentals for the Rajasthan Basic Instructor Grade.',
    thumbnailColor: 'from-blue-600 to-indigo-900',
  },
  {
    id: 'RSMSSB_SCI',
    title: 'RSMSSB SCI',
    subtitle: 'Rajasthan Senior Computer Instructor',
    badge: 'State Level',
    totalUnits: 17,
    description: 'Advanced topics in Cryptography, Cloud Computing, Parallel Systems, Compilers, and Discrete Optimization for Senior grade level.',
    thumbnailColor: 'from-slate-800 to-slate-950',
  },
  {
    id: 'UP_LT_GRADE',
    title: 'UP LT Grade Mains CS',
    subtitle: 'Uttar Pradesh TGT/PGT Computer Science',
    badge: 'PSC Exam',
    totalUnits: 13,
    description: 'Structured notes mapping to the UPPSC Computer Science Lecturer syllabus, emphasizing subjective answers and logical explanations.',
    thumbnailColor: 'from-orange-500 to-red-800',
  },
  {
    id: 'UGC_NET_CS',
    title: 'UGC NET CS',
    subtitle: 'NTA UGC NET Unit-wise CS & Applications',
    badge: 'National Level',
    totalUnits: 10,
    description: 'Top-tier comprehensive research notes outlining Theory of Computation, AI heuristic searches, Networking standards, and Data Structures.',
    thumbnailColor: 'from-cyan-900 to-teal-900',
  }
];

// Seed lists representing authentic syllabus units
const SYLLABUS_MAP: Record<ExamCategoryType, { name: string; desc: string; concept: string; schema: string }[]> = {
  RSMSSB_BCI: [
    { name: 'Pedagogy', desc: 'Teaching-learning theories, pedagogy methodologies, student evaluation models, and classroom ICT integration.', concept: 'Bloom\'s Taxonomy, formative vs summative evaluations, teaching-learning aids.', schema: 'pedagogy' },
    { name: 'Mental Ability', desc: 'Decision making, logical reasoning, data interpretation, data sufficiency, and major advancements in Information Technology.', concept: 'Data sufficiency, logical puzzles, IT sector advancements, analytical ability.', schema: 'gk' },
    { name: 'Fundamental of Computer', desc: 'Overview of Computer systems, input-output devices, scanner, pointing devices, binary data representations, and file types.', concept: 'Analog vs Digital data, binary number system representation (Decimal, Binary, Hexadecimal).', schema: 'cpp' },
    { name: 'Data Processing', desc: 'Practical workbook concepts mapping to MS-Word, MS-Excel, MS-PowerPoint, and Database tools like MS-Access.', concept: 'Spreadsheet formulas, pivot tables, presentation shortcut macros, MS-Access forms and indexes.', schema: 'dsa' },
    { name: 'Programming Fundamentals', desc: 'Principles of programming, logic compilation, variable precedence, data types, control flow, functions, arrays and pointers in C.', concept: 'Variables precedence, loop conditions, C logic syntax with structures and unions.', schema: 'coa' },
    { name: 'Data Structure and Algorithm', desc: 'Study of Abstract Data Types (ADT), Arrays, Linked Lists, Stack, Queues, Binary Trees, sorting, searching, and symbol tables.', concept: 'Tree traversals, stacks queue operations, binary search, Big-O complexity bounds.', schema: 'db' },
    { name: 'Computer Organization', desc: 'Basic computer processors architecture, CPU components, micro operations, memory organization, and Bus systems.', concept: 'Logic operations, ALU registers, instruction bus lines, main memory mapping.', schema: 'se' },
    { name: 'Operating System', desc: 'Operating system overview, CPU scheduling protocols, process management, file systems, and threads compilation.', concept: 'CPU scheduling algorithms, process states, thread lifecycle, file descriptor blocks.', schema: 'cn' },
    { name: 'Communication and Network Concepts', desc: 'Introduction to computer networks, standard network architectures and layers (OSI and TCP/IP), and networking devices.', concept: 'Router switch bridges functions, TCP/IP vs OSI model stack layers.', schema: 'web' },
    { name: 'Network Security', desc: 'Protecting systems from malware and active security threats, firewalls utility, and backup & recovery schemes.', concept: 'Symmetric encryption, backup scheduling, firewall rule configurations, threat mitigation.', schema: 'sad' },
    { name: 'DBMS', desc: 'RDBMS standard databases, relational data models, table design, integrity constraints, SQL queries, and NoSQL databases.', concept: 'Primary key constraints, E-R data models, 1NF/2NF/3NF schemas, NoSQL database structures.', schema: 'office' },
    { name: 'SAD', desc: 'Requirement gathering, feasibility reports, DFD level mapping, Structured analysis, UML class modeling, and testing plans.', concept: 'SDLC phases, UML diagrams, structured analysis, testing techniques.', schema: 'security' },
    { name: 'IoT', desc: 'Introduction to Internet technology protocols, wireless networks (LAN/MAN/WAN), sensor interfaces, and e-Commerce structures.', concept: 'IoT smart configurations, LAN/MAN/WAN layers, internet e-commerce portals.', schema: 'sys' }
  ],
  RSMSSB_SCI: [
    { name: 'Pedagogy', desc: 'Teaching-learning methodologies, computer science curriculum planning, student evaluation models, and pedagogy techniques.', concept: 'Bloom\'s Taxonomy, formative and summative teaching feedback strategies.', schema: 'pedagogy' },
    { name: 'Mental Ability', desc: 'Logical reasoning, quantitative analysis, analytical ability, data interpretation, and major IT sector advancements.', concept: 'Logical puzzles, analytics modeling, decision variables, IT advancements.', schema: 'coa' },
    { name: 'Fundamental of Computer', desc: 'Overview of Computer systems, input-output devices, scanner, pointing systems, and binary representations.', concept: 'Binary number conversions, digital vs analog data formats, processor arithmetic.', schema: 'dsa' },
    { name: 'Programming Fundamentals', desc: 'Programming principles in C, variable scopes, loop constructs, nested control statements, and pointer variables in standard compiler structures.', concept: 'Scope of variables, nested loops syntax, pointer reference models.', schema: 'parallel' },
    { name: 'OOPS With c++ and java', desc: 'Classes and objects, structures, inheritance, polymorphism, templates, exception handling mechanisms, and streams in C++ & Java.', concept: 'Operator overloading, virtual functions, event handling mechanisms, try-catch loops.', schema: 'os' },
    { name: 'Data Structure and Algorithm', desc: 'Abstract Data Types, arrays as structures, linked list, stacks, queues, binary search trees, and basic complexity calculations.', concept: 'Binary tree traversals, queues recursion loops, double linked list operations.', schema: 'se' },
    { name: 'algorithms', desc: 'Advanced algorithm analysis, Branch & Bound, Greedy approaches, Dynamic Programming systems, and Master Theorem complexity boundaries.', concept: 'Master theorem asymptotic bounds, greedy knapsack solver, complexity ratios.', schema: 'db' },
    { name: 'digital logic system', desc: 'Boolean minimization, Karnaugh Maps logic reduction, TTL & CMOS gates, and combinational/sequential circuit design.', concept: 'Minimization equations, K-maps groupings, latch circuits vs flip-flops.', schema: 'cn' },
    { name: 'Computer Organization', desc: 'Processor instruction cycles, CPU registers, instruction bus layouts, main cache mapping, cache consistency protocols, and DMA controller operations.', concept: 'Instruction cycles, cache mapping (Direct vs Associative), MESI protocols, DMA channels.', schema: 'compiler' },
    { name: 'Operating System', desc: 'CPU scheduling algorithms, process synchronization models, banker\'s deadlock resolution, thread lifecycles, and RPC process sockets.', concept: 'Banker\'s algorithm deadlock checks, RPC sockets, shell scripting commands.', schema: 'ai' },
    { name: 'DBMS', desc: 'Relational data models (RDBMS), Advanced E-R mapping, normal forms (BCNF, 4NF), locking systems, and ACID transaction schedules.', concept: 'BCNF vs 4NF, transaction isolation levels, join dependency trees.', schema: 'cloud' },
    { name: 'software engineering', desc: 'System development life cycles (SDLC), system modeling charts, SRS specifications, data flow diagrams (DFDs), and test automation models.', concept: 'Water-fall vs spiral cycles, level-1 data flow diagrams (DFDs), code debugging tests.', schema: 'iot' },
    { name: 'data and computer Networks', desc: 'Evolution of standard networks, multipacess protocols, LAN standards (802.3, 802.11), and routing congestion controls.', concept: 'OSI vs TCP/IP layer mapping, congestion control thresholds, subnetting math.', schema: 'crypto' },
    { name: 'Network Security', desc: 'Protecting systems from malware and active security threats, firewalls utility, backup rules, and system recovery schemes.', concept: 'Symmetric encryption, backup scheduling, firewall rule configurations, threat mitigation.', schema: 'devops' },
    { name: 'network security', desc: 'Mathematical structures, peer-to-peer crypto protocols (AES, DES, RSA), secure handshakes, and Ethical Hacking audits.', concept: 'Diffie-Hellman key sharing, secure hashing, primality testing algorithms, encryption rounds.', schema: 'secure2' },
    { name: 'basics of communication', desc: 'Calculations for channel capacity, signal attenuation, EM waves propagation, PCM, WDM, GSM, and CDMA multiplexing.', concept: 'Shannon-Hartley channel capacity theorem, PCM delta modulations, GSM reuse frequencies.', schema: 'discrete' },
    { name: 'web development', desc: 'HTML, CSS, XML scripts, responsive website design, publishing, and JavaScript client runtime control.', concept: 'Document Object Model, CSS styles class syntax, XML parsing web structures.', schema: 'web' }
  ],
  UP_LT_GRADE: [
    { name: 'digital logic and circuits and discrete mathematical structures', desc: 'Logic gates minimization, combinational & sequential circuits, set theory, relations, functions, and graph theory structures.', concept: 'K-Map minimization, flip-flops, set relations, recurrence relations, propositional logic calculus, group theory.', schema: 'digital' },
    { name: 'computer organization and architecture', desc: 'Bus structures, CPU register organization, instruction cycle, cache memory mapping, pipelining, and memory hierarchies.', concept: 'Addressing modes, IEEE 754 floating point standard, processor pipelining hazards, cache hit ratios.', schema: 'coa' },
    { name: 'data structure and algorithmn', desc: 'Syllabus-wise arrays, stacks, queues, linked lists, trees, graphs representations, search methodologies, and sorting complexities.', concept: 'AVL tree balancing, heap structures, BFS and DFS graph traversals, Big-Oh time-space complexity metrics.', schema: 'dsa' },
    { name: 'c programming', desc: 'Core C constructs, storage classes, variable scoping, pointers arithmetic, recursive functions, structures and unions.', concept: 'Pointer arithmetic rules, dynamic memory allocation (malloc/calloc), structure padding configurations.', schema: 'cpp' },
    { name: 'object oriented techniques', desc: 'Major OOP paradigms, constructor overloading, inheritance hierarchies, virtual functions, polymorphism, and try-catch handling.', concept: 'Encapsulation boundaries, virtual destructors, runtime polymorphism, function templates in C++ and Java classes.', schema: 'oop' },
    { name: 'operating system', desc: 'Process execution states, CPU scheduling protocols, semaphores, deadlock resolution, virtual memory page replacement, and disk scheduling.', concept: 'Banker\'s algorithm deadlock checks, SJF/Round-robin scheduling, LRU page replacement, SSTF disk reads.', schema: 'os' },
    { name: 'database management system', desc: 'Relational data models (RDBMS), E-R structural diagrams, normalization forms, SQL syntax, locking protocols, and ACID properties.', concept: '1NF/2NF/3NF/BCNF functional dependencies, Join queries, transaction serialization, two-phase locking schedules.', schema: 'db' },
    { name: 'computer networks', desc: 'OSI standards, TCP/IP protocol suites, IP address subnetting, sliding window flow control, and routing algorithms.', concept: 'CIDR subnet masking, selective repeat ARQ, Distance-Vector vs Link-State routing protocols.', schema: 'cn' },
    { name: 'software engineering', desc: 'Software development lifecycle models, requirement SRS specifications, modular coupling and cohesion, and system testing methods.', concept: 'Spiral vs Waterfall lifecycles, Cyclomatic complexity scoring, white-box and black-box verification models.', schema: 'se' },
    { name: 'internet technology,web design and web technology', desc: 'Web structures using HTML, CSS styles, client-side Javascript engine, XML, Servlets, and cookie session tracking.', concept: 'Document Object Model (DOM), CSS layout rules, HTTP request states, AJAX client-server connection blocks.', schema: 'web' },
    { name: 'system analysis and design', desc: 'System development planning, feasibility analyses, Data Flow Diagrams (DFDs), UML class models, and launch procedures.', concept: 'Context-level diagrams, Level-1 DFD flowcharts, system deployment strategies, design methodologies.', schema: 'sad' },
    { name: 'information security and cyber laws', desc: 'Symmetric & asymmetric cryptography (AES, RSA), digital signatures, network firewalls, and IT Law regulations.', concept: 'Public-private key generations, IT Act specifications, Trojan/virus mitigation, digital certification authorities.', schema: 'security' },
    { name: 'computer graphics', desc: 'Video screen displays, scan conversion logic, 2D and 3D matrix transforms, and line clipping algorithms.', concept: 'Bresenham\'s line drawing formulas, translation/rotation matrices, Liang-Barsky line clipping, viewports.', schema: 'graphics' }
  ],
  UGC_NET_CS: [
    { name: 'Discrete Structures and Optimisation', desc: 'Mathematical logic, sets, relations, functions, group theory, combinatorics, graph theory, and linear programming optimization.', concept: 'Propositional logic calculus, recurrence relations, Euler walks, simplex method, duality in LPP.', schema: 'discrete' },
    { name: 'Computer System Architecture', desc: 'Digital logic gates, instruction codes, register transfer, CPU design, microprogrammed control, pipeline structures, and memory hierarchies.', concept: 'Instruction pipelining hazards, cache mapping lines, addressing modes, IEEE 754 float representation.', schema: 'coa' },
    { name: 'Programming Languages and Computer Graphics', desc: 'Language design paradigms, storage allocation, object-oriented concepts, and 2D/3D scan conversions, line drawing, and clipping algorithms.', concept: 'Virtual functions, scope parameters, Bresenham line and circle formulas, 3D translation/rotation matrices.', schema: 'graphics' },
    { name: 'Database Management Systems', desc: 'Relational model, SQL commands, functional dependencies, normalization (up to 5NF), transaction handling, serializability, and concurrency protocols.', concept: 'BCNF/4NF/5NF checking, conflict serializability, two-phase locking schedules, transaction rollback logs.', schema: 'db' },
    { name: 'System Software and Operating System', desc: 'Assemblers, compilers, process states, CPU scheduling, semaphores, deadlocks mitigation, demand paging, and storage layouts.', concept: 'Banker\'s deadlock checklist, Peterson\'s mutual exclusion, LRU index page replacement, thread schedules.', schema: 'os' },
    { name: 'Software Engineering', desc: 'Software lifecycles, Agile scrum, SRS specs, COCOMO estimation, cohesion & coupling levels, and software testing mechanisms.', concept: 'COCOMO II formula, White-box vs Black-box, software metric checks, agile velocity metrics.', schema: 'se' },
    { name: 'Data Structures and Algorithms', desc: 'Arrays, linked lists, stacks, queues, AVL trees, heaps, search/sorting, divide-and-conquer, greedy designs, and dynamic programming.', concept: 'Kruskal\'s/Prim\'s spanning tree, Heapification logic, binary tree traversals, asymptotic Big-O runtime analysis.', schema: 'dsa' },
    { name: 'Theory of Computation and Compilers', desc: 'Regular and context-free languages, pushdown automata, Turing machines, lexical audits, parsing models, and intermediate code generator transforms.', concept: 'Chomsky hierarchy limits, LL(1) vs LR(1) parser tables, three-address codes, decidability proofs.', schema: 'automata' },
    { name: 'Data Communication and Computer Networks', desc: 'Network models, physical layer, sliding window protocols, IPv4/IPv6 subnet scaling, routing algorithms, transport layer protocols, and cryptography logic.', concept: 'Selective-Repeat ARQ math, CIDR IP addresses, TCP congestion window, RSA/AES key generations.', schema: 'cn' },
    { name: 'Artificial Intelligence (AI)', desc: 'State space searches, heuristic controls (A*, AO*), game playing minimax with alpha-beta prunings, knowledge representations, and neural networks.', concept: 'Admissible metrics in A*, Alpha-Beta pruning cutoffs, fuzzy set logic, activation functions.', schema: 'ai' }
  ]
};

// Generates high-fidelity page mockups dynamically to save code size while keeping contents rich
function generatePages(examId: ExamCategoryType, unitNum: number, name: string, concept: string, isDemo: boolean): HandwrittenPage[] {
  const pages: HandwrittenPage[] = [];
  const totalPages = isDemo ? 2 : 5;

  for (let i = 1; i <= totalPages; i++) {
    const pageNumber = i;
    let title = `Unit ${unitNum} — ${name} (Page ${pageNumber})`;
    let paragraphs: string[] = [];
    let drawings: HandwrittenPage['drawings'] = [];

    if (pageNumber === 1) {
      paragraphs = [
        `✍️ TOPIC OVERVIEW & KEY QUESTION IN ${examId} EXAMS:`,
        `Q: What are the primary rules governing "${name}"? Why is it fundamental for competitive tests?`,
        `👉 In this note, we break down "${name}" strictly according to the syllabus. We focus on ${concept}.`,
        `⚠️ CONCEPT CHECK FOR EXAM: Examiner often tests core definitions! Highlight and remember:`,
        `1. Theoretical underpinnings: Real-world problems are modeled mathematically to bypass resource bottlenecks.`,
        `2. Efficiency targets: We always seek to optimize spatial complexity and time metrics simultaneously (Aim for O(1) or O(log N) operations).`
      ];

      // Add a drawing for Page 1
      drawings = [
        {
          type: 'gate',
          title: '🔥 CORE SYLLABUS ARCHITECTURE (HAND-RAWN SCHEMATIC) 🔥',
          items: [
            '  [EXAM HIGH PRIORITY]  ',
            '┌────────────────────────┐',
            `│   INPUT: ${name.toUpperCase()} │`,
            '└───────────┬────────────┘',
            '            │ (Syllabus Process)',
            '            ▼',
            '┌────────────────────────┐',
            '│  ANALYSIS & CRITERIA   │',
            '│  - Spatial Overhead    │',
            '│  - Temporal Complexity │',
            '└───────────┬────────────┘',
            '            │ (Exam Target)',
            '            ▼',
            '┌────────────────────────┐',
            `│ 🔥 OUTCOME: ₹20 UNIT 🔥 │`,
            '└────────────────────────┘'
          ]
        }
      ];
    } else if (pageNumber === 2) {
      // Numerical / formula / diagram page
      paragraphs = [
        `💡 DETAILED FORMULAS & CALCULATION TRICK:`,
        `When trying to solve ${concept} problems under high time-pressure (typical of ${examId} papers):`,
        `📍 TRICK: Note that we can omit constant base multipliers in Big-O asymptotic comparisons. Just compare terminal degrees!`,
        `🎯 FORMULA LIST:`,
        `• Base Equation: T(n) = a*T(n/b) + f(n)`,
        `• Critical Bound: log_b(a) controls the complexity divide.`,
        `• If f(n) = O(n^c) where c < log_b(a), then complexity is O(n^(log_b(a))) [CASE 1 of Master Theorem!]`
      ];

      drawings = [
        {
          type: 'formula',
          title: '🧮 STEP-BY-STEP NUMERICAL SOLVER 🧮',
          items: [
            'Solve: T(n) = 8T(n/2) + O(n^2)',
            '  Here: a = 8, b = 2, f(n) = O(n^2)',
            '  Step 1: Calculate log_b(a) = log_2(8) = 3',
            '  Step 2: Compare with f(n) behavior (power is c = 2)',
            '  Step 3: Since 2 < 3 (c < log_b(a)), Case 1 applies!',
            '  Result: Complexity is O(n^3)! 🌟 [Guaranteed 2 Marks!]'
          ]
        }
      ];
    } else {
      // Full pages only
      paragraphs = [
        `⭐ EXAM SOLVED QUESTIONS (MOCK PRACTICE) — ONLY IN PAID notes:`,
        `Q. Describe the structural challenges in standard ${concept} systems.`,
        `Ans: The primary bottleneck is relational validation. When client networks send unsorted queries, standard nodes can choke. We resolve this using specific buffer registers.`,
        `✔️ KEY ADVANTAGE: Our handwritten short-cuts provide direct visual mappings which are 3x faster to recall in the exam hall than standard textbook paragraphs!`
      ];

      drawings = [
        {
          type: 'table',
          title: '📋 COMPARISON MATRIX (EXAM SHORTCUT) 📋',
          items: [
            '| Feature       | Textbook Method | HandScript Notes |',
            '|---------------|-----------------|------------------|',
            '| Prep-Time     | 30+ Pages       | 2 Ruled Sheets   |',
            '| Retention     | 40% (Rote)      | 95% (Visual)     |',
            '| Exam Speed    | Slow Formulas   | Direct Tricks    |',
            '| Price         | ₹400 Book       | ₹20 of Action!   |'
          ]
        }
      ];
    }

    pages.push({ pageNumber, title, paragraphs, drawings });
  }

  return pages;
}

// Generate the fully pre-seeded list of notes
const TEACHING_APTITUDE_PAGES: HandwrittenPage[] = [
  {
    pageNumber: 1,
    title: "Teaching Aptitude — Summary of Learning Theories",
    paragraphs: [
      "① Behaviourism (Stimulus-Response Theories)",
      "Given By: John B. Watson (\"Father of Behaviorism\")",
      "Extended by others: B.F. Skinner, Ivan Pavlov, Edward Thorndike",
      "Focus: Observable behaviour ➔ Learning = Behaviour change.",
      "",
      "(a) Pavlov — Classical Conditioning",
      "➔ Founder: Ivan Pavlov",
      "➔ Idea: Learning occurs by associating a neutral stimulus with a natural stimulus.",
      "➔ Experiment: Dog Salivation Experiment.",
      "➔ Keywords: Neutral stimulus, Conditioned stimulus, Conditioned response.",
      "➔ Example: Bell ➔ Food ➔ Salivation (Dog)"
    ],
    drawings: [
      {
        type: "formula",
        title: "PAVLOV'S CONDITIONING FLOW",
        items: [
          "Unconditioned Stimulus (Food)  ──➔ Unconditioned Response (Salivation)",
          "Neutral Stimulus (Bell) + Food  ──➔ Unconditioned Response (Salivation)",
          "Conditioned Stimulus (Bell Only) ─➔ Conditioned Response (Salivation)"
        ]
      }
    ]
  },
  {
    pageNumber: 2,
    title: "Behaviourism — Operant Conditioning & Trial & Error",
    paragraphs: [
      "(b) Skinner — Operant Conditioning",
      "➔ Founder: B.F. Skinner",
      "➔ Idea: Behaviour is shaped by reinforcement.",
      "➔ Types of Reinforcement:",
      "    • Positive ➔ reward (introducing pleasant stimulus)",
      "    • Negative ➔ removal of unpleasant state",
      "    • Punishment ➔ discourages behaviour",
      "",
      "(c) Thorndike — Trial & Error Learning",
      "➔ Founder: E.L. Thorndike (Edward Thorndike)",
      "➔ Idea: Learning occurs by repeated attempts, and success strengthens the connection.",
      "➔ Experiment: \"Hungry Cat in Puzzle Box\"",
      "    • Hungry cat placed in a puzzle box that can be opened by pulling a lever.",
      "    • Cat tries and errs again and again. Randomly, one attempt is successful to get food outside the box.",
      "➔ Laws of Learning:",
      "    • Law of Readiness",
      "    • Law of Exercise",
      "    • Law of Effect"
    ]
  },
  {
    pageNumber: 3,
    title: "Cognitivism — Jean Piaget & Jerome Bruner",
    paragraphs: [
      "② Cognitivism [Mental Processes]",
      "➔ Father of Cognitivism = \"Jean Piaget\"",
      "➔ Extended by others: Bruner, Kohler, Tolman",
      "➔ Focus: Internal Mental Processes — thinking, reasoning, memory.",
      "",
      "a) Piaget — Cognitive Development Theory",
      "➔ Founder: Jean Piaget",
      "➔ Stages of Development:",
      "    1) Sensory motor (0-2 years)",
      "    2) Pre-operational (2-7 years)",
      "    3) Concrete operational (7-11 years)",
      "    4) Formal operational (11+ years)",
      "",
      "b) Bruner — Discovery Learning",
      "➔ Founder: Jerome Bruner",
      "➔ Ideas: Students learn best by discovering the concept themselves.",
      "➔ Modes of Representation:",
      "    1) Enactive (action-based)",
      "    2) Iconic (image-based)",
      "    3) Symbolic (language-based)"
    ]
  },
  {
    pageNumber: 4,
    title: "Cognitivism — Insight & Sign/Gestalt Learning",
    paragraphs: [
      "c) Kohler — Insight Learning",
      "➔ Founder: Wolfgang Kohler",
      "➔ Idea: Learning occurs by sudden Insight, NOT by Trial & Error.",
      "➔ Experiment: \"Sultan\" (Chimpanzee) in a cage",
      "    • Sultan uses two sticks, joins them together to pull banana placed outside the cage, and eats it.",
      "",
      "d) Tolman — Sign / Gestalt Learning",
      "➔ Founder: Edward Tolman",
      "➔ Idea: Learning involves cognitive maps and expectation. Stimulus-Stimulus relation."
    ],
    drawings: [
      {
        type: "flow",
        title: "INSIGHT VS TRIAL & ERROR",
        items: [
          "Trial & Error: [Cat] ────➔ Blind Attempts ────➔ Random Success",
          "Insight:       [Sultan] ──➔ Cognitive Gap ────➔ Sudden 'Aha!' Moment"
        ]
      }
    ]
  },
  {
    pageNumber: 5,
    title: "Humanistic Learning Theories",
    paragraphs: [
      "③ Humanistic Learning Theories",
      "➔ Founder/Father of Humanistics = \"Abraham Maslow\"",
      "➔ Focus: Personal Growth, emotions, freedom, self-actualization.",
      "",
      "a) Maslow — Hierarchy of Needs",
      "➔ Levels of Needs (from bottom to top):",
      "    a) Physiological Needs (food, water)",
      "    b) Safety Needs (shelter, security)",
      "    c) Love / Belongingness",
      "    d) Esteem Needs",
      "    e) Self-actualization (realizing potential)",
      "➔ Idea: Basic needs must be met before higher learning can be achieved.",
      "",
      "b) Carl Rogers — Experiential Learning",
      "➔ Founder: Carl Rogers",
      "➔ Idea: Learning is meaningful when self-initiated and connected to core experience.",
      "➔ Teacher's Role: Facilitator, NOT Dictator.",
      "➔ Classroom Atmosphere: Focus on freedom, openness, and a supportive environment."
    ]
  },
  {
    pageNumber: 6,
    title: "Social Learning Theory & Constructivism",
    paragraphs: [
      "④ Social Learning Theory — Bandura",
      "➔ Type: Observational Learning.",
      "➔ Founder: Albert Bandura",
      "➔ Idea: Learning occurs by observing and social modeling.",
      "➔ Key Concepts: Modeling, Imitation, Vicarious Reinforcement.",
      "➔ Experiment: Bobo Doll Experiment.",
      "➔ Classroom Use: Teachers should act as positive Role Models.",
      "",
      "⑤ Constructivism Theory",
      "➔ Founders: Jean Piaget / Lev Vygotsky",
      "➔ a) Vygotsky — Social Constructivism",
      "➔ Founder: Lev Vygotsky",
      "➔ Key Ideas:",
      "    • ZPD (Zone of Proximal Development) — Gap between what a student can do alone vs. with assistance.",
      "    • Scaffolding — Temporary support provided by a More Knowledgeability Other (MKO).",
      "    • Social Interaction & Language as primary learning tools."
    ]
  },
  {
    pageNumber: 7,
    title: "Activity Learning, Gestalt, and Gagne's Conditions",
    paragraphs: [
      "b) John Dewey — Learning by Doing",
      "➔ Idea: Education should be based on active student activity and experience.",
      "",
      "⑥ Connectionism",
      "➔ Founder: Edward L. Thorndike",
      "➔ Idea: Learning is the formation of physical/mental connections between Stimulus and Response.",
      "➔ Note: It is technically a component of behaviourism but historically treated separately.",
      "",
      "⑦ Gestalt Theory",
      "➔ Key figures: Max Wertheimer, Kurt Koffka",
      "➔ Idea: The \"Whole\" is greater than the sum of its parts. Emphasizes structured problem-solving and meaningful learning.",
      "",
      "⑧ Gagne's Conditions of Learning",
      "➔ Founder: Robert Gagne",
      "➔ Idea: Defined 8 sequential types of learning and 9 instructional events.",
      "➔ Focus: Scientific design of effective instructional teaching."
    ]
  },
  {
    pageNumber: 8,
    title: "Experiential Learning & Information Processing",
    paragraphs: [
      "⑨ Experiential Learning — Kolb Cycle",
      "➔ Founder: David Kolb",
      "➔ The 4-Stage Learning Cycle:",
      "    1. Concrete Experience (Feel)",
      "    2. Reflective Observation (Watch)",
      "    3. Abstract Conceptualization (Think)",
      "    4. Active Experimentation (Do)",
      "➔ Quad Styles: Accommodating (Feel & Do), Diverging (Feel & Watch), Assimilating (Watch & Think), Converging (Think & Do).",
      "",
      "⑩ Information Processing Theory",
      "➔ Founder: Richard Atkinson & Richard Shiffrin (initiated by George Miller's Magic Number 7±2)",
      "➔ Idea: Mind operates like a Computer (Input ➔ Process ➔ Output Memory).",
      "➔ Memory Store Types:",
      "    • Sensory Memory (extremely brief store)",
      "    • Short-term Memory (Working memory, limited capacity)",
      "    • Long-term Memory (Infinite storage, organized schema)",
      "➔ Atkinson-Shiffrin Model (1968 Memory Flow)."
    ]
  },
  {
    pageNumber: 9,
    title: "Adult Learning (Andragogy) & Self-Determination",
    paragraphs: [
      "⑪ Adult Learning Theory — Knowles",
      "➔ Founder: Malcolm Knowles (Andragogy Framework)",
      "➔ Five Core Assumptions of Adult Learners:",
      "    1) Self-Concept (movement from dependency to self-direction)",
      "    2) Experience (as rich resource for learning)",
      "    3) Readiness to Learn (linked to developmental tasks)",
      "    4) Orientation of Learning (problem-centered vs. subject-centered)",
      "    5) Motivation to Learn (primarily driven by internal factors)",
      "",
      "⑫ Self-Determination Theory (SDT)",
      "➔ Key figures: Richard Ryan & Edward Deci",
      "➔ Based on: Human Motivation dynamics.",
      "➔ Core Psychological Needs:",
      "    • Autonomy (control over one's own actions)",
      "    • Competence (feeling effective in activities)",
      "    • Relatedness (connection with others)"
    ]
  },
  {
    pageNumber: 10,
    title: "Kohlberg's Schema of Moral Development",
    paragraphs: [
      "⑬ Kohlberg's Theory of Moral Development",
      "➔ Founder: Lawrence Kohlberg",
      "➔ Concept: Explains formulation of Moral Reasoning (Right vs. Wrong evaluation).",
      "➔ Framework: Progresses through 3 Levels and 6 distinctive sequential Stages.",
      "",
      "【LEVEL 1】: Pre-Conventional Level [Ages 4-10 Years]",
      "• Stage 1: Punishment and Obedience Orientation",
      "  ➔ Right is defined as obeying rules directly to avoid physical punishment.",
      "• Stage 2: Individualism and Instrumental Purpose",
      "  ➔ Focused on mutual benefit: \"You scratch my back, I'll scratch yours.\" driven by Self-Interest.",
      "",
      "【LEVEL 2】: Conventional Level [Ages 10-16 Years]",
      "• Stage 3: Good Boy / Good Girl Orientation",
      "  ➔ Right behavior is what pleases or is approved by domestic peers & family.",
      "• Stage 4: Law and Order Orientation",
      "  ➔ Focuses on social order, respect for authority, and duty to rules."
    ]
  },
  {
    pageNumber: 11,
    title: "Post-Conventional Morality & Meaningful learning",
    paragraphs: [
      "【LEVEL 3】: Post-Conventional Level [Ages 16+ Years]",
      "• Stage 5: Social Contract Orientation",
      "  ➔ Rules are understood as social contracts. Morals can challenge laws if laws are not serving the demographic majority.",
      "• Stage 6: Universal Ethical Principles",
      "  ➔ Conduct is governed by self-chosen abstract moral principles (justice, equality).",
      "",
      "⑭ Ausubel's Meaningful Learning Theory",
      "➔ Founder: David Ausubel",
      "➔ Concept: Promotes Meaningful Verbal Learning in school.",
      "➔ Principle: New knowledge is integrated only when linked specifically to a solid scaffold of prior knowledge structures."
    ]
  },
  {
    pageNumber: 12,
    title: "Models of Teaching — Information Processing Models",
    paragraphs: [
      "MODELS OF TEACHING",
      "1) INFORMATION PROCESSING MODELS",
      "",
      "a) CAM [Concept Attainment Model] — Jerome Bruner",
      "• Learners identify a specific concept by comparing structured positive vs. negative examples (Yes/No examples).",
      "• Phases of CAM:",
      "    ➔ Phase 1: Presentation of Data (with identified positive/negative labels)",
      "    ➔ Phase 2: Testing Attainment of the Concept (by sorting unlabeled samples)",
      "    ➔ Phase 3: Analysis of Cognitive Thinking Strategies",
      "",
      "b) ITM [Inquiry Training Model] — Richard Suchman",
      "• Students investigate scientific problems by asking targeted questions.",
      "• Focus: Logical reasoning, scientific inquiry methodology.",
      "",
      "c) Inductive Thinking Model — Hilda Taba",
      "• Approach: Moves strictly from Specific instances to General principles.",
      "• Three Core Phases:",
      "    ➔ Data Collection ➔ Grouping items ➔ Generalization ➔ Creating categories"
    ],
    drawings: [
      {
        type: "flow",
        title: "BRUNER'S CAM FLOW DIAGRAM",
        items: [
          "  [ Phase 1: Present Examples ] ──➔ Yes/No labels display",
          "  [ Phase 2: Test Attainment ]   ──➔ Sort unlabeled cards",
          "  [ Phase 3: Analysis ]         ──➔ Map thought strategies"
        ]
      }
    ]
  },
  {
    pageNumber: 13,
    title: "Models of Teaching — Advance Organizer & Personal Models",
    paragraphs: [
      "d) AOM [Advance Organizer Model] — David Ausubel",
      "• Concept: The teacher presents high-precedence introductory material (organizers) before the core lesson.",
      "• Purpose: To establish a cognitive bridge, linking new study material to prior knowledge.",
      "• Types of Organizers:",
      "    ➔ Comparative (highlight similarities/differences)",
      "    ➔ Expository (provides context for unfamiliar concepts)",
      "",
      "2) PERSONAL MODELS",
      "• Core Focus: Self-Development, individual growth, emotional health, and personal interpretation.",
      "",
      "a) Non-Directive Teaching Model — Carl Rogers",
      "• Role of Teacher: Serving as a Facilitator, NOT an authoritarian Dictator.",
      "• Principle: Students lead their own learning, choose developmental activities.",
      "• Environment: Focus is on complete freedom, acceptance, and deep empathy.",
      "",
      "b) Awareness Training Model — Fritz Perls (Gestalt approach)",
      "• Goal: Helping pupils develop acute awareness of internal feelings and physical self-understanding."
    ],
    drawings: [
      {
        type: "gate",
        title: "AUSUBEL'S AOM STRUCTURE",
        items: [
          " ┌───────────────┐",
          " │ PRIOR LEARNER ├───────────┐",
          " │   KNOWLEDGE   │           │",
          " └───────────────┘           ▼",
          "                    ┌─────────────────┐",
          "                    │ADVANCE ORGANIZER│",
          "                    └────────┬────────┘",
          " ┌───────────────┐           │",
          " │ NEW SYLLABUS  ├───────────┘",
          " │   MATERIAL    │",
          " └───────────────┘"
        ]
      }
    ]
  },
  {
    pageNumber: 14,
    title: "Models of Teaching — Classroom, Social, and Jurisprudential",
    paragraphs: [
      "c) Classroom Meeting Model — William Glasser",
      "• Method: Conducting democratic classroom discussions to model social responsibility.",
      "",
      "3) SOCIAL INTERACTION MODELS",
      "",
      "a) Group Investigation Model — Herbert Sharan & Yael Sharan",
      "• Methodology: Students work collaboratively in small groups to investigate topics.",
      "• Flow: Collaborative query ➔ Research execution ➔ Peer presentation.",
      "",
      "b) Social Inquiry Model — Byron Massialas & others",
      "• Main focus: Used primarily for debating controversial sociological issues and moral education.",
      "",
      "c) Role Playing Model — Fannie Shaftel & George Shaftel",
      "• Process: Students act out structured roles to explore hidden feelings, interpersonal conflicts, and real-life ethical scenarios.",
      "",
      "d) Jurisprudential Model — Donald Oliver & James Shaver",
      "• Approach: Debating major public policy issues in a systematic format.",
      "• Objectives: Cultivates democratic values alongside analytical reasoning."
    ]
  },
  {
    pageNumber: 15,
    title: "Models of Teaching — Behavioural Modification",
    paragraphs: [
      "4) BEHAVIOURAL MODIFICATION MODELS",
      "",
      "a) Mastery Learning Model — Benjamin Bloom",
      "• Axiom: All students can master the curriculum if provided with sufficient time and specific helper learning aids.",
      "• Sequential Process:",
      "  ┌─────────────────────┐",
      "  │ Initial Instruction ├──────┐",
      "  └─────────────────────┘      ▼",
      "  ┌─────────────────────┐",
      "  │Formative Assessment ├──────┐ Try remedial steps if failed",
      "  └─────────────────────┘      ▼",
      "  ┌─────────────────────┐",
      "  │Corrective Teachings ├──────┐ Only for students lacking scores",
      "  └─────────────────────┘      ▼",
      "  ┌─────────────────────┐",
      "  │   Summative Test    │",
      "  └─────────────────────┘",
      "",
      "b) Direct Instruction Model — Siegfried Engelmann",
      "• Characteristics: Highly structured, teacher-led, sequence-driven, step-by-step guidance. Ideal for foundational basic skills.",
      "",
      "c) Operant Conditioning Model — B.F. Skinner",
      "• Method: Breaking subjects down into tiny steps accompanied by immediate positive reinforcement feedback."
    ]
  },
  {
    pageNumber: 16,
    title: "Teaching Levels — Memory, Understanding & Reflective",
    paragraphs: [
      "TEACHING LEVELS",
      "",
      "(1) Memory Level ➔ Herbartian Model",
      "• Focuses on rote memorization, retrieval of facts without deep conceptual parsing.",
      "• Teacher-centered instruction.",
      "",
      "(2) Understanding Level ➔ H.C. Morrison Model",
      "• Emphasizes generalization, comprehending relations between structures, and application rules.",
      "• Interactive exploration.",
      "",
      "(3) Reflective Level ➔ Hunt Model",
      "• Cultivates evaluation, problem-solving reasoning, self-reflection, and critical research.",
      "• Highly learner-centered environment."
    ]
  },
  {
    pageNumber: 17,
    title: "Teaching Methods & Their Inventors (Part 1)",
    paragraphs: [
      "TEACHING METHODS & THEIR INVENTORS",
      "",
      "1) Programmed Instruction Method (PIM) — B.F. Skinner",
      "2) Discovery Learning Method — Jerome Bruner",
      "3) Heuristic Method — H.E. Armstrong",
      "4) Project Method — W.H. Kilpatrick (originally conceptualized by John Dewey*)",
      "5) Dalton Plan Method — Helen Parkhurst",
      "6) Problem Solving Method — John Dewey",
      "7) Inquiry Method — Richard Suchman",
      "8) Inductive Model / Method — Hilda Taba (originally founded by Francis Bacon)",
      "9) Deductive Method — Aristotle (Philosophical origin point)",
      "10) Demonstration Method — Seaman A. Knapp",
      "11) Socratic [Question/Answer] Method — Socrates",
      "12) Montessori Method — Maria Montessori",
      "13) Kindergarten Method — Friedrich Froebel"
    ]
  },
  {
    pageNumber: 18,
    title: "Teaching Methods & Their Inventors (Part 2)",
    paragraphs: [
      "14) Play-way Method — Henry Caldwell Cook (extended by Friedrich Froebel)",
      "15) Flipped Classroom Method — Eric Mazur",
      "16) Micro Teaching Method — Dwight Allen & Robert Bush",
      "17) Mastery Learning Method — Benjamin Bloom",
      "18) Co-operative Learning Method — Roger Johnson & David Johnson",
      "19) Simulation Method — Clark C. Abt",
      "20) Brainstorming Method — Alex Osborn",
      "21) Role-Play Method — Fannie Shaftel & George Shaftel",
      "22) Democratic Method — John Dewey",
      "23) Activity Method — John Dewey",
      "24) Basic Education (Wardha Scheme) — Mahatma Gandhi",
      "25) Field Method — Johann Heinrich Pestalozzi",
      "26) Unit Approach — H.C. Morrison",
      "27) Winnetka Method — Carleton Washburne",
      "28) Process Method — John Amos Comenius",
      "29) Questionnaire Method — Robert S. Woodworth",
      "30) Dialogue Method — Plato"
    ]
  },
  {
    pageNumber: 19,
    title: "Education Acts in India (Part 1)",
    paragraphs: [
      "EDUCATION ACTS (INDIA)",
      "",
      "(1) Hunter Commission Act (1882)",
      "• First detailed review of Indian education conducted by British administration.",
      "• Strongly promoted and funded primary-level schooling.",
      "",
      "(2) Indian Universities Act (1904)",
      "• Initiated by Lord Curzon to control and centralize university administration.",
      "",
      "(3) Government of India Act (1919)",
      "• Education became a Provincial subject.",
      "",
      "(4) Government of India (GOI) Act (1935)",
      "• Placed education directly in the Provincial List, allowing provincial autonomy in educational planning.",
      "",
      "(5) University Grants Commission (UGC) Act (1956)",
      "• Established the UGC for funding and coordinating standard compliance across Indian universities.",
      "",
      "(6) National Policy on Education (NPE) 1968",
      "• First broad national policy map.",
      "• Introduced the Three Language Formula; emphasized science and mathematics courses."
    ]
  },
  {
    pageNumber: 20,
    title: "Education Acts in India (Part 2)",
    paragraphs: [
      "(7) National Policy on Education (NPE) 1986",
      "• Brought major structural reforms. Established Jawahar Navodaya Vidyalayas (JNV) and DIETs in 1988.",
      "• Focus: \"Education for Equality\" and Mahila Samakhya (1989), DPEP launch (1997).",
      "",
      "(8) AICTE Act (1987)",
      "• Governs technical and professional courses (engineering, pharmacy, management).",
      "",
      "(9) Programme of Action (POA) 1992",
      "• Implemented NPE 1986. Partnered government with non-profit NGOs.",
      "",
      "(10) NCTE Act (1993)",
      "• Mandated regulator for teacher qualification institutes (B.Ed, D.El.Ed).",
      "",
      "(11) Right to Education (RTE) Act (2009)",
      "• Guaranteed free and compulsory schooling for kids aged 6-14 years.",
      "• Mandated 25% reserve seats for economically marginalized student populations.",
      "• Instituted the \"No Detention Policy\" and child physical safety codes.",
      "",
      "(12) Kothari Commission (1964-1966)",
      "• Introduced the \"Common School System\" paradigm; recommended dedicating at least 6% of GDP to public education."
    ]
  },
  {
    pageNumber: 21,
    title: "Education Acts in India (Part 3)",
    paragraphs: [
      "(13) Person with Disabilities (PWD) Act (1995)",
      "• Mandated inclusive classrooms and accessible infrastructure for disabled students.",
      "",
      "(14) Rights of Person with Disabilities (RPWD) Act (2016)",
      "• Substantially updated PWD 1995. Expanded recognized disability categories.",
      "• Enforced rights for Children with Special Needs (CWSN).",
      "",
      "(15) Child Labour [Prohibition & Regulation] Act (1986)",
      "• Banned child exploitation in hazards; established mandatory schooling links.",
      "",
      "(16) Juvenile Justice Act (2000 & 2015)",
      "• Enforced security and legal defense metrics for under-age individuals in correctional regimes.",
      "",
      "(17) NCPCR Act (2007)",
      "• Created the national commission responsible for monitoring RTE compliance.",
      "",
      "(18) National Food Security Act (2013)",
      "• Codified the Mid-Day Meal (MDM) scheme as a legal right in schools."
    ]
  },
  {
    pageNumber: 22,
    title: "NEP 2020 Frameworks & International Accords",
    paragraphs: [
      "(19) National Education Policy (NEP) 2020",
      "• Abolishes the age-old 10+2 system. Introduces the new 5+3+3+4 structural matrix.",
      "• Enforces Early Childhood Care & Education (ECCE) from age 3.",
      "• Pivots pedagogy from rote learning (\"education as input\") to skills-centered progression (\"education as development\").",
      "• Establishes Multidisciplinary Education & Research Universities (MERUs).",
      "• Supported by PM-USHA (2023 budget framework).",
      "",
      "(20) UNESCO Salamanca Statement (1994)",
      "• Global decree that schools must accommodate all children \"regardless of their physical/cognitive condition.\"",
      "",
      "(21) UN Convention on the Rights of Persons with Disabilities (UNCRPD) (2006)",
      "• Promotes and enforces high-quality inclusive schooling as a fundamental human right."
    ]
  },
  {
    pageNumber: 23,
    title: "Major Education Policies of India",
    paragraphs: [
      "EDUCATION POLICIES OF INDIA",
      "",
      "(1) National Policy on Education (NPE) 1968",
      "• Enacted during Prime Minister Indira Gandhi's tenure.",
      "• Drafted from the Kothari Commission report. 10+2+3 structure, math/science priority.",
      "",
      "(2) National Policy on Education (NPE) 1986",
      "• Enacted during Prime Minister Rajiv Gandhi's tenure.",
      "• Focus: \"Education for Equality\", child-centered learning environment.",
      "• Created JNV boarding schools, initiated Operation Blackboard (1987) to fund primary teaching kits.",
      "",
      "(3) Programme of Action (POA) 1992",
      "• Enacted during Prime Minister P.V. Narasimha Rao's tenure.",
      "• Refined details of 1986 policy using Ramamurti Committee (1990) recommendations.",
      "• Decentralized educational management via the Panchayati Raj framework."
    ]
  },
  {
    pageNumber: 24,
    title: "Curriculum Frameworks (NCF) & NEP 2020",
    paragraphs: [
      "(4) National Curriculum Frameworks (NCF)",
      "• High-level pedagogical guides crafted by NCERT.",
      "• NCF 1975: Initial elementary school layout.",
      "• NCF 1988: Action-oriented syllabus aligned to Operation Blackboard.",
      "• NCF 2000: Integrated moral and value-based education directives.",
      "• NCF 2005*: Spearheaded by the Prof. Yash Pal Committee. Slogan: \"Learning Without Burden.\" Highly child-centered and constructivist.",
      "• NCF 2023: Fully aligned to NEP 2020. Emphasizes foundational literacy & numeracy (FLN).",
      "",
      "(5) National Education Policy (NEP) 2020",
      "• Committee Chair: Renowned scientist Dr. K. Kasturirangan. Enacted under PM Narendra Modi.",
      "• Mandates local mother tongue / regional language as medium of instruction up to Grade 5.",
      "• Swaps conventional grades for continuous 360-Degree Holistic Progress cards."
    ]
  },
  {
    pageNumber: 25,
    title: "NEP 2020 Portals and Child Care Policy",
    paragraphs: [
      "• Focus on Foundational Literacy & Numeracy (FLN) through the NIPUN Bharat initiative (launched July 2021).",
      "• Continuous professional benchmark standards for teaching: NPST framework.",
      "• Establishment of National Testing Agency (NTA) in Nov 2017 to handle competitive collegiate exam inputs.",
      "• Multiple entry and exit points in undergraduate degrees (earning Certificate, Diploma, or Degree).",
      "• High integration of computer training and vocational modules starting from Class 6.",
      "• Digital study networks: DIKSHA portal (infrastructure tracking) and SWAYAM MOOC courses.",
      "",
      "(6) Education Policy for ECCE (Early Childhood Care & Education)",
      "• Mandates structured schooling for kids aged 3 to 6 years.",
      "• Employs play-and-activity-based curriculum designs, bridging local Anganwadi centres with primary school setups."
    ]
  },
  {
    pageNumber: 26,
    title: "Youth Policy & Samagra Shiksha (SMSA)",
    paragraphs: [
      "(7) National Youth Policy (2014 & 2021 Draft)",
      "• Empowers young adults via job-oriented skill training, gender equity, and life-skills literacy.",
      "",
      "(8) National Policy for Children (2013)",
      "• Intersectoral survival, health, nutrition, and child rights protection.",
      "",
      "(9) National Policy on Skill Development (2015)",
      "• Introduced PMKVY (Pradhan Mantri Kaushal Vikas Yojana) to bridge scholastic vocational certifications with job demands.",
      "",
      "(10) Samagra Shiksha Abhiyan (SMSA) 2018",
      "• Integrated three major central sector programs:",
      "    1. Sarva Shiksha Abhiyan (SSA) — launched 2001 for universal elementary access.",
      "    2. Rashtriya Madhyamik Shiksha Abhiyan (RMSA) — launched 2009 for high school accessibility and enrollment.",
      "    3. Teacher Education (TE) units.",
      "• Focus: Unified access, standard equity, and classroom quality from Pre-school to Class 12."
    ]
  },
  {
    pageNumber: 27,
    title: "ICT Policy, NISHTHA, and Milestones",
    paragraphs: [
      "(11) New ICT in School Education Policy (2023)",
      "• Upgrades classrooms to interactive smart portals.",
      "• Integrates the NISHTHA (National Initiative for School Heads' and Teachers' Holistic Advancement) capacity course.",
      "",
      "🎯 MANDATED POLICY FUTURE MILESTONES & DEADLINES:",
      "• 1988: Launch of National Literacy Mission targeting adults aged 15-35.",
      "• 2030: Teacher Education Institutions (TEIs) must transition entirely into multidisciplinary environments.",
      "• 2035: Higher Education Institutions (HEIs) must achieve full self-governing administrative autonomy.",
      "• 2040: HEIs must transform into fully comprehensive multidisciplinary collegiate structures."
    ]
  },
  {
    pageNumber: 28,
    title: "Pre-Independence Education Commissions",
    paragraphs: [
      "PRE-INDEPENDENCE EDUCATION COMMISSIONS",
      "",
      "(1) Wood's Despatch (1854)",
      "• Deemed the \"Magna Carta of Indian Education.\"",
      "• Advised English as the medium of collegiate instruction, but vernacular in primaries.",
      "",
      "(2) Hunter Commission (1882)",
      "• Formed to review the success of Wood's Despatch.",
      "• Emphasized state support for primary education and encouraged private schools.",
      "",
      "(3) Raleigh Commission (1902)",
      "• Focused on university consolidation, directly giving rise to the Indian Universities Act of 1904.",
      "",
      "(4) Sadler Commission (1917-1919)",
      "• Proposed structural redesign of Calcutta University. Introduced the 12-year school + 3-year degree formula.",
      "",
      "(5) Hartog Committee (1929)",
      "• Criticized extreme wastage and stagnation in primary schools. Advised strict quality checks.",
      "",
      "(6) Sargent Report (1944)",
      "• Blueprinted post-war schooling. Proposed 40-year plan for free schooling for kids aged 6-14."
    ]
  },
  {
    pageNumber: 29,
    title: "Post-Independence Education Commissions",
    paragraphs: [
      "POST-INDEPENDENCE EDUCATION COMMISSIONS",
      "",
      "(1) Radhakrishnan Commission (1948-1949)",
      "• Dr. Sarvapalli Radhakrishnan. Addressed higher education goals, recommended inclusion of moral instruction.",
      "• Recommended establishing the University Grants Commission.",
      "• Quote: \"The teacher is the pivot of the educational system.\"",
      "",
      "(2) Mudaliar Commission (1952-1953)",
      "• Dr. A. Lakshmanswami Mudaliar. Re-designed secondary schooling with multipurpose curriculums and technical subjects.",
      "",
      "(3) Kothari Commission (1964-1966)",
      "• Dr. D.S. Kothari. Conducted first exhaustive national analysis.",
      "• Devised the unified 10+2+3 structure, neighborhood schools, and 6% of GDP allocation standard.",
      "• Quote: \"The destiny of India is being shaped in her classrooms.\""
    ]
  },
  {
    pageNumber: 30,
    title: "Knowledge Commissions & HECI Reform",
    paragraphs: [
      "(4) National Knowledge Commission (NKC) (2005-2009)",
      "• Slogan: \"Knowledge is power.\" Led by Sam Pitroda. Advocated massive expansion of digitised libraries, online grids.",
      "",
      "(5) Yashpal Committee (1993 & 2009)",
      "• Slogan: \"Learning Without Burden.\" Criticized hyper-competitive rote testing. Formed bedrock of NCF 2005.",
      "",
      "(6) CABE (Central Advisory Board of Education)",
      "• 1943: Approved Sargent recommendations.",
      "• 2004-205: Drafted framework for RTE 2009 legislation.",
      "",
      "(7) Higher Education Commission of India (HECI) [Proposed]",
      "• Proposed under NEP 2020 of the Government of India.",
      "• Will serve as an umbrella single regulatory regulator replacing UGC, AICTE, and NCTE.",
      "• Does NOT govern clinical medical and law collegiate structures."
    ]
  },
  {
    pageNumber: 31,
    title: "HECI's 4 Specialized Regulatory Verticals",
    paragraphs: [
      "THE FOUR VERTICALS UNDER HECI UMBRELLA:",
      "",
      "a) NHERC (National Higher Education Regulatory Council)",
      "• Replaces separate regulatory bodies (UGC, AICTE, NCTE). Handles all central licensing & general registry functions.",
      "",
      "b) NAC (National Accreditation Council)",
      "• Handles institutional quality reviews and tier-accreditations. Supersedes NAAC and NBA.",
      "",
      "c) HEGC (Higher Education Grants Council)",
      "• Distributes state funding, research grants, and student scholarships based on merit.",
      "",
      "d) GEC (General Education Council)",
      "• Prescribes strict academic benchmarks and learning outcomes.",
      "• Sets up the National Higher Education Qualifications Framework (NHEQF) to ensure uniform syllabus parity."
    ]
  },
  {
    pageNumber: 32,
    title: "HECI Unified Architecture Relationships",
    paragraphs: [
      "HECI ARCHITECTURAL RELATIONSHIP",
      "",
      "• Note 1: Academic standards of UGC, NCTE, and AICTE are consolidated strictly under GEC.",
      "• Note 2: Regulatory control functions of UGC, NCTE, and AICTE are consolidated strictly under NHERC.",
      "• Note 3: Accreditation mechanisms are centralized under the NAC banner.",
      "",
      "ABBREVIATION LEGEND:",
      "• NAAC: National Assessment and Accreditation Council.",
      "• NBA: National Board of Accreditation (historically for engineering/technical lines)."
    ],
    drawings: [
      {
        type: "flow",
        title: "HECI REGULATORY DISSECTION",
        items: [
          "                ┌─────────────────────────┐",
          "                │     HECI UMBRELLA       │",
          "                └────────────┬────────────┘",
          "      ┌──────────────────────┼──────────────────────┐",
          "      ▼                      ▼                      ▼",
          "┌───────────┐          ┌───────────┐          ┌───────────┐",
          "│   NHERC   │          │    NAC    │          │    GEC    │",
          "│(Regulate) │          │ (Quality) │          │(Standards)│",
          "└───────────┘          └───────────┘          └───────────┘"
        ]
      }
    ]
  },
  {
    pageNumber: 33,
    title: "Constitutional Articles Related to Education",
    paragraphs: [
      "CONSTITUTIONAL ARTICLES ON INDIAN EDUCATION",
      "",
      "• Article 21A: Right to free and compulsory education for ages 6-14 years. Added via the 86th Amendment Act of 2002.",
      "• Article 45: Directs state to provide Early Childhood Care & Education (ECCE) for age range 0-6.",
      "• Article 15(3): Special protective laws and setups for children & women.",
      "• Article 15(4) & 15(5): Specific reservations and provisions for educational upliftment of SC, ST, and OBCs.",
      "• Article 24: Prohibition of hiring children in hazardous and manual industrial workshops.",
      "• Article 28: Outlines constraints regarding state-funded religious instructions in schools.",
      "• Article 29: Guarantees educational security and cultural preservation for linguistic minorities.",
      "• Article 30: Empowers minorities to build and self-govern their own schools.",
      "• Article 46: Encourages promotion of educational and economic safety for SCs/STs.",
      "• Article 51A(k): Constitutional duty of parents to school kids aged 6-14.",
      "• Article 350A: Enjoins state to deliver primary instructions in the local mother tongue.",
      "• Article 350B: Appoints a special officer for linguistic minority demographics."
    ]
  },
  {
    pageNumber: 34,
    title: "Financial Grants & EMRS Schooling",
    paragraphs: [
      "• Article 275(1): Authorizes central financial assistance as grants-in-aid drawn directly from the Consolidated Fund of India for states.",
      "• Key application: This is the legal article powering the model EMRS (Eklavya Model Residential Schools) funding pipeline.",
      "• Scope is aimed at improving standard of living and education rates across scheduled tribal tracts."
    ]
  },
  {
    pageNumber: 35,
    title: "Philosophical Statements on Education (Part 1)",
    paragraphs: [
      "FAMOUS PHILOSOPHICAL STATEMENT CITATIONS",
      "",
      "(1) Swami Vivekananda:",
      "• \"Education is the manifestation of the perfection already in man.\"",
      "• \"We want that education by which character is formed, strength of mind is increased, the intellect is expanded, and by which one can stand on one's own feet.\"",
      "",
      "(2) Mahatma Gandhi:",
      "• \"By education I mean an all-round drawing out of the best in child and man — body, mind and spirit.\"",
      "• \"Work and Knowledge should go together.\" (Wardha Basic Education scheme philosophy).",
      "",
      "(3) Rabindranath Tagore:",
      "• \"The highest education is that which does not merely give us information but makes our life in harmony with all existence.\"",
      "• \"A child's mind is always on the move — education should be creative and joyful.\""
    ]
  },
  {
    pageNumber: 36,
    title: "Philosophical Statements on Education (Part 2)",
    paragraphs: [
      "(4) Dr. B.R. Ambedkar:",
      "• \"Education is the milk of a tigress, and whoever drinks it can roar.\"",
      "",
      "(5) George Washington Carver:",
      "• \"Education is the key to unlock the golden door of freedom.\"",
      "",
      "(6) Dr. APJ Abdul Kalam:",
      "• \"The best brains of the nation may be found on the last benches of the classroom.\"",
      "• \"Teachers have a great mission to ignite the minds of the young.\"",
      "",
      "(7) Dr. S. Radhakrishnan:",
      "• \"Teachers should be the best minds in the country.\"",
      "",
      "(8) Sri Aurobindo:",
      "• \"Education is helping the growing soul to draw out what is already within.\"",
      "• \"The first principle of teaching is that nothing can be taught.\"",
      "",
      "(9) Jyotiba Phule:",
      "• \"Education is the only structural path to achieve Social Equality.\"",
      "",
      "(10) Annie Besant: \"Character is the true aim of education.\"",
      "",
      "(11) Gautama Buddha: \"Be your own light.\" Learning must lead directly to self-realisation."
    ]
  },
  {
    pageNumber: 37,
    title: "Philosophical Statements on Education (Part 3)",
    paragraphs: [
      "(12) Jiddu Krishnamurti:",
      "• \"The purpose of education is to bring about freedom and love.\"",
      "• \"The highest form of intelligence is the ability to observe without evaluating.\"",
      "",
      "(13) Pandita Madan Mohan Malviya:",
      "• \"Education is the foundation of National Awakening.\"",
      "",
      "(14) Dr. Zakir Husain:",
      "• \"Education must develop moral, intellectual and material aspects of life.\"",
      "",
      "(15) K.G. Saiyidain:",
      "• \"Education should lead to the flowering of personality.\""
    ]
  },
  {
    pageNumber: 38,
    title: "Global Western Philosophies (Part 1)",
    paragraphs: [
      "WESTERN THINKERS & PHILOSOPHIES",
      "",
      "(1) Aristotle:",
      "• \"Educating the mind without educating the heart is no education at all.\"",
      "• Emphasized holistic and moral education formats.",
      "",
      "(2) Socrates:",
      "• \"I cannot teach anybody anything; I can only make them think.\"",
      "",
      "(3) Plato:",
      "• \"Education is the creation of a sound mind in a sound body.\"",
      "",
      "(4) John Dewey:",
      "• \"Education is not preparation for life; education is life itself.\"",
      "",
      "(5) Maria Montessori:",
      "• \"The greatest sign of success for a teacher is to be able to say: the children are now working as if I did not exist.\""
    ]
  },
  {
    pageNumber: 39,
    title: "Global Western Philosophies (Part 2)",
    paragraphs: [
      "(6) Jean Piaget:",
      "• \"Education means creating men and women who are capable of doing new things, not simply repeating what other generations have done.\"",
      "",
      "(7) Lev Vygotsky:",
      "• \"What a child can do in cooperation today, he can do alone tomorrow.\"",
      "",
      "(8) Herbert Spencer:",
      "• \"Education is preparation for complete living.\"",
      "",
      "(9) Nelson Mandela:",
      "• \"Education is the most powerful weapon which you can use to change the world.\"",
      "",
      "(10) Confucius:",
      "• \"Education breeds confidence. Confidence breeds hope. Hope breeds peace.\"",
      "",
      "(11) Albert Einstein:",
      "• \"It is the supreme art of the teacher to awaken joy in creative expression and knowledge.\""
    ]
  },
  {
    pageNumber: 40,
    title: "Global Western Philosophies (Part 3)",
    paragraphs: [
      "(12) Henry Adams:",
      "• \"Teachers affect eternity; no one can tell where their influence stops.\"",
      "",
      "(13) T.P. Nunn:",
      "• \"Education is the complete development of Individuality so that they can make a contribution to the whole.\"",
      "",
      "(14) Friedrich Froebel:",
      "• \"Play is the highest expression of human development in childhood.\"",
      "",
      "(15) Johann Heinrich Pestalozzi:",
      "• \"Education is natural, progressive and harmonious development of all the child's powers.\"",
      "",
      "(16) Abraham Maslow:",
      "• \"What a man can be, he must be.\""
    ]
  }
];

const getTeachingAptitudePages = (isDemo: boolean): HandwrittenPage[] => {
  if (isDemo) {
    // Extract original page numbers 12 to 15, and keep their original pageNumber values
    return TEACHING_APTITUDE_PAGES.filter(p => p.pageNumber >= 12 && p.pageNumber <= 15);
  }
  return TEACHING_APTITUDE_PAGES;
};

export const generateNotesList = (): NotesUnit[] => {
  const list: NotesUnit[] = [];

  const examKeys: ExamCategoryType[] = ['RSMSSB_BCI', 'RSMSSB_SCI', 'UP_LT_GRADE', 'UGC_NET_CS'];

  examKeys.forEach(examId => {
    const units = SYLLABUS_MAP[examId];
    units.forEach((u, idx) => {
      const unitNum = idx + 1;
      const unitId = `${examId.toLowerCase().replace(/_/g, '-')}-unit-${unitNum}`;
      
      const isPedagogy1 = examId === 'RSMSSB_BCI' && unitNum === 1;

      list.push({
        id: unitId,
        examId,
        unitNumber: unitNum,
        name: `Unit ${unitNum}: ${u.name}`,
        shortDescription: u.desc,
        price: 20, // ₹20 unit-wise notes
        demoPages: isPedagogy1 ? getTeachingAptitudePages(true) : generatePages(examId, unitNum, u.name, u.concept, true),
        fullPages: isPedagogy1 ? getTeachingAptitudePages(false) : generatePages(examId, unitNum, u.name, u.concept, false)
      });
    });
  });

  return list;
};

export const NOTES_LIST: NotesUnit[] = generateNotesList();
