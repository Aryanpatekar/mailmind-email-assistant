/**
 * Utility: Fallback Email Templates
 * Used when Gemini AI is unavailable or fails.
 * Covers the most common email purposes with tone adaptation.
 */

'use strict';

const TEMPLATES = {
  leave_request: {
    formal: {
      subject: 'Leave Application Request Due to Unavoidable Circumstances',
      body: `Dear Sir/Madam,

I hope this email finds you well.

I am writing to formally request leave from work/engagements for the upcoming days. Due to sudden and unavoidable circumstances concerning my health and personal well-being, I am strictly advised to take rest and consequently unable to attend to my scheduled duties during this period. I have been experiencing significant discomfort, which makes it incredibly difficult for me to participate effectively.

I sincerely regret missing my regular responsibilities and any important scheduled events, and I apologize for any inconvenience my sudden absence may cause the team. I kindly request you to consider my situation and approve my leave.

I will ensure that all critical pending tasks are documented and addressed to the best of my ability before my absence. I will also remain available for any urgent matters via email if absolutely necessary.

Thank you very much for your understanding, continuous support, and consideration regarding this matter.

Yours sincerely,
[Your Name]
[Your Role/Designation]
[Your Department/Organization]`,
    },
    polite: {
      subject: 'Leave of Absence Request',
      body: `Dear [Manager's Name],

I hope you are having a good week.

I am writing to politely request a few days of leave. I have unfortunately fallen ill and require some time to properly rest and recover. It is important that I take this time to regain my health so I can return to work at full capacity.

I am currently organizing my workload to ensure that my active projects are handed over and that there are no major disruptions while I am away. I apologize for any inconvenience this may cause the team during this busy period.

Please let me know if you need any additional information or documentation regarding my absence. I truly appreciate your support.

Best regards,
[Your Name]
[Your Role]`,
    },
    friendly: {
      subject: 'Taking a couple of sick days off',
      body: `Hi Team,

I hope you're all doing well!

I wanted to quickly let you know that I'm feeling quite under the weather today and will need to take a couple of days off to rest and recover. Symptoms hit me suddenly, and I just need some time to get back to 100%.

I'll be wrapping up the most urgent things on my plate today so nobody is blocked. If something absolutely critical comes up that only I can answer, feel free to drop me an email and I'll try to check in briefly.

Thanks so much for understanding and covering for me!

Best,
[Your Name]`,
    },
    neutral: {
      subject: 'Leave Request Notification',
      body: `Dear Sir/Madam,

I am writing this email to notify you of my requirement to take a leave of absence for a few days due to pressing medical and personal reasons. 

I will ensure all pending work is either completed or effectively handed over to a colleague prior to my absence. It is my priority to minimize any operational impact during this time.

Please let me know if any further administrative steps are required from my end to formalize this request.

Regards,
[Your Name]`,
    },
  },

  meeting_request: {
    formal: {
      subject: 'Request for a Meeting',
      body: `Dear Sir/Madam,

I am writing to request a meeting at your earliest convenience to discuss [matter]. I would appreciate the opportunity to present my thoughts and gather your valuable input.

Please let me know your available time slots, and I will arrange accordingly.

Yours sincerely,
[Your Name]`,
    },
    polite: {
      subject: 'Meeting Request',
      body: `Dear [Name],

I would like to schedule a brief meeting with you to discuss [topic]. Would you be available sometime this week?

Please let me know what time works best for you.

Best regards,
[Your Name]`,
    },
    friendly: {
      subject: 'Quick chat?',
      body: `Hey,

Would you have some time for a quick meeting this week? I'd love to catch up and talk through [topic].

Let me know what works for you!

Cheers,
[Your Name]`,
    },
    neutral: {
      subject: 'Meeting Request',
      body: `Dear Sir/Madam,

I would like to request a meeting to discuss an important matter. Please let me know your available time slots.

Regards,
[Your Name]`,
    },
  },

  follow_up: {
    formal: {
      subject: 'Follow-Up on Previous Communication',
      body: `Dear Sir/Madam,

I am writing to follow up on my previous email regarding [topic]. I wanted to check if you had the opportunity to review it and if any further information is required from my end.

I look forward to your response at your earliest convenience.

Yours sincerely,
[Your Name]`,
    },
    polite: {
      subject: 'Following Up',
      body: `Dear [Name],

I just wanted to follow up on my earlier email about [topic]. Please let me know if you need any additional information or if there's any update.

Best regards,
[Your Name]`,
    },
    friendly: {
      subject: 'Just checking in',
      body: `Hey,

Wanted to follow up on [topic] – any updates on your end?

Thanks!`,
    },
    neutral: {
      subject: 'Follow-Up Email',
      body: `Dear Sir/Madam,

This is a follow-up to my previous email regarding [topic]. Please let me know if any action is required.

Regards,
[Your Name]`,
    },
  },

  task_submission: {
    formal: {
      subject: 'Submission of [Task/Assignment/Report]',
      body: `Dear Sir/Madam,

I am pleased to submit the [task/assignment/report] as requested. Please find the details enclosed.

I have ensured that all requirements have been met. Please do not hesitate to contact me should you require any clarification.

Yours sincerely,
[Your Name]`,
    },
    polite: {
      subject: 'Task Submission',
      body: `Dear [Name],

Please find attached my submission for [task]. I've completed everything as required and I'm happy to make any changes if needed.

Looking forward to your feedback.

Best regards,
[Your Name]`,
    },
    friendly: {
      subject: 'Assignment submitted!',
      body: `Hey,

Just sent in my submission for [task]. Let me know if you need anything else from me!

Cheers,
[Your Name]`,
    },
    neutral: {
      subject: 'Submission',
      body: `Dear Sir/Madam,

I am submitting the required [task/document] as requested. Please review and let me know if further action is needed.

Regards,
[Your Name]`,
    },
  },

  complaint: {
    formal: {
      subject: 'Formal Complaint Regarding [Issue]',
      body: `Dear Sir/Madam,

I am writing to bring to your attention a concern that I believe requires immediate consideration. [Brief description of issue].

I respectfully request that this matter be addressed promptly. I am confident that a satisfactory resolution can be reached.

Yours sincerely,
[Your Name]`,
    },
    polite: {
      subject: 'Concern I Wanted to Raise',
      body: `Dear [Name],

I hope you're doing well. I wanted to raise a concern about [issue] that I feel needs attention.

I would appreciate it if this could be looked into. Please let me know if you need any more details.

Best regards,
[Your Name]`,
    },
    neutral: {
      subject: 'Complaint',
      body: `Dear Sir/Madam,

I am writing to report an issue with [topic]. I would appreciate your assistance in resolving this matter.

Regards,
[Your Name]`,
    },
  },

  thank_you: {
    formal: {
      subject: 'Expression of Gratitude',
      body: `Dear Sir/Madam,

I am writing to sincerely thank you for [reason]. Your support and assistance have been invaluable, and I am truly grateful.

Yours sincerely,
[Your Name]`,
    },
    polite: {
      subject: 'Thank You',
      body: `Dear [Name],

I just wanted to take a moment to thank you for [reason]. I really appreciate your help and support.

Best regards,
[Your Name]`,
    },
    friendly: {
      subject: 'Thanks a lot!',
      body: `Hey,

Just wanted to say a big thank you for [reason] – really appreciate it!

Cheers,
[Your Name]`,
    },
    neutral: {
      subject: 'Thank You',
      body: `Dear Sir/Madam,

I am writing to express my gratitude for [reason]. Thank you for your time and assistance.

Regards,
[Your Name]`,
    },
  },

  apology: {
    formal: {
      subject: 'Formal Apology',
      body: `Dear Sir/Madam,

I am writing to sincerely apologize for [issue/incident]. I fully acknowledge the inconvenience caused and take complete responsibility.

I assure you that steps will be taken to prevent recurrence. I value this relationship and am committed to making this right.

Yours sincerely,
[Your Name]`,
    },
    polite: {
      subject: 'My Apologies',
      body: `Dear [Name],

I wanted to apologize for [issue]. I understand this may have caused inconvenience and I'm truly sorry.

I'll make sure it doesn't happen again. Please let me know if there's anything I can do.

Best regards,
[Your Name]`,
    },
    friendly: {
      subject: 'Sorry about that!',
      body: `Hey,

Really sorry about [issue] – my bad! I'll make sure it doesn't happen again.

Thanks for being understanding!`,
    },
    neutral: {
      subject: 'Apology',
      body: `Dear Sir/Madam,

I apologize for [issue] and any inconvenience this may have caused. I will work to resolve the situation promptly.

Regards,
[Your Name]`,
    },
  },

  job_application: {
    formal: {
      subject: 'Application for the Position of [Role]',
      body: `Dear Sir/Madam,

I am writing to express my keen interest in the [position] role at your esteemed organization. I have the required qualifications and experience to contribute effectively to your team.

I have attached my resume for your review and would welcome the opportunity to discuss my suitability further.

Yours sincerely,
[Your Name]`,
    },
    polite: {
      subject: 'Job Application — [Role]',
      body: `Dear [Hiring Manager],

I am excited to apply for the [position] role. I believe my skills and background make me a strong candidate for this opportunity.

Please find my resume attached. I'd love to discuss how I can contribute to your team.

Best regards,
[Your Name]`,
    },
    neutral: {
      subject: 'Job Application',
      body: `Dear Sir/Madam,

I would like to apply for the [position] role. Please find my resume attached for your consideration.

Regards,
[Your Name]`,
    },
  },

  referral: {
    formal: {
      subject: 'Referral/Recommendation for [Name]',
      body: `Dear Sir/Madam,

I am writing to refer [Name] for consideration for the [position/opportunity]. I have had the privilege of working with [Name] and can confidently attest to their exceptional skills and dedication.

I believe [Name] would be a valuable addition to your organization.

Yours sincerely,
[Your Name]`,
    },
    polite: {
      subject: 'Referral for [Name]',
      body: `Dear [Name],

I wanted to put in a referral for [Candidate Name] for the [role/opportunity]. I've had the chance to work with them and they'd be a great fit.

Please feel free to reach out if you need more information.

Best regards,
[Your Name]`,
    },
    neutral: {
      subject: 'Referral',
      body: `Dear Sir/Madam,

I am referring [Name] for the [position/opportunity]. I believe they are well-qualified and would be a good fit.

Regards,
[Your Name]`,
    },
  },

  introduction: {
    formal: {
      subject: 'Introduction — [Your Name]',
      body: `Dear Sir/Madam,

I would like to take this opportunity to introduce myself. My name is [Your Name], and I am [brief description of your role/background].

I look forward to connecting and exploring potential opportunities to collaborate.

Yours sincerely,
[Your Name]`,
    },
    polite: {
      subject: 'Introduction',
      body: `Dear [Name],

I wanted to reach out and introduce myself. I'm [Your Name] and I [brief background].

Looking forward to connecting with you!

Best regards,
[Your Name]`,
    },
    friendly: {
      subject: 'Hey, let me introduce myself!',
      body: `Hey [Name],

Just thought I'd reach out and say hi! I'm [Your Name] and [brief intro].

Hope we can connect soon!

Cheers,
[Your Name]`,
    },
    neutral: {
      subject: 'Introduction',
      body: `Dear Sir/Madam,

I am writing to introduce myself. My name is [Your Name] and I am reaching out to connect.

Regards,
[Your Name]`,
    },
  },

  general_request: {
    formal: {
      subject: 'Request for Assistance',
      body: `Dear Sir/Madam,

I am writing to formally request your assistance regarding [matter]. I would greatly appreciate your guidance and support in this regard.

Looking forward to your prompt response.

Yours sincerely,
[Your Name]`,
    },
    polite: {
      subject: 'Quick Request',
      body: `Dear [Name],

I hope you're doing well. I wanted to reach out with a quick request — [brief description].

Please let me know if this is possible. Thank you so much!

Best regards,
[Your Name]`,
    },
    friendly: {
      subject: 'Hey, needed a quick favor',
      body: `Hey,

Hope you're doing great! I just wanted to check — [request]. Would you be able to help?

Thanks so much!`,
    },
    neutral: {
      subject: 'Request',
      body: `Dear Sir/Madam,

I am writing to request [matter]. Please let me know how to proceed.

Regards,
[Your Name]`,
    },
  },
};

/**
 * Get a fallback template for the given purpose and tone
 * @param {string} purpose - e.g. 'leave_request', 'meeting_request'
 * @param {string} tone - e.g. 'formal', 'polite', 'friendly', 'neutral'
 * @param {Object} intent - Intent object for context enrichment
 * @returns {{ subject: string, body: string }}
 */
function getTemplate(purpose, tone, intent = {}) {
  const purposeTemplates = TEMPLATES[purpose] || TEMPLATES.general_request;
  const toneTemplate = purposeTemplates[tone] || purposeTemplates.neutral || purposeTemplates.formal;

  if (!toneTemplate) {
    return {
      subject: 'Email',
      body: 'Dear Sir/Madam,\n\nI am writing to you regarding the matter discussed.\n\nRegards,\n[Your Name]',
    };
  }

  return {
    subject: toneTemplate.subject,
    body:    toneTemplate.body,
  };
}

/**
 * Get list of all available template purposes
 * @returns {string[]}
 */
function getAvailablePurposes() {
  return Object.keys(TEMPLATES);
}

module.exports = { getTemplate, getAvailablePurposes };
