// @desc    Get emergency contacts and hotlines
// @route   GET /api/support/emergency
// @access  Public
exports.getEmergencyContacts = async (req, res, next) => {
  try {
    const emergencyContacts = {
      global: [
        {
          name: 'Emergency Services',
          number: '911',
          description: 'Police, Fire, Medical Emergency',
          available: '24/7'
        }
      ],
      domestic_violence: [
        {
          name: 'National Domestic Violence Hotline',
          number: '1-800-799-7233',
          website: 'https://www.thehotline.org',
          description: 'Confidential support for domestic violence victims',
          available: '24/7'
        }
      ],
      child_protection: [
        {
          name: 'Childhelp National Child Abuse Hotline',
          number: '1-800-422-4453',
          website: 'https://www.childhelp.org',
          description: 'Professional crisis counselors for child abuse',
          available: '24/7'
        }
      ],
      sexual_assault: [
        {
          name: 'RAINN National Sexual Assault Hotline',
          number: '1-800-656-4673',
          website: 'https://www.rainn.org',
          description: 'Support for sexual assault survivors',
          available: '24/7'
        }
      ],
      cyber_crime: [
        {
          name: 'FBI Internet Crime Complaint Center',
          website: 'https://www.ic3.gov',
          description: 'Report internet-facilitated crimes',
          available: 'Online reporting'
        }
      ]
    };

    res.json({
      success: true,
      data: emergencyContacts
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Report emergency situation
// @route   POST /api/support/emergency
// @access  Public
exports.reportEmergency = async (req, res, next) => {
  try {
    const { type, description, location, contactNumber } = req.body;

    // In a real application, this would trigger immediate alerts
    // to appropriate authorities and support staff

    res.json({
      success: true,
      message: 'Emergency report received. Help is on the way.',
      data: {
        reportId: `EMG-${Date.now()}`,
        type,
        timestamp: new Date(),
        status: 'urgent',
        nextSteps: [
          'Your report has been flagged as urgent',
          'Local authorities have been notified',
          'A support specialist will contact you shortly',
          'If in immediate danger, call 911'
        ]
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get crisis hotlines by category
// @route   GET /api/support/hotlines
// @access  Public
exports.getHotlines = async (req, res, next) => {
  try {
    const { category } = req.query;

    const hotlines = {
      mental_health: [
        {
          name: 'National Suicide Prevention Lifeline',
          number: '988',
          description: 'Free and confidential support for people in distress',
          available: '24/7'
        },
        {
          name: 'Crisis Text Line',
          number: 'Text HOME to 741741',
          description: 'Free 24/7 support via text message',
          available: '24/7'
        }
      ],
      substance_abuse: [
        {
          name: 'SAMHSA National Helpline',
          number: '1-800-662-4357',
          description: 'Treatment referral and information service',
          available: '24/7'
        }
      ],
      lgbtq: [
        {
          name: 'The Trevor Project',
          number: '1-866-488-7386',
          description: 'Crisis intervention for LGBTQ youth',
          available: '24/7'
        }
      ]
    };

    const result = category ? { [category]: hotlines[category] } : hotlines;

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get legal resources and services
// @route   GET /api/support/legal
// @access  Public
exports.getLegalResources = async (req, res, next) => {
  try {
    const legalResources = [
      {
        name: 'Legal Aid Services',
        description: 'Free or low-cost legal assistance',
        services: [
          'Restraining orders',
          'Custody issues',
          'Divorce proceedings',
          'Criminal prosecution support'
        ],
        contact: '1-800-555-LEGAL',
        website: 'https://www.legalaid.org'
      },
      {
        name: 'Victim Rights Law Center',
        description: 'Legal services for sexual assault victims',
        services: [
          'Legal representation',
          'Court advocacy',
          'Rights education'
        ],
        website: 'https://www.victimrights.org'
      },
      {
        name: 'Cyber Civil Rights Initiative',
        description: 'Legal support for online harassment victims',
        services: [
          'Content removal assistance',
          'Legal referrals',
          'Safety planning'
        ],
        website: 'https://www.cybercivilrights.org'
      }
    ];

    res.json({
      success: true,
      count: legalResources.length,
      data: legalResources
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get counseling and mental health services
// @route   GET /api/support/counseling
// @access  Public
exports.getCounselingServices = async (req, res, next) => {
  try {
    const counselingServices = [
      {
        name: 'Online Therapy Platforms',
        description: 'Virtual counseling services',
        providers: [
          {
            name: 'BetterHelp',
            website: 'https://www.betterhelp.com',
            features: ['Licensed therapists', 'Flexible scheduling', 'Affordable rates']
          },
          {
            name: 'Talkspace',
            website: 'https://www.talkspace.com',
            features: ['Text, audio, video therapy', 'Insurance accepted']
          }
        ]
      },
      {
        name: 'Support Groups',
        description: 'Peer support and group therapy',
        types: [
          'Domestic violence survivors',
          'Sexual assault survivors',
          'Cyberbullying victims',
          'Family support groups'
        ]
      },
      {
        name: 'Crisis Counseling',
        description: 'Immediate mental health support',
        contact: '988 - Suicide & Crisis Lifeline',
        available: '24/7'
      }
    ];

    res.json({
      success: true,
      data: counselingServices
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get technical support resources
// @route   GET /api/support/technical
// @access  Public
exports.getTechnicalSupport = async (req, res, next) => {
  try {
    const technicalSupport = [
      {
        category: 'Device Security',
        resources: [
          {
            title: 'Secure Your Devices',
            description: 'Step-by-step guides for securing phones and computers',
            topics: ['Password protection', 'Two-factor authentication', 'Privacy settings']
          },
          {
            title: 'Detect Spyware',
            description: 'How to identify and remove monitoring software',
            topics: ['Signs of spyware', 'Removal tools', 'Prevention tips']
          }
        ]
      },
      {
        category: 'Online Safety',
        resources: [
          {
            title: 'Social Media Privacy',
            description: 'Protect your online presence',
            topics: ['Privacy settings', 'Blocking users', 'Reporting abuse']
          },
          {
            title: 'Digital Evidence Collection',
            description: 'Documenting online harassment',
            topics: ['Screenshots', 'URL preservation', 'Metadata']
          }
        ]
      },
      {
        category: 'Account Security',
        resources: [
          {
            title: 'Password Management',
            description: 'Creating and managing secure passwords',
            topics: ['Password managers', 'Strong passwords', 'Account recovery']
          }
        ]
      }
    ];

    res.json({
      success: true,
      data: technicalSupport
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all support categories
// @route   GET /api/support/categories
// @access  Public
exports.getSupportCategories = async (req, res, next) => {
  try {
    const categories = [
      {
        id: 'emergency',
        name: 'Emergency Services',
        description: 'Immediate help for urgent situations',
        icon: 'emergency'
      },
      {
        id: 'legal',
        name: 'Legal Resources',
        description: 'Legal aid and advocacy services',
        icon: 'legal'
      },
      {
        id: 'counseling',
        name: 'Counseling Services',
        description: 'Mental health and emotional support',
        icon: 'counseling'
      },
      {
        id: 'technical',
        name: 'Technical Support',
        description: 'Digital safety and security guidance',
        icon: 'technical'
      },
      {
        id: 'hotlines',
        name: 'Crisis Hotlines',
        description: '24/7 phone and text support',
        icon: 'hotline'
      }
    ];

    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get resources by location
// @route   GET /api/support/location/:country
// @access  Public
exports.getResourcesByLocation = async (req, res, next) => {
  try {
    const { country } = req.params;

    // This would typically query a database of location-specific resources
    const resources = {
      US: {
        emergency: '911',
        domesticViolence: '1-800-799-7233',
        childProtection: '1-800-422-4453',
        localServices: [
          'State-specific legal aid',
          'Regional shelters',
          'Community support centers'
        ]
      },
      UK: {
        emergency: '999',
        domesticViolence: '0808 2000 247',
        childProtection: '0800 1111',
        localServices: [
          'Citizens Advice',
          'Women\'s Aid',
          'NSPCC'
        ]
      }
    };

    const locationResources = resources[country.toUpperCase()] || {
      message: 'For location-specific resources, please contact local authorities or international organizations.'
    };

    res.json({
      success: true,
      country: country.toUpperCase(),
      data: locationResources
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get frequently asked questions
// @route   GET /api/support/faq
// @access  Public
exports.getFrequentlyAskedQuestions = async (req, res, next) => {
  try {
    const faqs = [
      {
        category: 'Reporting',
        questions: [
          {
            question: 'Can I report anonymously?',
            answer: 'Yes, you can submit reports without providing personal information. However, providing contact details helps us follow up and provide better support.'
          },
          {
            question: 'What happens after I submit a report?',
            answer: 'Your report is reviewed by our team, assigned a case ID, and appropriate resources are provided. For urgent cases, immediate action is taken.'
          }
        ]
      },
      {
        category: 'Safety',
        questions: [
          {
            question: 'How do I stay safe online?',
            answer: 'Use strong passwords, enable two-factor authentication, be cautious about sharing personal information, and regularly review privacy settings.'
          },
          {
            question: 'What if I think my device is being monitored?',
            answer: 'Look for unusual battery drain, data usage, or device behavior. Use our technical support resources or contact a specialist for help.'
          }
        ]
      },
      {
        category: 'Support Services',
        questions: [
          {
            question: 'Are support services free?',
            answer: 'Most crisis hotlines and initial consultations are free. Some specialized services may have costs, but financial assistance is often available.'
          },
          {
            question: 'Can I get help if I\'m not sure it\'s serious?',
            answer: 'Absolutely. It\'s better to reach out even if you\'re unsure. Our resources are here to help assess your situation and provide appropriate support.'
          }
        ]
      }
    ];

    res.json({
      success: true,
      data: faqs
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Submit contact form
// @route   POST /api/support/contact
// @access  Public
exports.submitContactForm = async (req, res, next) => {
  try {
    const { name, email, subject, message, category } = req.body;

    // In a real application, this would:
    // 1. Save to database
    // 2. Send email notification to support team
    // 3. Send confirmation email to user

    res.json({
      success: true,
      message: 'Your message has been received. We will respond within 24-48 hours.',
      data: {
        ticketId: `SUPPORT-${Date.now()}`,
        submittedAt: new Date(),
        category: category || 'general'
      }
    });
  } catch (error) {
    next(error);
  }
};
