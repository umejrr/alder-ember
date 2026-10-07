/**
 * Planning FAQs. Answers stay at the level the brief supports: no numeric base sizes,
 * clearances or access widths are given because none are approved.
 * Status 'brief' = wording derived directly from the supplied scope and process.
 */
import type { Faq } from './types';

export const faqs: Faq[] = [
  {
    id: 'base',
    topic: 'base',
    question: 'What base does a sauna need?',
    answer: [
      'A sauna needs a suitable, level base. The right type and size depends on the model and on your ground, and ground preparation is assessed separately from the sauna itself.',
      'We confirm the base requirements for your chosen model during the site review, before your order is confirmed.',
    ],
    linkHref: '/installation-delivery#prepare',
    linkLabel: 'Prepare the site',
    approval: 'brief',
  },
  {
    id: 'access',
    topic: 'access',
    question: 'Can a sauna be delivered into my garden?',
    answer: [
      'Access matters as much as space. We ask about gates, paths, steps, corners and overhead obstructions, starting with photographs and approximate measurements.',
      'Straightforward sites may be assessed from photos or a video call. More complex sites may need a visit. Specialist lifting and non-standard access work are assessed separately.',
    ],
    linkHref: '/installation-delivery#assess',
    linkLabel: 'How we assess your space',
    approval: 'brief',
  },
  {
    id: 'area',
    topic: 'area',
    question: 'How much room do I need around it?',
    answer: [
      'A cabin’s exterior size is not the whole picture. You also need room for the base, clearances around the cabin, and a route in for delivery.',
      'We confirm clearances against the approved specification for your model and heater, rather than estimating them from the cabin’s size.',
    ],
    linkHref: '/guides/planning-base-and-access',
    linkLabel: 'Read the planning guide',
    approval: 'brief',
  },
  {
    id: 'price',
    topic: 'price',
    question: 'What does the starting price include?',
    answer: [
      'The starting price is for the cabin as described on each model page, including VAT.',
      'Delivery and installation scope, and anything that depends on your site, such as ground preparation, electrical connection or specialist lifting, are set out in your itemised quotation. It is not a confirmed installed total.',
    ],
    linkHref: '/installation-delivery#responsibilities',
    linkLabel: 'Who does what',
    approval: 'brief',
  },
  {
    id: 'next',
    topic: 'next-steps',
    question: 'What happens after I enquire?',
    answer: [
      'The team reviews your project and aims to respond within one business day during working hours.',
      'From there we help you choose a model, check your space and access, confirm the specification and quote, and arrange installation and handover once your site requirements have been checked.',
    ],
    linkHref: '/plan-your-sauna',
    linkLabel: 'Plan your sauna',
    approval: 'brief',
  },
];

/** Used on the compact "planning questions" section of the homepage (the five high-value questions). */
export const homeFaqIds = ['base', 'access', 'area', 'price', 'next'];

export const modelFaqs: Faq[] = [
  {
    id: 'heating',
    topic: 'heating',
    question: 'Which heating can I choose?',
    answer: [
      'Electric heating suits customers who want straightforward controls and regular use. Selected wood-burning configurations suit people who are comfortable tending a fire and managing the maintenance and site considerations that come with it.',
      'Equipment sizing, electrical supply, ventilation, flues and clearances follow the approved equipment specification. Warm-up times vary by model, heater, starting temperature and weather, so we do not publish a single figure.',
    ],
    approval: 'brief',
  },
  {
    id: 'commercial',
    topic: 'commercial',
    question: 'Can I use a standard model for a business?',
    answer: [
      'Commercial use needs a separate assessment of use intensity, occupancy, maintenance, cleaning, operating arrangements and equipment suitability. We would rather assess it with you than assume a standard model fits.',
    ],
    linkHref: '/commercial',
    linkLabel: 'Discuss a commercial project',
    approval: 'brief',
  },
];
