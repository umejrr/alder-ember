/**
 * Policy pages. Privacy and Terms are standard UK boilerplate, written on 22 October 2026 at the owner's request and
 * approved by the owner. They deliberately state nothing the business has not told us: no registered company details,
 * no addresses, no named contact channel and no deposit or cancellation terms (those belong in the written quotation).
 * There is no warranty page: cover is a commitment only the owner and the manufacturer can set, so none is published until they supply it.
 */
import type { ApprovalStatus } from './types';

export interface PolicySection {
  /** anchor, so another page can link to this section (for example /privacy#cookies) */
  id?: string;
  heading: string;
  paragraphs: string[];
  /** an optional bulleted list, shown after the paragraphs */
  list?: string[];
}

export interface Policy {
  slug: 'privacy' | 'terms';
  title: string;
  seoTitle: string;
  summary: string;
  /** Approved policy sections. Empty until supplied. */
  body: PolicySection[];
  /** shown under the summary when the text is published */
  updated?: string;
  approval: ApprovalStatus;
  approver: string;
  /** Open decisions the approved text must cover (from brief section 25) */
  openItems: string[];
}

export const policies: Record<Policy['slug'], Policy> = {
  privacy: {
    slug: 'privacy',
    title: 'Privacy notice',
    seoTitle: 'Privacy Notice | Alder & Ember',
    summary: 'How we use the details you give us, who we share them with, how long we keep them and what your rights are.',
    updated: '22 October 2026',
    body: [
      {
        heading: 'Who we are',
        paragraphs: [
          'Alder & Ember (“we”, “us”) supplies and installs outdoor saunas in the United Kingdom. We are the controller of the personal information described in this notice, which means we decide how and why it is used.',
          'If you have a question about this notice, or want to use any of your rights, contact us through the Plan your sauna page and say that your message is about personal information.',
        ],
      },
      {
        heading: 'What we collect',
        paragraphs: ['We collect only what you choose to give us, and a small amount that your browser shares automatically.'],
        list: [
          'Enquiry details: your name, email address, postcode and, if you give it, your phone number.',
          'Project details: a description of your space, the model you are interested in, how many people will use the sauna, your heating preference, whether you would like a changing area, and whether the project is for a home or a business.',
          'Anything else you write in the message boxes. Please do not include sensitive information such as health details.',
          'Your marketing choice, if you give one. It is optional and is never pre-selected.',
          'Technical information that every website receives, such as your IP address and browser type, which our hosting provider may keep in standard server logs for security.',
        ],
      },
      {
        heading: 'Why we use it, and our legal basis',
        paragraphs: ['We use personal information under the UK GDPR and the Data Protection Act 2018, for these purposes only:'],
        list: [
          'To reply to your enquiry, assess your space and access, and prepare a quotation. This is necessary to take steps at your request before a contract, and is in our legitimate interest in running our business.',
          'To keep records of quotations, orders, installation and aftercare, and to meet our legal, tax and accounting duties. The legal bases are contract and legal obligation.',
          'To send you news about our products, only if you ticked the optional marketing box. The legal basis is your consent, and you can withdraw it at any time.',
          'To keep the website secure and working. This is in our legitimate interest.',
        ],
      },
      {
        heading: 'Who we share it with',
        paragraphs: [
          'We share personal information only where we need to. That means service providers who help us run the website and handle enquiries, such as website hosting, email and customer-record systems, who may use it only to provide their service to us; our specialist manufacturing partner, only what is needed to confirm a specification and arrange manufacture and delivery of an order; and professional advisers, regulators or the authorities where the law requires.',
          'We do not sell personal information. If a provider handles it outside the UK, we make sure an appropriate safeguard is in place, such as an adequacy decision or the ICO’s international data transfer agreement.',
        ],
      },
      {
        heading: 'How long we keep it',
        paragraphs: [
          'If an enquiry does not lead to an order, we keep it for up to three years after our last contact with you, and then delete it. If you become a customer, we keep your records for as long as we need them to deal with your order and aftercare, and for six years after the order ends to meet legal and accounting requirements. We keep your marketing choice until you change it.',
        ],
      },
      {
        heading: 'Your rights',
        paragraphs: ['You have the right to:'],
        list: [
          'be told how your information is used, and ask for a copy of it;',
          'have inaccurate information corrected, and incomplete information completed;',
          'ask us to delete it, or to restrict how we use it, in the circumstances the law sets out;',
          'object to our use of it where we rely on legitimate interests, and to any direct marketing;',
          'receive the information you gave us in a portable format, where the law applies;',
          'withdraw your consent at any time, where we rely on it.',
        ],
      },
      {
        paragraphs: [
          'We reply to a request within one month, and do not normally charge for it. If you are not happy with how we have handled your information, you can complain to the Information Commissioner’s Office at ico.org.uk or on 0303 123 1113. We would appreciate the chance to put things right first.',
        ],
        heading: 'Making a request or a complaint',
      },
      {
        id: 'cookies',
        heading: 'Cookies and similar technologies',
        paragraphs: [
          'This website does not set cookies, and does not use analytics, advertising or tracking tools.',
          'It uses your browser’s session storage to remember choices you make while you browse, such as the model you picked, so they carry over to the enquiry form. This stays on your device, contains no personal details, is never sent to us, and is cleared when you close the tab.',
          'If we add analytics or marketing tools in future, we will ask for your consent first and update this notice.',
        ],
      },
      {
        heading: 'Changes to this notice',
        paragraphs: ['We may update this notice from time to time. The date at the top shows when it was last changed.'],
      },
    ],
    approval: 'approved',
    approver: 'Owner',
    openItems: [],
  },
  terms: {
    slug: 'terms',
    title: 'Website terms',
    seoTitle: 'Website Terms | Alder & Ember',
    summary: 'The terms for using this website, and how quotations and orders work.',
    updated: '22 October 2026',
    body: [
      {
        heading: 'About these terms',
        paragraphs: [
          'These terms apply to your use of this website, which is run by Alder & Ember (“we”, “us”). By using the website you agree to them. If you do not agree, please do not use it.',
        ],
      },
      {
        heading: 'Information on this website',
        paragraphs: [
          'We take care to keep the information here accurate, but it is general information and may change. Sizes, capacities, starting prices and lead times are guides. A starting price is for the cabin, including VAT. Delivery, installation and anything that depends on your site are confirmed in your itemised quotation, so a starting price is not a confirmed installed total.',
          'Photographs are for illustration. Timber is a natural material, so its colour and grain vary from one cabin to the next. Nothing on this website is an offer that you can accept.',
        ],
      },
      {
        heading: 'Quotations and orders',
        paragraphs: [
          'No sale is made through this website. After we have reviewed your space and access, we send you an itemised quotation that sets out the specification, the price, what we will do and what is assessed separately, such as ground preparation and electrical connection. Bespoke changes need confirmation from the manufacturer before we can quote.',
          'A contract is made only when you accept a quotation and we confirm your order. The quotation, and any terms it refers to, then govern the sale.',
          'If you are a consumer, nothing in these terms affects your statutory rights, including those under the Consumer Rights Act 2015.',
        ],
      },
      {
        heading: 'Using the website',
        paragraphs: [
          'You may use the website to find out about our saunas and to contact us. Please do not misuse it: do not try to disrupt it or gain unauthorised access, do not send anything harmful or unlawful through it, and do not give someone else’s details without their permission.',
        ],
      },
      {
        heading: 'Our content',
        paragraphs: [
          'The text, photographs, design and logo on this website belong to Alder & Ember or its licensors. You may view and print pages for your own personal use while planning a purchase. You may not copy or reuse them for any other purpose without our written permission.',
        ],
      },
      {
        heading: 'Links to other websites',
        paragraphs: ['We may link to other websites for convenience. We do not control them and are not responsible for what they contain.'],
      },
      {
        heading: 'Our responsibility to you',
        paragraphs: [
          'Nothing in these terms limits or excludes our liability for death or personal injury caused by our negligence, for fraud, or for anything else that the law does not allow us to limit or exclude.',
          'The website is provided as it is. To the extent the law allows, we are not responsible for loss that arises from your use of the website or from relying on it, or from the website being unavailable.',
        ],
      },
      {
        heading: 'Your personal information',
        paragraphs: ['Our privacy notice explains how we use the personal information you give us.'],
      },
      {
        heading: 'Changes to these terms',
        paragraphs: ['We may change these terms and the website from time to time. The terms shown here when you use the website are the ones that apply.'],
      },
      {
        heading: 'Governing law',
        paragraphs: [
          'These terms, and any dispute about them, are governed by the law of England and Wales, and the courts of England and Wales have non-exclusive jurisdiction. If you live in Scotland or Northern Ireland, you may also bring proceedings in your local courts.',
        ],
      },
    ],
    approval: 'approved',
    approver: 'Owner',
    openItems: [],
  },
};
