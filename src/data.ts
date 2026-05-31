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
    totalUnits: 15,
    description: 'Structured notes mapping to the UPPSC Computer Science Lecturer syllabus, emphasizing subjective answers and logical explanations.',
    thumbnailColor: 'from-orange-500 to-red-800',
  },
  {
    id: 'UGC_NET_CS',
    title: 'UGC NET CS',
    subtitle: 'NTA UGC NET Unit-wise CS & Applications',
    badge: 'National Level',
    totalUnits: 15,
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
    { name: 'Discrete Optimization Math', desc: 'Graph Hamiltonian bounds, Euler trials, combinatorics values.', concept: 'Pigeonhole principle, permutations formulas, shortest path algorithms.', schema: 'discrete' },
    { name: 'Digital Logic & Gate Sys', desc: 'Karnaugh Maps reduction, combinational encoders, flip-flops.', concept: 'Quine-McCluskey tabulation, JK master-slave flip-flops, multiplexers.', schema: 'digital' },
    { name: 'C++ & Object Paradigms', desc: 'Polymorphism types, function templates, object state access.', concept: 'Friend classes, memory leaks, pure virtual destructors, inline functions.', schema: 'cpp' },
    { name: 'Data Structure Design', desc: 'BFS/DFS graphs, binary search trees balancing, hash grids.', concept: 'Rebalancing AVL trees, collision resolution chaining, queue overflow.', schema: 'dsa' },
    { name: 'Algorithm Analysis', desc: 'Asymptotic classes, greedy selection, divide & conquer rules.', concept: 'Big-Oh notation, Merge Sort vs Quick Sort, fractional knapsack greedy.', schema: 'algo' },
    { name: 'Relational DB Models', desc: 'Relational functional dependencies, index pages, file locks.', concept: 'Lossless join check, B+ Trees indexing structure, ACID transaction logs.', schema: 'db' },
    { name: 'Network Topologies & IP', desc: 'Star vs Ring, IPv4 subnet slicing, CIDR notation blocks.', concept: 'Routing table lookups, ARP MAC resolution, ICMP ping echo loops.', schema: 'cn' },
    { name: 'Software Development SDLC', desc: 'Prototype model, RAD model, software metrics auditing.', concept: 'Function Point metrics, internal cohesion, coupling ratios, Gantt chart tracker.', schema: 'se' },
    { name: 'OS File Management', desc: 'FAT32 vs NTFS file systems, sector blocks, disk access schedules.', concept: 'SSTF, SCAN, C-SCAN scheduling, disk formatting sectors, page table.', schema: 'os' },
    { name: 'Grammars & Languages', desc: 'Chomsky hierarchy, context-free grammars, pushdown automation.', concept: 'Left recursion elimination, PDA state diagram mapping, grammar ambiguity.', schema: 'automata' },
    { name: 'Compiler Parse Trees', desc: 'Syntax directed translation, code generation optimizations.', concept: 'Three-address code, basic block partitioning, DAG representation loops.', schema: 'compiler' },
    { name: 'Computer Graphics Kernels', desc: 'Line drawing algorithms, 2D/3D matrix transforms.', concept: 'Bresenham\'s line formula, rotation scaling matrices, viewport clips.', schema: 'graphics' },
    { name: 'Web Scripting Servers', desc: 'PHP database links, Node.js express handlers, JSON API tools.', concept: 'Session storage, SQL injection prevention, backend routing definitions.', schema: 'web' },
    { name: 'Cloud & Database Warehouses', desc: 'MapReduce flows, Hadoop cluster systems, OLAP star schema.', concept: 'Fact tables, ETL pipelines, master-slave distributed computing nodes.', schema: 'cloud' },
    { name: 'Ethics & Pedagogy Core', desc: 'Copyright licenses, professional developer codes, classroom tech.', concept: 'FOSS vs proprietary, Plagiarism standards, student evaluation metrics.', schema: 'ethics' }
  ],
  UGC_NET_CS: [
    { name: 'Mathematical Optimization', desc: 'Propositional formulas, LPP simplex method, graph coloring.', concept: 'Linear Programming simplex table, duality theory, Cromelin counts.', schema: 'discrete' },
    { name: 'Processor Architecture Core', desc: 'Instruction pipelining, pipeline hazards, RISC vs CISC.', concept: 'Data hazards, structural stall cycles, super-pipelined performance.', schema: 'coa' },
    { name: 'Graphics & Code Paradigms', desc: 'Ray tracing basics, Java thread states, garbage collectors.', concept: 'Bresenham\'s circle algorithm, JVM memory partition, thread life cycles.', schema: 'graphics' },
    { name: 'DBMS transactions & Normal', desc: 'Multi-version concurrency, 4NF, Join dependency, lock layers.', concept: 'Precedence graph testing, 4NF/5NF normalizations, serializability.', schema: 'db' },
    { name: 'OS Principles & Virtual', desc: 'Page tables, inverted pages, kernel IPC, semaphore flags.', concept: 'Dekker\'s algorithm, Peterson\'s solution, system call context swaps.', schema: 'os' },
    { name: 'Software Agile Management', desc: 'Scrum frameworks, Cleanroom architecture, COCOMO II calculations.', concept: 'Sprint planning cycles, velocity tracking, black-box boundary limits.', schema: 'se' },
    { name: 'Advanced DSA Sorting Bounds', desc: 'Heap Sort, Counting Sort, graph minimum spanning trees.', concept: 'Kruskal\'s vs Prim\'s algorithms, Heap structure heapifications, DP Knapsack.', schema: 'dsa' },
    { name: 'Theory of Computation', desc: 'Decidability proofs, context-sensitive languages, Turing states.', concept: 'Post Correspondence Problem, Chomsky grammar, closure properties.', schema: 'automata' },
    { name: 'Advanced Networks & IPv6', desc: 'IPv6 header shifts, BGP, OSPF, sliding window timers.', concept: 'Selective-Repeat protocol, congestion window thresholds, DNS servers.', schema: 'cn' },
    { name: 'AI & Knowledge Systems', desc: 'Heuristic searches (A*, AO*), alpha-beta pruning minimax.', concept: 'Admissibility proofs, fuzzy logic controllers, resolution inference rules.', schema: 'ai' },
    { name: 'Data Mining & ML Kernels', desc: 'K-Means clustering, decision trees entropy, support vectors.', concept: 'Information Gain formula, KNN spatial bounds, SVM margin kernels.', schema: 'ml' },
    { name: 'Network Cryptographic Sys', desc: 'Diffie-hellman key exchange, SHA-256 hashes, digital signatures.', concept: 'EIGamal ciphers, Man-in-the-Middle prevention, Certificate Authorities.', schema: 'crypto' },
    { name: 'Distributed Systems', desc: 'Mutual exclusion, ring selection, vector clock synchronization.', concept: 'Lamport\'s Logical Clock, Bully algorithm election, Byzantine Agreement.', schema: 'distributed' },
    { name: 'Advanced Mobile / Wireless', desc: 'Frequency reuse grids, GSM multiplexing, handoff strategies.', concept: 'Hard handoff vs soft handoff, mobile IP routing tunnels, CDMA systems.', schema: 'mobile' },
    { name: 'Digital Signal Processing', desc: 'Fourier transforms, logic gates synthesis, logic arrays.', concept: 'PLA vs PAL designs, Shannon expansion mapping, multiplexer synthesis.', schema: 'dsp' }
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
export const generateNotesList = (): NotesUnit[] => {
  const list: NotesUnit[] = [];

  const examKeys: ExamCategoryType[] = ['RSMSSB_BCI', 'RSMSSB_SCI', 'UP_LT_GRADE', 'UGC_NET_CS'];

  examKeys.forEach(examId => {
    const units = SYLLABUS_MAP[examId];
    units.forEach((u, idx) => {
      const unitNum = idx + 1;
      const unitId = `${examId.toLowerCase().replace(/_/g, '-')}-unit-${unitNum}`;
      
      list.push({
        id: unitId,
        examId,
        unitNumber: unitNum,
        name: `Unit ${unitNum}: ${u.name}`,
        shortDescription: u.desc,
        price: 20, // ₹20 unit-wise notes
        demoPages: generatePages(examId, unitNum, u.name, u.concept, true),
        fullPages: generatePages(examId, unitNum, u.name, u.concept, false)
      });
    });
  });

  return list;
};

export const NOTES_LIST: NotesUnit[] = generateNotesList();
