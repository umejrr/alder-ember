/**
 * Planning guides. Written only at the level the brief supports. They are drafts:
 * technical content needs expert approval, so every guide is approval: 'working' and is
 * excluded from production builds until Operations / an adviser marks it 'approved'.
 * No guide states a numeric base size, clearance, weight, warm-up time or planning rule.
 */
import type { Guide } from './types';

export const guides: Guide[] = [
  {
    slug: 'choosing-a-sauna-for-your-space',
    title: 'Choosing a sauna for your space',
    summary: 'How comfortable capacity, garden size and access help you shortlist between the three models.',
    topic: 'Choosing a model',
    intro:
      'The easiest way to choose is to start with who will use the sauna, then check the space and the route in. Here is how we think about it.',
    sections: [
      {
        heading: 'Start with comfortable seating',
        body: [
          'We describe each model by comfortable capacity: how many adults can sit comfortably, not the most people who could squeeze in. A bigger cabin than you need is a sensible choice. A smaller one than you need usually is not.',
        ],
        list: [
          'The Rowan: comfortable seating for 2–3 adults, for a compact garden, solo use or a couple.',
          'The Alder: comfortable seating for 4–5 adults, for a household wanting more room, with a glazed front.',
          'The Ember: comfortable seating for 6–8 adults, described with a changing area, for larger households and regular guests.',
        ],
      },
      {
        heading: 'Exterior size is not the whole footprint',
        body: [
          'The dimensions on each model page are the cabin’s working exterior size. They are not the space you need to set aside. You also need a base, clearances around the cabin and a way to get it in.',
          'We confirm those requirements against the approved specification for your model, so please treat any quick calculation from cabin size with caution.',
        ],
      },
      {
        heading: 'Think about access early',
        body: [
          'Gates, paths, steps, corners and anything overhead all affect delivery. Photographs and approximate measurements are enough to start the conversation.',
        ],
      },
      {
        heading: 'Still unsure?',
        body: ['Use the model selector or compare the three side by side. Either way, we will confirm the model and site requirements with you.'],
      },
    ],
    relatedLinks: [
      { href: '/compare', label: 'Compare models' },
      { href: '/installation-delivery', label: 'Installation & delivery' },
    ],
    approval: 'working',
    reviewer: null,
    published: null,
    updated: null,
  },
  {
    slug: 'electric-or-wood-burning',
    title: 'Electric or wood-burning: what to talk through',
    summary: 'The practical differences to consider when you state a heating preference.',
    topic: 'Heating',
    intro:
      'A heating preference is a starting point for a conversation. The configuration that suits your project is confirmed against the approved equipment specification.',
    sections: [
      {
        heading: 'Electric heating',
        body: [
          'Electric heating suits customers who want straightforward controls and regular use. It is available on all three models. Electrical supply and equipment sizing follow the approved equipment specification, and electrical connection is assessed separately from the sauna.',
        ],
      },
      {
        heading: 'Wood-burning',
        body: [
          'Selected wood-burning configurations suit people who are comfortable tending a fire and managing the maintenance and site considerations that come with it. They are offered on the Alder and Ember, subject to assessment. They are not offered on the Rowan in the supplied range.',
          'Ventilation, flues and clearances follow the approved equipment specification for your configuration.',
        ],
      },
      {
        heading: 'Warm-up times',
        body: [
          'Warm-up varies by model, heater, starting temperature and weather. We publish tested, model-specific ranges only when we have them, so we do not give a single figure here.',
        ],
      },
    ],
    relatedLinks: [
      { href: '/compare', label: 'Compare models' },
      { href: '/plan-your-sauna', label: 'Plan your sauna' },
    ],
    approval: 'working',
    reviewer: null,
    published: null,
    updated: null,
  },
  {
    slug: 'planning-base-and-access',
    title: 'Planning your base and access',
    summary: 'The questions to answer before a site review, without guessing at measurements.',
    topic: 'Installation',
    intro:
      'We check the space and access before confirming your installation. This checklist shows what we will ask about. We do not give generic measurements, because they depend on the model and your site.',
    sections: [
      {
        heading: 'The base',
        body: ['Think about where the sauna will stand and whether that ground is level and firm.'],
        list: [
          'Where would the sauna sit, and what is the ground like there?',
          'Is the area level, or does it slope?',
          'Is there drainage to consider nearby?',
        ],
      },
      {
        heading: 'Getting it in',
        body: ['A photograph of each stage of the route helps.'],
        list: [
          'Gate and path widths and heights along the route',
          'Steps, changes of level and tight corners',
          'Overhead obstructions such as branches or cables',
        ],
      },
      {
        heading: 'Around the cabin',
        body: [
          'Equipment and maintenance clearances follow the approved specification. Tell us what is near the planned position, such as fences, buildings and planting.',
        ],
      },
      {
        heading: 'Electrical preparation',
        body: [
          'Electrical connection is assessed separately and follows the approved equipment specification. Tell us where the nearest supply is.',
        ],
      },
    ],
    relatedLinks: [{ href: '/installation-delivery', label: 'Installation & delivery' }],
    approval: 'working',
    reviewer: null,
    published: null,
    updated: null,
  },
  {
    slug: 'understanding-an-itemised-quotation',
    title: 'Understanding an itemised quotation',
    summary: 'What an itemised quotation separates, and why the starting price is not a final total.',
    topic: 'Quotation',
    intro:
      'Each model page shows a starting price. Your itemised quotation is where the full project is set out.',
    sections: [
      {
        heading: 'The starting price',
        body: [
          'The starting price is for the cabin as described on the model page, including VAT. It is a place to begin, not a confirmed installed total.',
        ],
      },
      {
        heading: 'What the quotation sets out',
        body: ['Your quotation identifies, line by line:'],
        list: [
          'The specification: model, heating and any approved options',
          'What we will do within the agreed installation scope',
          'What is assessed separately, such as ground preparation, electrical connection, specialist lifting and non-standard access work',
          'Which tasks are ours and which are yours or your contractors’',
          'The lead time for your order',
        ],
      },
      {
        heading: 'If something is unknown',
        body: ['Where a cost cannot be known until we have assessed your site, the quotation says it is quoted after assessment. It is never shown as zero.'],
      },
    ],
    relatedLinks: [
      { href: '/saunas', label: 'The saunas' },
      { href: '/installation-delivery#responsibilities', label: 'Who does what' },
    ],
    approval: 'working',
    reviewer: null,
    published: null,
    updated: null,
  },
  {
    slug: 'after-handover',
    title: 'What to expect after handover',
    summary: 'How aftercare works and where to find equipment and warranty information.',
    topic: 'Care and support',
    intro:
      'Handover is the end of the installation, not the end of our involvement. This is how aftercare is set up.',
    sections: [
      {
        heading: 'Handover',
        body: ['We complete installation checks and take you through the sauna with you before we leave.'],
      },
      {
        heading: 'Who to contact',
        body: ['You will have an accessible first point of contact for care questions and problems. Contact details are provided with your handover.'],
      },
      {
        heading: 'Equipment and care guidance',
        body: [
          'Cleaning, timber care, ventilation, heater care and periods of non-use follow the approved guidance for your model and equipment, and the manufacturers’ own documentation. We do not give general safety procedures for heating equipment here.',
        ],
      },
      {
        heading: 'Warranty',
        body: ['Warranty coverage, exclusions and the claim process are published on the warranty page once approved.'],
      },
    ],
    relatedLinks: [{ href: '/care-support', label: 'Care & support' }],
    approval: 'working',
    reviewer: null,
    published: null,
    updated: null,
  },
  {
    slug: 'questions-for-a-holiday-property-project',
    title: 'Questions for a holiday-property project',
    summary: 'What we will ask when a sauna is for guests rather than a household.',
    topic: 'Commercial',
    intro:
      'A sauna for guests or clients is a different project from one for a household. These are the things we assess together.',
    sections: [
      {
        heading: 'How it will be used',
        body: ['Use intensity, occupancy and how often it is used all affect which equipment and layout are suitable.'],
        list: ['Who will use it, and how many at once?', 'How often, and at what times of day?', 'Is it for a new or existing venue?'],
      },
      {
        heading: 'Running it day to day',
        body: ['Maintenance, cleaning and operating arrangements matter as much as the cabin. We will ask who will look after it.'],
      },
      {
        heading: 'Coordination',
        body: ['We coordinate with operators and contractors already involved, so tell us who they are and your opening target.'],
      },
      {
        heading: 'The starting range',
        body: [
          'The three standard models are a starting point for discussion. Commercial suitability needs separate assessment for each project, and we do not assume a standard model fits any venue.',
        ],
      },
    ],
    relatedLinks: [{ href: '/commercial', label: 'Discuss a commercial project' }],
    approval: 'working',
    reviewer: null,
    published: null,
    updated: null,
  },
];
