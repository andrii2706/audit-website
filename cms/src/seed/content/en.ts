/** English starter content for «Business Partners» — translation of ./uk.ts (same keys and order). */
import { h2, h3, p, ul } from '../structure';
import type { SiteContent } from './types';

const en: SiteContent = {
  categories: {
    audit: {
      name: 'Audit services',
      intro: 'Statutory and voluntary audits, reviews and assurance engagements — including for public-interest entities.',
    },
    consulting: {
      name: 'Consulting services',
      intro: 'Strategic solutions for complex financial and tax challenges: we help you make the right management decisions and minimise risks.',
    },
    legal: {
      name: 'Legal services',
      intro: 'Legal support for businesses and non-profit organisations — from corporate matters and contracts to court representation.',
    },
  },

  steps: [
    { title: 'Understanding the engagement', text: 'We clarify the goal, scope and timing and request the documents we need.' },
    { title: 'A team for the project', text: 'We build the team around your industry and each specialist’s current workload.' },
    { title: 'Careful planning and fieldwork', text: 'We plan the work to save your time and money and keep strictly to deadlines.' },
    { title: 'Report and recommendations', text: 'We deliver the opinion or report and explain the findings and recommendations in plain language.' },
  ],

  services: {
    'obovyazkovyy-audyt': {
      title: 'Statutory audit',
      excerpt: 'Audits of companies that are legally required to publish their financial statements together with an auditor’s report and file them with regulators.',
      badge: 'Including PIEs',
      tags: ['IFRS', 'Ukrainian GAAP', 'Consolidated statements', 'ESG'],
      deliverables: [
        'Audit of annual financial statements of large, medium and small companies (including extractive companies) prepared under IFRS or Ukrainian GAAP',
        'Audit of consolidated and combined financial statements of groups and holdings of any complexity',
        'Audits for the financial sector and issuers: securities issuers, professional stock-market participants and financial companies (except banks)',
        'Audit of sustainability (ESG) reporting in line with current European and international requirements',
      ],
      body: [
        p('We hold all the licences and qualifications required to audit companies that are legally obliged to publish their financial statements together with an auditor’s report and submit them to regulators and supervisory authorities.'),
        p('The firm is included in sections 3 and 4 of the Register of Auditors and Audit Entities, which entitles it to perform statutory audits of financial statements, including those of public-interest entities.'),
      ],
    },
    'initsiatyvnyy-audyt': {
      title: 'Voluntary audit',
      excerpt: 'An important tool to protect shareholders’ interests, raise financing and check the real state of a company or organisation.',
      tags: ['For owners', 'For investors', 'For NGOs', 'Reorganisation'],
      deliverables: [
        'For owners and investors: audit of financial statements for internal control or for inclusion in the parent group’s consolidated statements',
        'For the public sector: audit of NGOs and charitable foundations, project audits of specific grants',
        'For reorganisation and liquidation: official confirmation of the liquidation or separation balance sheet',
        'For management: checking specific line items (revenue, expenses, fixed assets, receivables, etc.) against source documents and accounting standards',
      ],
      body: [p('Even if the law does not require you to publish financial statements, a voluntary audit is an important tool to protect shareholders’ interests, to raise financing and to check the real state of affairs of companies and organisations.')],
    },
    'ohliad-promizhnoi-zvitnosti': {
      title: 'Review of interim financial statements',
      excerpt: 'An independent review of interim financial statements for owners, investors, lenders and regulators.',
    },
    'nadannia-vpevnenosti': {
      title: 'Assurance engagements',
      excerpt: 'Independent assurance engagements for Diia City and Defence City residents and auditor’s reports for regulators.',
      deliverables: [
        'Diia City residents: verifying the reliability of initial and annual compliance reports',
        'Defence City residents: verifying the reliability of reports of defence-industry companies',
        'For regulators (AMCU, NSSMC and the NBU): official auditor’s reports confirming the property or financial position of individuals and legal entities and the legitimate origin of funds',
      ],
      body: [p('A separate area of our expertise is independent assurance engagements.')],
    },
    'audyt-neprybutkovykh-orhanizatsii': {
      title: 'Audit of non-profit organisations, including grant project reports',
      excerpt: 'Audits of NGOs, charitable foundations and grant project reports — for transparency towards donors.',
      tags: ['NGOs', 'Charities', 'Grants'],
    },
    'due-diligence': {
      title: 'Financial and tax due diligence',
      excerpt: 'A comprehensive review of accounting, financial and tax risks before buying or selling a company or raising investment.',
      tags: ['Acquisitions', 'Divestments', 'Investment'],
    },
    'perevirka-zvitu-diia-city': {
      title: 'Review of initial and annual Diia City resident reports',
      excerpt: 'Verifying the reliability of Diia City residents’ initial and annual compliance reports.',
      badge: 'Diia City',
    },
    'perevirka-zvitu-defence-city': {
      title: 'Review of Defence City resident reports',
      excerpt: 'Verifying the reliability of reports of defence-industry companies that are Defence City residents.',
      badge: 'Defence City',
    },
    'taksonomiia-xbrl': {
      title: 'XBRL taxonomy support',
      excerpt: 'Help with preparing financial statements in the XBRL taxonomy format.',
    },
    'uzghodzheni-protsedury': {
      title: 'Agreed-upon procedures',
      excerpt: 'Specific audit procedures performed under clearly defined terms of reference, with a report of factual findings.',
      deliverables: [
        'Tax audit: checking that taxes are fully accrued and paid and assessing accounting and tax records (including before a tax inspection)',
        'Pre-sale due diligence: a comprehensive review of accounting, financial and tax risks before buying or selling a company',
        'IFRS conversion: transforming financial statements in line with IFRS',
        'Consolidation: preparing consolidated financial statements for groups, corporations and other associations of companies',
        'Verification of project reports under ISRS 4400: checking financial reports under grant contracts and international donor projects',
        'Preparation for e-audit (SAF-T UA): technical and methodological support in producing the standard audit file required by the State Tax Service',
        'Operational checks: recalculation, comparison and detailed testing of accounting data during asset counts or reconciliations with counterparties',
        'Financial analysis and reporting: analysis of the financial position of legal entities and preparation of compliance reports for Diia City residents',
      ],
      body: [p('If you need an analysis of specific accounting areas or preparation for an inspection or a transaction, we will perform specific audit procedures under clearly defined terms of reference and provide a report of factual findings.')],
    },

    'podatkove-planuvannia': {
      title: 'Tax planning and structuring',
      excerpt: 'Comprehensive tax planning models, choosing the optimal tax regime and structuring business processes to protect capital.',
    },
    'podatkovyi-konsaltynh': {
      title: 'Practical tax consulting',
      excerpt: 'Resolving complex questions of applying tax law and organising tax accounting in the company.',
    },
    'metodolohiia-obliku-msfz': {
      title: 'Accounting methodology and IFRS',
      excerpt: 'Choosing accounting policies, methodological support for IFRS conversion and assessing whether consolidated statements are required.',
    },
    'reorhanizatsiia-likvidatsiia': {
      title: 'Reorganisation and liquidation support',
      excerpt: 'Accounting and tax advice on spin-offs, conversions and mergers, and preparation of separation balance sheets and liquidation documents.',
    },
    'finansova-ekspertyza': {
      title: 'Financial expertise and analytics',
      excerpt: 'Advice on non-standard matters that require in-depth economic analysis, financial modelling and certified experts.',
    },

    'legal-due-diligence': {
      title: 'Legal due diligence',
      excerpt: 'A comprehensive review of constitutional documents, minutes, commercial contracts and litigation history of companies and non-profits.',
    },
    'korporatyvne-pravo': {
      title: 'Corporate law',
      excerpt: 'Registration, re-registration, reorganisation and liquidation of legal entities; charters, shareholder agreements, internal regulations and powers of attorney.',
    },
    'sudove-predstavnytstvo': {
      title: 'Litigation and disputes',
      excerpt: 'Pre-trial claims and representation in administrative and commercial disputes at all stages, including international bodies.',
    },
    'dohovirne-pravo-zed': {
      title: 'Contract law and foreign trade',
      excerpt: 'Drafting bespoke commercial contracts and preparing and supporting foreign trade contracts.',
    },
    'suprovid-hrantiv-mtd': {
      title: 'Grants and international technical assistance',
      excerpt: 'Legal support of grant agreements and documents for registering international technical assistance projects.',
    },
    'litsenzuvannia-akredytatsiia': {
      title: 'Licensing and accreditation',
      excerpt: 'A full package of documents for licensing and accreditation of healthcare institutions.',
    },
    'finansovyi-monitorynh': {
      title: 'Financial monitoring (AML)',
      excerpt: 'Advice on organising and implementing an internal financial monitoring system in line with current legislation.',
    },
    'ekspertni-konsultatsii': {
      title: 'Expert legal advice',
      excerpt: 'Legal analysis of non-standard situations and calculation of penalties, late-payment interest and inflation losses under contracts.',
    },
  },

  audiences: [
    { label: 'Public interest', title: 'For public-interest entities', description: 'The firm is included in section 4 of the audit register and is entitled to perform statutory audits of PIEs.' },
    { label: 'Business & investors', title: 'For owners, investors and groups', description: 'Audits for internal control, due diligence before transactions, tax planning and corporate matters.' },
    { label: 'NGOs & donors', title: 'For NGOs and foundations', description: 'Audits of non-profits, verification of grant reports under ISRS 4400 and legal support for projects.' },
    { label: 'Diia City / Defence City', title: 'For Diia City and Defence City residents', description: 'Verification of residents’ initial and annual reports and other assurance engagements.' },
  ],

  team: [
    {
      name: 'Natalia Tsupryk',
      role: 'Managing Partner',
      credential: 'Certified auditor · CAP · ACCA DipIFR',
      experience: '25+ years of experience',
      bio: 'Certified auditor, CAP and ACCA DipIFR, with more than 25 years of experience across food production, wholesale and retail, construction and real-estate management, and services. Leads engagement teams auditing public-interest entities, non-resident companies, healthcare, consolidated group financial statements, and engagements on state grants and grants from foreign governments and international organisations. Works with young people to promote the auditing profession: open lectures and student internships at the firm.',
    },
    {
      name: 'Volodymyr Stelmakh',
      role: 'Deputy Director for Audit Methodology',
      credential: 'With the firm since 2012',
      experience: '20+ years of experience',
      bio: 'More than 20 years in the profession and with Business Partners since 2012. Main industries: real-estate management, processing industry, professional stock-market participants and wholesale trade. A strong mentor and manager who trains and develops new staff, junior auditors and assistants.',
    },
    {
      name: 'Andrii Koval',
      role: 'Deputy Director for Legal Affairs and Financial Monitoring',
      credential: 'Attorney at law',
      experience: '40+ years of experience',
      bio: 'More than 40 years of experience, 35 of them in senior positions. Listed in the Unified Register of Attorneys of Ukraine. Has worked at Business Partners since its foundation. Heads the legal practice, performs legal audits and is responsible for financial monitoring at the firm. An expert in commercial disputes and corporate law who advises on the formation, reorganisation and termination of companies and NGOs.',
    },
    {
      name: 'Liubov Shevchuk',
      role: 'Auditor',
      credential: 'Certified auditor · ACCA DipIFR',
      experience: '30+ years of experience',
      bio: 'Certified auditor holding the ACCA DipIFR, with more than 30 years of experience, mostly as chief accountant, expert and auditor. Key client industries: extractive industry, wholesale and retail, processing industry and financial services.',
    },
    {
      name: 'Volodymyr Shyhanov',
      role: 'Auditor',
      credential: 'Certified auditor · CAP',
      experience: '25+ years of experience',
      bio: 'Certified auditor, CAP, with more than 25 years of experience, including as chief accountant, inspector and auditor. Key client industries: NGOs and charities, IT and construction.',
    },
    {
      name: 'Nadiia Myronchuk',
      role: 'Auditor',
      credential: 'Certified auditor · CAP',
      experience: '20+ years of experience',
      bio: 'Certified auditor, CAP, who passed the auditor qualification exam at the first attempt. More than 20 years in the profession. Key client industries: light and heavy industry, tolling arrangements and IT. Has in-depth expertise in analysing the comparability of financial indicators and testing the cost of products, works and services, as well as taxes and levies.',
    },
    {
      name: 'Olena Ustinova',
      role: 'Auditor',
      credential: 'Certified auditor · ACCA DipIFR',
      experience: '20+ years of experience',
      bio: 'Certified auditor holding the ACCA DipIFR who passed the auditor qualification exam. More than 20 years in the profession. Key client industries: insurance and financial companies, construction, IT and extractive industry. Has in-depth expertise in applying IFRS, converting financial statements, testing revenue and expenses of extractive companies and the comparability of financial and non-financial indicators.',
    },
  ],

  faqs: [
    { q: 'Is the firm entitled to audit public-interest entities?', a: 'Yes. Business Partners is included in sections 3 and 4 of the Register of Auditors and Audit Entities maintained by the Audit Public Oversight Body of Ukraine, which entitles it to perform statutory audits of financial statements, including those of public-interest entities.' },
    { q: 'How is the fee determined?', a: 'Our pricing is transparent and depends on the scope of work and the type of service. We agree the fee and timing before the work starts.' },
    { q: 'Do you work with NGOs and grant-funded projects?', a: 'Yes. We audit NGOs and charitable foundations, perform project audits of grants and verify project reports under ISRS 4400, and we provide legal support for grant agreements.' },
    { q: 'Do you help Diia City and Defence City residents?', a: 'Yes. We verify the reliability of Diia City residents’ initial and annual compliance reports and of Defence City residents’ reports.' },
    { q: 'What are your office hours?', a: 'Monday to Friday, 9:00–18:30, no lunch break. Saturday by appointment, Sunday closed. Office: 9A Lemkivska St, Lviv.' },
  ],

  articles: {
    'reorhanizatsiia-biznesu': {
      title: 'Planning to reorganise your business? What to know in advance',
      kind: 'Guide',
      excerpt: 'Merger, acquisition, split-up, spin-off or conversion: what to watch in accounting, taxes and documents so the reorganisation goes smoothly.',
      content: [
        p('A reorganisation changes the structure of a business: the rights and obligations of one legal entity pass to others. Companies reorganise to combine assets, separate a line of business, change their legal form or prepare for a sale.'),
        h2('Forms of reorganisation'),
        ul(['merger — two or more companies combine into a new one;', 'acquisition (absorption) — one company becomes part of another;', 'split-up — a company ceases to exist and several new ones take its place;', 'spin-off — a new legal entity is separated while the original company continues;', 'conversion — the legal form of the company changes.']),
        h2('What to prepare'),
        p('The transfer of property, rights and obligations is documented in a transfer deed or a separation balance sheet. For these documents to be reliable, it is worth counting assets and liabilities beforehand, reconciling balances with counterparties and the tax authorities, and checking the state of accounting and tax records.'),
        p('Assess the tax consequences separately: how the transfer of assets will be reflected, what happens to tax liabilities and overpayments, and whether the successor faces additional tax risks.'),
        h2('How we help'),
        p('The Business Partners team supports reorganisations end to end: we advise on accounting and taxes, prepare separation balance sheets and liquidation documents, perform a voluntary audit to confirm them, and our lawyers handle corporate procedures and registration of changes. Send us a request and we will assess your situation and propose a plan.'),
      ],
    },
    'do-uvahy-rezydentiv-diia-city': {
      title: 'Attention Diia City residents: the compliance report and its audit',
      kind: 'Heads-up',
      excerpt: 'Why a Diia City resident needs an auditor, what is checked in the compliance report and how to prepare in advance.',
      content: [
        p('Diia City residency gives companies access to a special tax and legal regime. In return, a resident must confirm that it meets the statutory requirements — through a compliance report whose reliability is verified by an independent auditor.'),
        h2('What is checked'),
        p('Key requirements for residents include the share of income from qualifying activities, the number of engaged specialists and their average remuneration. The auditor checks whether the figures in the report are supported by source documents, accounting records and contracts, including gig contracts.'),
        h2('How to prepare'),
        ul(['agree with your accountants in advance which income counts as qualifying;', 'review contracts and payments with employees and gig specialists;', 'collect supporting documents for every indicator in the report;', 'schedule the audit well before the filing deadline.']),
        p('Unreliable data in the report can lead to the loss of resident status, so prepare it as carefully as your financial statements.'),
        h2('How we can help'),
        p('We verify the reliability of both initial and annual Diia City compliance reports and help with financial analysis and preparing the reports themselves. Send us a request and we will propose the format and timing.'),
      ],
    },
    'shcho-take-defence-city': {
      title: 'What is Defence City and why do residents need an auditor',
      kind: 'Explainer',
      excerpt: 'A short overview of the special regime for defence-industry companies and of the audit of its residents’ reports.',
      content: [
        p('Defence City is a special legal regime for companies of Ukraine’s defence industry. It provides tax and regulatory incentives for companies that develop and manufacture defence products.'),
        p('As with Diia City, the incentives depend on meeting the established requirements, and residents report on their compliance. The reliability of these reports is confirmed by an independent audit.'),
        h2('What to watch'),
        ul(['determine which activities and income fall under the regime;', 'set up accounting so that every figure in the report can be supported by documents;', 'remember the confidentiality requirements: defence companies’ information needs special protection.']),
        h2('How we work'),
        p('We verify the reliability of reports of defence-industry companies that are Defence City residents, with strict adherence to confidentiality and ethical principles. Send us a request to discuss your engagement.'),
      ],
    },
  },

  global: {
    siteName: 'Business Partners',
    tagline: 'Audit and consulting firm',
    legalName: 'Business Partners Audit and Consulting Firm LLC',
    address: '9A Lemkivska St, Lviv, Ukraine',
    workingHours: 'Mon–Fri 9:00–18:30, no lunch break',
    workingHoursNote: 'Saturday by appointment, Sunday closed',
    footerNote: 'Audit, consulting, law and tax since 2011. The firm is included in sections 3 and 4 of the Register of Auditors and Audit Entities.',
    seo: {
      metaTitle: 'Business Partners — audit and consulting firm in Lviv, Ukraine',
      metaDescription: 'Statutory and voluntary audits, public-interest entity audits, Diia City and Defence City reports, due diligence, tax and legal services. 15+ years.',
    },
  },

  homepage: {
    heroBadge: 'Sections 3 and 4 of the audit register',
    heroBadgeNote: 'Audit and consulting firm since 2011',
    heroTitleStart: 'More than 15 years of',
    heroTitleAccent: 'transparency, trust',
    heroTitleEnd: 'and financial security for your business',
    heroSubtitle: 'Business Partners is your reliable guide to finance, tax and management decisions. We help Ukrainian businesses, international organisations and investors find a way out of the most complex situations, delivering high-quality audit services at a reasonable price.',
    deadlineTitle: 'Review of initial and annual Diia City resident reports',
    trustTitle: 'Audits of public-interest entities',
    trustText: 'Section 4 of the Register of Auditors and Audit Entities',
    servicesTitle: 'Audit, consulting and legal support',
    audienceTitle: 'Who we work with',
    processTitle: 'How we work',
    processSteps: [
      { title: 'Understanding the engagement', text: 'We clarify the goal, scope and timing and request the documents we need.' },
      { title: 'A team for the project', text: 'We choose the team based on industry specifics and each specialist’s workload.' },
      { title: 'Professional planning', text: 'Real savings of your money and time thanks to careful planning and efficient work.' },
      { title: 'Results in plain language', text: 'We keep to deadlines, answer difficult questions and give clear recommendations.' },
    ],
    stats: [
      { value: '1000+', label: 'satisfied audit and assurance clients' },
      { value: '15+', label: 'years in the audit market' },
      { value: '12+', label: 'industries we are experts in' },
      { value: '95%', label: 'of clients come back to us' },
    ],
    whyTitle: 'Why private and public clients, investors and lenders choose us',
    reasons: [
      { title: 'Impeccable reputation', text: 'Clients recognise us as an honest, principled partner and a provider of high-quality services.' },
      { title: 'Speed and flexibility', text: 'We respond quickly to market challenges and meet our clients’ needs fast.' },
      { title: 'Reasonable pricing', text: 'Strict compliance with international standards and high audit quality at a fair price.' },
      { title: 'Public interest', text: 'We perform statutory audits and other mandatory engagements for public-interest entities.' },
      { title: 'Confirmed quality', text: 'The quality of our audit services was confirmed by Order No. 36-кя of 22.06.2026 of the Audit Public Oversight Body following an external review.' },
    ],
    industriesTitle: 'Industries we work in',
    industries: [
      'Food industry',
      'Light and heavy industry',
      'Road construction',
      'Residential and commercial construction, real estate',
      'IT',
      'Extractive industry',
      'Renewable energy',
      'Healthcare',
      'Professional securities market participants',
      'Wholesale and retail trade',
    ],
    teamTitle: 'A highly qualified team',
    teamSubtitle: 'Years of experience that guarantee the quality of our services.',
    estimateTitle: 'Need an audit? Have a question?',
    estimateText: 'We are always in touch. Send us your request and we will get back to you.',
    estimateBullets: ['Transparent pricing', 'Strict deadlines', 'Confidentiality and ethics'],
    blogTitle: 'Blog',
    faqTitle: 'Frequently asked questions',
    faqText: 'Didn’t find the answer? Call or write to us — we are always in touch.',
    ctaTitle: 'Contact us',
  },

  about: {
    heroTitle: 'We support companies across industries',
    heroIntro: 'in line with high professional standards, legal requirements, International Standards on Auditing and ethical principles.',
    intro: [
      p('Business Partners is one of Ukraine’s top 25 audit firms, with more than 15 years of practice. We have many years of experience in auditing financial statements, including mergers and acquisitions, consolidation and conversion of financial statements to International Financial Reporting Standards.'),
      p('Our clients receive not only a high-quality audit but also a set of consulting solutions that help strengthen their financial stability, improve management efficiency and attract new investment.'),
    ],
    reasonsTitle: 'Why choose Business Partners?',
    reasons: [
      { title: 'Confidentiality', text: 'We strictly observe confidentiality and ethical principles.' },
      { title: 'Reputation', text: 'Our reputation is impeccable: 95% of clients recommend us and come back.' },
      { title: 'Team', text: 'We always build the team for each project around the industry and each specialist’s current workload.' },
      { title: 'Savings', text: 'Real savings of money and time thanks to professional planning and efficient work.' },
      { title: 'Fees', text: 'Transparent pricing that pays off in 100% of cases, differentiated by the scope of work and type of service.' },
      { title: 'Service and communication', text: 'A high level of service: we keep strictly to deadlines, answer the hardest questions and give recommendations in plain language.' },
      { title: 'Knowledge and experience', text: 'Extensive experience and expertise in many industries let us find the most beneficial solution for your company.' },
    ],
    missionTitle: 'Mission',
    mission: 'Our firm strives to meet the highest quality standards through professional growth and best practice. High quality and professionalism of audit services is the main principle of our work. It means compliance with the law, professional standards and the Code of Ethics. We combine practical experience with a deep understanding of industry specifics, the domestic market and Ukrainian legislation.',
    valuesTitle: 'Our core values',
    values: [
      { title: 'Client focus', text: 'We dive deep into your business to respond quickly to challenges and find solutions that bring you the greatest benefit.' },
      { title: 'Impeccable quality', text: 'Every report, analysis and piece of advice goes through a multi-level internal review. We make no compromises on the accuracy of data.' },
      { title: 'Responsibility', text: 'We understand how much our conclusions matter to investors, lenders and regulators and take full responsibility for every result.' },
      { title: 'Confidentiality', text: 'Protecting trade secrets and clients’ information security is our absolute priority. Your data is protected legally and technically.' },
      { title: 'Corporate and social responsibility', text: 'We do business honestly and transparently, support the professional community in Ukraine and contribute to sustainable development.' },
    ],
    principlesTitle: 'Strength in people, uncompromising accuracy in action',
    principlesIntro: 'Our firm strives to meet the highest international standards, constantly investing in the professional growth of the team and adopting global best practice. High quality and impeccable professionalism of audit services is the main principle of Business Partners. Our approach rests on three firm foundations:',
    principles: [
      { title: 'Strict compliance', text: 'Unconditional compliance with Ukrainian law and International Standards on Auditing (ISA).' },
      { title: 'Professional ethics', text: 'Strict adherence to the IESBA Code of Ethics for Professional Accountants, which guarantees our independence, objectivity and full confidentiality.' },
      { title: 'Developing talent', text: 'Hiring and retaining the best auditors and industry specialists and giving them every opportunity to grow professionally is our key internal priority.' },
    ],
    principlesOutro: 'By choosing us, you get not just a contractor but a principled and reliable partner who keeps your business resilient.',
    historyTitle: 'About the firm',
    history: [
      p('Business Partners is a team of professionals that has worked in the Ukrainian market since 2011 in audit, consulting, law and tax. We are a reliable guide in the world of finance and management decisions, delivering the highest quality of services at a reasonable price.'),
      p('We specialise in implementing International Financial Reporting Standards (IFRS), help structure and optimise operations and find a way out of the most complex situations for Ukrainian businesses, international organisations and investors.'),
    ],
    requestsTitle: 'Clients come to us when they need to',
    requests: [
      'Ensure transparency of and trust in financial statements',
      'Transform accounting and move to IFRS',
      'Raise financing, loans or grants',
      'Scale, structure, optimise or reorganise the business',
      'Protect the company legally and in tax matters',
    ],
    registryTitle: 'Audit register and quality control',
    registry: [
      p('The firm is included in the Register of Auditors and Audit Entities maintained by the Audit Public Oversight Body of Ukraine, in particular:'),
      ul([
        'section 3 — “Audit entities entitled to perform statutory audits of financial statements”;',
        'section 4 — “Audit entities entitled to perform statutory audits of financial statements of public-interest entities”.',
      ]),
      p('The firm has once again successfully passed the quality control review of audit services, confirmed by Order No. 36-кя of 22.06.2026 of the Audit Public Oversight Body.'),
    ],
    qualityTitle: 'Quality management system',
    quality: [
      p('The management of Business Partners has invested considerable time in building a quality management system that complies with ISQM 1 and achieves the established quality objectives. We have adopted all the quality objectives set out in ISQM 1 for the eight components of our system:'),
      ul([
        'the firm’s risk assessment process;',
        'governance and leadership;',
        'relevant ethical requirements;',
        'acceptance and continuance of client relationships and specific engagements;',
        'engagement performance;',
        'resources;',
        'information and communication;',
        'the monitoring and remediation process.',
      ]),
      p('For each component we have policies and procedures aimed at the main goal — high-quality audit services. The quality management system operates continuously and responds to changes in the firm and its engagements.'),
      h3('Quality objectives'),
      ul([
        'the firm and its personnel fulfil their responsibilities in accordance with professional standards and applicable legal and regulatory requirements;',
        'engagement reports issued are appropriate in the circumstances.',
      ]),
      p('Quality engagements are achieved through planning, performing and reporting in accordance with professional standards and ethical requirements, including independence. Meeting the objectives and legal requirements involves professional judgement and professional scepticism.'),
      h3('Ethical principles'),
      p('Each of our employees is personally responsible for complying with legal and professional standards and ethical principles:'),
      ul([
        'integrity — being straightforward and honest in all professional and business relationships;',
        'objectivity — not allowing bias, conflicts of interest or undue influence of others to override professional judgements;',
        'professional competence and due care — maintaining knowledge and skills at the level required for competent professional service and acting diligently in accordance with technical and professional standards;',
        'confidentiality — not disclosing information obtained through professional and business relationships to third parties without proper authority and not using it for personal advantage;',
        'professional behaviour — complying with laws and regulations and avoiding any action that may discredit the profession.',
      ]),
    ],
    seo: {
      metaTitle: 'About us — Business Partners audit and consulting firm',
      metaDescription: 'An audit and consulting firm since 2011, among Ukraine’s top 25 audit firms. Sections 3 and 4 of the audit register, ISQM 1 quality management.',
    },
  },

  career: {
    heroTitle: 'A career in audit',
    heroIntro: 'The chance to ask practitioners questions and hear real stories about the profession is often the moment that helps students choose their path. Such meetings help not only to learn about internships but also to feel which professional direction truly resonates.',
    aboutTitle: 'Working at Business Partners',
    about: [
      p('The firm regards the auditors and specialists in its team as its main asset. Their technical skills and business qualities are the key to our success. One of the key drivers of quality is confidence that our auditors and specialists have sufficient experience and skills, dedication and purpose. This requires careful recruitment and development, fair remuneration and sound allocation of people to engagements.'),
      p('Business Partners has policies and procedures to ensure that all employees have the necessary intellectual and technical skills and demonstrate our values and commitment to quality while maintaining high professional standards.'),
      p('We have high standards for recruitment, interviews and qualification requirements. We give preference to candidates with references from previous employers who are motivated to learn and reach new qualification levels.'),
      p('We continuously update our technological and intellectual resources to keep pace with the digital world, rethinking our processes and methodologies to give audit teams strong support and ensure reliable results.'),
      p('The firm continuously invests money and time in training and professional development. Our auditors and specialists keep improving their competencies through training, in-person and online events and on-the-job mentoring.'),
    ],
    faqTitle: 'Frequently asked questions',
    faqs: [
      { title: 'Can I combine studying and working?', text: 'Yes, we are flexible about students’ needs. If working 9:00–18:00 is difficult, we can offer a 4-hour working day. This can be agreed during the interview.' },
      { title: 'Is it worth gaining experience while still studying?', text: 'Yes: it lets you not only learn the theory but also put it into practice. Such experience helps you understand the profession faster, feel the real pace of work and build your career with more confidence.' },
    ],
    vacanciesTitle: 'Open positions',
    vacanciesEmpty: 'There are no open positions right now. Send your CV to businesspartners@ukr.net and we will contact you when a suitable position opens.',
    seo: {
      metaTitle: 'Careers at Business Partners',
      metaDescription: 'Jobs and internships at an audit and consulting firm in Lviv: training, mentoring and flexible hours for students.',
    },
  },
};

export default en;
