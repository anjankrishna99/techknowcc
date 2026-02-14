/* ============================================
   TECHKNOW -- WhatsApp-Style Chat Widget
   Smart bot with onboarding, lead capture,
   conversation tracking, and WhatsApp handoff
   ============================================ */

(function () {
    'use strict';

    var WHATSAPP_NUMBER = '919849050333';
    var BOT_NAME = 'Techknow Assistant';
    var COMPANY = 'Techknow Constructions & Consultations';

    // ---- Knowledge Base ----
    var KB = {
        services: [
            'Residential Construction',
            'Commercial Construction',
            'Green Building Consultation',
            'Solar & Renewable Integration',
            'Project Management',
            'Environmental Compliance'
        ],
        serviceDetails: {
            residential: 'We build eco-friendly homes using sustainable materials, rainwater harvesting systems, and energy-efficient designs. Our homes achieve up to 40% energy savings compared to conventional builds.',
            commercial: 'We deliver LEED-certified commercial spaces -- offices, retail, and mixed-use developments that balance business needs with environmental responsibility.',
            consultation: 'Our experts guide you through sustainable architecture, green certifications (IGBC, LEED, GRIHA), and eco-compliant design for new and existing structures.',
            solar: 'We design and install solar panels, wind energy systems, and other renewable solutions seamlessly integrated into your building infrastructure.',
            project: 'End-to-end project oversight from planning to completion -- ensuring timelines, budgets, and sustainability goals are met without compromise.',
            compliance: 'We ensure all projects meet environmental regulations, sustainability standards, and green building codes with thorough assessments and documentation.'
        },
        location: 'SMR Vinay Sky City, Opp. The Hyderabad Public School, Ramanthapur, Hyderabad-500013, India',
        email: 'info@techknowcc.com',
        phone: '+91 9849050333',
        hours: 'Mon-Fri: 9 AM - 5 PM | Sat: 9 AM - 3 PM | Sun: Closed',
        experience: '30+ years',
        projects: '500+ completed projects'
    };

    // ---- Onboarding State ----
    var ONBOARD_STEPS = ['name', 'email', 'type', 'phone'];
    var onboardingStep = 0;
    var onboardingComplete = false;
    var customerInfo = {
        name: '',
        email: '',
        type: '',   // Company or Individual
        phone: '',
        timestamp: ''
    };

    // ---- Intent Recognition ----
    var intents = [
        {
            keywords: ['hello', 'hi', 'hey', 'good morning', 'good afternoon', 'good evening', 'namaste'],
            handler: function () {
                return {
                    text: 'Hello ' + customerInfo.name + '! Welcome to ' + COMPANY + '. I\'m here to help you with any queries about our sustainable construction and consultation services.\n\nHow can I assist you today? You can ask about:\n- Our services\n- Pricing & estimates\n- Location & contact\n- Our experience & projects\n\nOr type "talk to a person" to connect with our team directly.',
                    tags: []
                };
            }
        },
        {
            keywords: ['service', 'services', 'what do you do', 'what you do', 'offer', 'offerings', 'what can you do'],
            handler: function () {
                return {
                    text: 'We offer a comprehensive range of sustainable construction and consultation services:\n\n[1] Residential Construction -- Eco-friendly homes\n[2] Commercial Construction -- LEED-certified spaces\n[3] Green Building Consultation -- Sustainability guidance\n[4] Solar & Renewable Integration -- Clean energy systems\n[5] Project Management -- End-to-end oversight\n[6] Environmental Compliance -- Regulatory assurance\n\nWould you like to know more about any specific service?',
                    tags: ['interested in services overview']
                };
            }
        },
        {
            keywords: ['residential', 'home', 'house', 'villa', 'apartment', 'flat'],
            handler: function () {
                return {
                    text: 'Residential Construction\n\n' + KB.serviceDetails.residential + '\n\nOur residential projects include:\n- Independent villas & houses\n- Apartment complexes\n- Gated communities\n- Farmhouses & weekend homes\n\nWould you like a free consultation or a cost estimate for your project?',
                    tags: ['interested in residential construction']
                };
            }
        },
        {
            keywords: ['commercial', 'office', 'retail', 'shop', 'business', 'corporate', 'warehouse'],
            handler: function () {
                return {
                    text: 'Commercial Construction\n\n' + KB.serviceDetails.commercial + '\n\nWe\'ve delivered:\n- IT parks & tech offices\n- Retail complexes\n- Warehouses & industrial spaces\n- Mixed-use developments\n\nWant to discuss your commercial project requirements?',
                    tags: ['interested in commercial construction']
                };
            }
        },
        {
            keywords: ['green', 'consultation', 'consult', 'sustainable', 'sustainability', 'leed', 'igbc', 'griha', 'certification'],
            handler: function () {
                return {
                    text: 'Green Building Consultation\n\n' + KB.serviceDetails.consultation + '\n\nWe help with:\n- Green building certifications\n- Energy audit & optimization\n- Sustainable material selection\n- Carbon footprint reduction strategies\n\nWould you like to schedule a consultation?',
                    tags: ['interested in green consultation']
                };
            }
        },
        {
            keywords: ['solar', 'renewable', 'energy', 'panel', 'wind', 'clean energy'],
            handler: function () {
                return {
                    text: 'Solar & Renewable Integration\n\n' + KB.serviceDetails.solar + '\n\nOur solutions include:\n- Rooftop solar systems\n- Solar water heating\n- Building-integrated photovoltaics\n- Energy storage systems\n\nWant a site assessment for renewable energy integration?',
                    tags: ['interested in solar/renewable energy']
                };
            }
        },
        {
            keywords: ['project management', 'manage', 'oversight', 'timeline', 'budget'],
            handler: function () {
                return {
                    text: 'Project Management\n\n' + KB.serviceDetails.project + '\n\nOur PM services include:\n- Detailed project planning\n- Budget tracking & cost control\n- Quality assurance\n- Vendor & contractor coordination\n- Progress reporting\n\nNeed project management for an upcoming build?',
                    tags: ['interested in project management']
                };
            }
        },
        {
            keywords: ['compliance', 'regulation', 'permit', 'approval', 'environment', 'environmental'],
            handler: function () {
                return {
                    text: 'Environmental Compliance\n\n' + KB.serviceDetails.compliance + '\n\nWe assist with:\n- Environmental Impact Assessments (EIA)\n- Building permits & approvals\n- Pollution control clearances\n- Green building code compliance\n\nNeed help with regulatory approvals?',
                    tags: ['interested in environmental compliance']
                };
            }
        },
        {
            keywords: ['price', 'cost', 'estimate', 'quote', 'budget', 'rate', 'charge', 'fee', 'how much', 'pricing', 'expensive'],
            handler: function () {
                return {
                    text: 'Pricing & Estimates\n\nOur pricing depends on the project scope, size, and sustainability features. Here\'s a general idea:\n\n- Residential: Starting from Rs.1,800/sq.ft (varies by specifications)\n- Commercial: Custom quotes based on requirements\n- Consultation: Competitive project-based fees\n- Solar Installation: Based on system capacity\n\nWe offer a free initial consultation to understand your needs and provide a detailed estimate.\n\nWould you like to get a personalized quote? I can connect you with our team!',
                    tags: ['asked about pricing']
                };
            }
        },
        {
            keywords: ['location', 'address', 'where', 'office', 'visit', 'directions', 'map'],
            handler: function () {
                return {
                    text: 'Our Office Location\n\n' + KB.location + '\n\nWorking Hours: ' + KB.hours + '\nEmail: ' + KB.email + '\nPhone: ' + KB.phone + '\n\nYou\'re welcome to visit us for an in-person consultation! Would you like me to connect you with our team to schedule a visit?',
                    tags: ['asked about location']
                };
            }
        },
        {
            keywords: ['experience', 'years', 'how long', 'history', 'track record', 'portfolio', 'projects', 'completed'],
            handler: function () {
                return {
                    text: 'Our Track Record\n\nWith ' + KB.experience + ' of expertise, we\'ve delivered ' + KB.projects + ' across Hyderabad and Telangana.\n\nHighlights:\n- Greenleaf Residences -- 48-unit eco-friendly complex\n- TechPark Eco Tower -- LEED Platinum certified\n- Heritage Green Retrofit -- Sustainable heritage renovation\n- SolarVista Villas -- Net-zero energy homes\n\nAverage 40% energy savings across all our builds.\n\nWould you like to see our full portfolio or discuss a similar project?',
                    tags: ['asked about experience/portfolio']
                };
            }
        },
        {
            keywords: ['contact', 'email', 'phone', 'call', 'reach', 'number'],
            handler: function () {
                return {
                    text: 'Contact Information\n\nEmail: ' + KB.email + '\nPhone: ' + KB.phone + '\nHours: ' + KB.hours + '\nAddress: ' + KB.location + '\n\nOr you can type "talk to a person" and I\'ll connect you directly with our team on WhatsApp!',
                    tags: ['asked for contact info']
                };
            }
        },
        {
            keywords: ['talk to', 'speak', 'person', 'human', 'agent', 'real person', 'connect', 'representative', 'someone', 'call me', 'callback'],
            handler: 'HANDOFF'
        },
        {
            keywords: ['thank', 'thanks', 'bye', 'goodbye', 'see you', 'that\'s all'],
            handler: function () {
                return {
                    text: 'Thank you for chatting with us, ' + customerInfo.name + '!\n\nIf you need anything else, feel free to come back anytime. You can also:\n\nEmail us at ' + KB.email + '\nWhatsApp us at ' + KB.phone + '\n\nHave a wonderful day!',
                    tags: []
                };
            }
        }
    ];

    // ---- State ----
    var chatHistory = [];
    var customerTags = new Set();
    var isOpen = false;

    // ---- Lead Storage ----
    var LEADS_KEY = 'techknow_leads';

    function saveLeadToStorage(info) {
        var leads = [];
        try {
            var stored = localStorage.getItem(LEADS_KEY);
            if (stored) leads = JSON.parse(stored);
        } catch (e) { /* ignore */ }
        leads.push(info);
        localStorage.setItem(LEADS_KEY, JSON.stringify(leads));
    }

    function getLeadsFromStorage() {
        try {
            var stored = localStorage.getItem(LEADS_KEY);
            if (stored) return JSON.parse(stored);
        } catch (e) { /* ignore */ }
        return [];
    }

    function downloadLeadsAsCSV() {
        var leads = getLeadsFromStorage();
        if (leads.length === 0) {
            alert('No leads recorded yet.');
            return;
        }
        var headers = ['Date & Time', 'Name', 'Email', 'Type', 'Phone', 'Interests'];
        var rows = leads.map(function (l) {
            return [
                l.timestamp || '',
                l.name || '',
                l.email || '',
                l.type || '',
                l.phone || '',
                (l.interests || []).join('; ')
            ].map(function (v) { return '"' + String(v).replace(/"/g, '""') + '"'; }).join(',');
        });
        var csv = headers.join(',') + '\n' + rows.join('\n');
        var blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = 'techknow_leads_' + new Date().toISOString().slice(0, 10) + '.csv';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    // Expose globally for admin use
    window.downloadTechknowLeads = downloadLeadsAsCSV;

    // ---- Build Widget DOM ----
    function buildWidget() {
        var widget = document.createElement('div');
        widget.id = 'chat-widget';
        widget.innerHTML =
            '<div class="cw-window" id="cw-window">' +
            '<div class="cw-header">' +
            '<div class="cw-header-info">' +
            '<div class="cw-avatar">' +
            '<svg viewBox="0 0 32 32" width="20" height="20" fill="#fff">' +
            '<path d="M16 2L2 10v12l14 8 14-8V10L16 2z"/>' +
            '</svg>' +
            '</div>' +
            '<div>' +
            '<div class="cw-header-name">' + BOT_NAME + '</div>' +
            '<div class="cw-header-status"><span class="cw-online-dot"></span>Online</div>' +
            '<div class="cw-header-hours">Mon-Fri: 9AM-5PM | Sat: 9AM-3PM | Sun: Closed</div>' +
            '</div>' +
            '</div>' +
            '<button class="cw-close" id="cw-close" aria-label="Close chat">&times;</button>' +
            '</div>' +
            '<div class="cw-messages" id="cw-messages">' +
            '<div class="cw-date-badge">Today</div>' +
            '</div>' +
            '<div class="cw-typing" id="cw-typing">' +
            '<div class="cw-typing-dots"><span></span><span></span><span></span></div>' +
            '</div>' +
            '<div class="cw-quick-replies" id="cw-quick-replies"></div>' +
            '<form class="cw-input-area" id="cw-form">' +
            '<input type="text" id="cw-input" class="cw-input" placeholder="Type a message..." autocomplete="off">' +
            '<button type="submit" class="cw-send" aria-label="Send">' +
            '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' +
            '<line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>' +
            '</svg>' +
            '</button>' +
            '</form>' +
            '</div>';
        document.body.appendChild(widget);

        // ---- Event Bindings ----
        var cwWindow = document.getElementById('cw-window');
        var cwClose = document.getElementById('cw-close');
        var cwForm = document.getElementById('cw-form');
        var cwInput = document.getElementById('cw-input');
        var cwQuickReplies = document.getElementById('cw-quick-replies');

        // Replace the existing WhatsApp float with chat toggle
        var waFloat = document.querySelector('.whatsapp-float');
        if (waFloat) {
            waFloat.addEventListener('click', function (e) {
                e.preventDefault();
                toggleChat();
            });
        }

        cwClose.addEventListener('click', function () { toggleChat(); });

        cwForm.addEventListener('submit', function (e) {
            e.preventDefault();
            var msg = cwInput.value.trim();
            if (!msg) return;
            cwInput.value = '';
            handleUserMessage(msg);
        });

        cwQuickReplies.addEventListener('click', function (e) {
            if (e.target.classList.contains('cw-quick')) {
                var msg = e.target.dataset.msg;
                handleUserMessage(msg);
            }
        });

        // Track greeting state
        var greeted = false;

        window._chatToggle = function () {
            isOpen = !isOpen;
            cwWindow.classList.toggle('open', isOpen);

            if (isOpen && !greeted) {
                greeted = true;
                setTimeout(function () {
                    startOnboarding();
                }, 600);
            }

            if (isOpen) {
                setTimeout(function () { cwInput.focus(); }, 300);
            }
        };
    }

    function toggleChat() {
        window._chatToggle();
    }

    // ---- Onboarding Flow ----
    function startOnboarding() {
        addBotMessage('Hello! Welcome to ' + COMPANY + '. I\'d love to help you today.\n\nBefore we begin, could you share a few details so we can serve you better?\n\nWhat is your name?');
        onboardingStep = 0;
    }

    function handleOnboarding(text) {
        switch (onboardingStep) {
            case 0: // Name
                customerInfo.name = text.trim();
                onboardingStep = 1;
                showTypingThen(function () {
                    addBotMessage('Nice to meet you, ' + customerInfo.name + '! What is your email address?');
                });
                break;
            case 1: // Email
                customerInfo.email = text.trim();
                onboardingStep = 2;
                showTypingThen(function () {
                    addBotMessage('Got it. Are you enquiring as a company or as an individual?');
                    showQuickReplies([
                        { label: 'Company', msg: 'Company' },
                        { label: 'Individual', msg: 'Individual' }
                    ]);
                });
                break;
            case 2: // Company / Individual
                customerInfo.type = text.trim();
                onboardingStep = 3;
                hideQuickReplies();
                showTypingThen(function () {
                    addBotMessage('Thank you. Lastly, what is your contact number?');
                });
                break;
            case 3: // Phone
                customerInfo.phone = text.trim();
                customerInfo.timestamp = new Date().toLocaleString('en-IN', {
                    dateStyle: 'medium',
                    timeStyle: 'short'
                });
                onboardingComplete = true;
                onboardingStep = -1;

                // Save lead
                saveLeadToStorage({
                    name: customerInfo.name,
                    email: customerInfo.email,
                    type: customerInfo.type,
                    phone: customerInfo.phone,
                    timestamp: customerInfo.timestamp,
                    interests: []
                });

                showTypingThen(function () {
                    addBotMessage('Thank you, ' + customerInfo.name + '! Your details have been saved.\n\nHow can I assist you today? You can ask about:\n- Our services\n- Pricing & estimates\n- Location & contact info\n- Our experience & projects\n\nOr type "talk to a person" to connect with our team directly.');
                    showMainQuickReplies();
                });
                break;
        }
    }

    function showMainQuickReplies() {
        showQuickReplies([
            { label: 'Services', msg: 'What services do you offer?' },
            { label: 'Pricing', msg: 'What are your prices?' },
            { label: 'Location', msg: 'Where is your office?' },
            { label: 'Experience', msg: 'Tell me about your experience' },
            { label: 'Talk to a Person', msg: 'I want to talk to a person' }
        ]);
    }

    function showQuickReplies(items) {
        var container = document.getElementById('cw-quick-replies');
        container.innerHTML = items.map(function (item) {
            return '<button class="cw-quick" data-msg="' + escapeAttr(item.msg) + '">' + escapeHtml(item.label) + '</button>';
        }).join('');
    }

    function hideQuickReplies() {
        var container = document.getElementById('cw-quick-replies');
        container.innerHTML = '';
    }

    // ---- Message Handling ----
    function handleUserMessage(text) {
        addUserMessage(text);
        chatHistory.push({ role: 'user', text: text, time: new Date() });

        // If onboarding is not complete, route to onboarding
        if (!onboardingComplete) {
            handleOnboarding(text);
            return;
        }

        // Show typing then respond
        showTypingThen(function () {
            var response = getResponse(text);
            if (response === 'HANDOFF') {
                performHandoff();
            } else {
                addBotMessage(response.text);
                chatHistory.push({ role: 'bot', text: response.text, time: new Date() });
                if (response.tags) {
                    response.tags.forEach(function (t) { customerTags.add(t); });
                    // Update stored lead with interests
                    updateLeadInterests();
                }
            }
        });
    }

    function showTypingThen(callback) {
        showTyping();
        var delay = 600 + Math.random() * 800;
        setTimeout(function () {
            hideTyping();
            callback();
        }, delay);
    }

    function getResponse(input) {
        var lower = input.toLowerCase().replace(/[^a-z0-9\s]/g, '');

        // Check each intent
        for (var i = 0; i < intents.length; i++) {
            var intent = intents[i];
            for (var j = 0; j < intent.keywords.length; j++) {
                if (lower.indexOf(intent.keywords[j]) !== -1) {
                    if (intent.handler === 'HANDOFF') return 'HANDOFF';
                    return intent.handler();
                }
            }
        }

        // Fallback
        return {
            text: 'I appreciate your question! While I may not have the specific answer right now, our team would love to help.\n\nYou can:\n- Ask about our services, pricing, location, or experience\n- Type "talk to a person" to connect with our team on WhatsApp\n\nHow can I help you?',
            tags: ['asked: "' + text + '"']
        };
    }

    function updateLeadInterests() {
        var leads = getLeadsFromStorage();
        if (leads.length === 0) return;
        var lastLead = leads[leads.length - 1];
        if (lastLead.email === customerInfo.email) {
            lastLead.interests = Array.from(customerTags);
            localStorage.setItem(LEADS_KEY, JSON.stringify(leads));
        }
    }

    // ---- Handoff to WhatsApp ----
    function performHandoff() {
        var summary = generateSummary();
        var handoffMsg = 'Great! I\'ll connect you with our team right away.\n\nI\'ve prepared a brief summary of your enquiry for our team so they can assist you better.\n\nClick the button below to continue on WhatsApp:';

        addBotMessage(handoffMsg);
        chatHistory.push({ role: 'bot', text: handoffMsg, time: new Date() });

        // Add WhatsApp CTA button
        setTimeout(function () {
            var waText = encodeURIComponent(
                'Hi Sreedhar,\n\n' +
                'My name is ' + customerInfo.name + '.\n' +
                'Email: ' + customerInfo.email + '\n' +
                'Type: ' + customerInfo.type + '\n' +
                'Phone: ' + customerInfo.phone + '\n\n' +
                'Chat Summary from Website:\n' + summary + '\n\n' +
                'I\'d like to discuss this further.'
            );
            var waUrl = 'https://wa.me/' + WHATSAPP_NUMBER + '?text=' + waText;

            var msgContainer = document.getElementById('cw-messages');
            var ctaDiv = document.createElement('div');
            ctaDiv.className = 'cw-msg cw-msg-bot';
            ctaDiv.innerHTML =
                '<div class="cw-bubble cw-bubble-bot cw-bubble-cta">' +
                '<div class="cw-summary-preview">' +
                '<strong>Enquiry Summary:</strong>' +
                '<p>' + escapeHtml(summary) + '</p>' +
                '</div>' +
                '<a href="' + waUrl + '" target="_blank" rel="noopener noreferrer" class="cw-wa-btn">' +
                '<svg viewBox="0 0 32 32" width="18" height="18" fill="#fff">' +
                '<path d="M16.004 0h-.008C7.174 0 0 7.176 0 16c0 3.5 1.13 6.742 3.047 9.379L1.054 31.25l6.1-1.953A15.9 15.9 0 0 0 16.004 32C24.824 32 32 24.824 32 16S24.824 0 16.004 0zm9.32 22.598c-.39 1.1-1.932 2.013-3.168 2.28-.846.18-1.95.324-5.668-1.218-4.76-1.973-7.82-6.81-8.058-7.125-.228-.316-1.918-2.555-1.918-4.872s1.214-3.458 1.644-3.93c.43-.473.94-.59 1.254-.59.314 0 .628.003.902.016.29.014.678-.11 1.06.808.39.94 1.332 3.25 1.448 3.486.117.237.195.512.04.826-.157.316-.236.512-.47.787-.236.276-.496.616-.708.826-.236.236-.482.49-.207.96s1.218 2.013 2.616 3.262c1.797 1.605 3.312 2.103 3.783 2.34.47.235.746.195 1.02-.118.275-.314 1.178-1.374 1.492-1.846.314-.47.628-.39 1.06-.235.43.157 2.738 1.293 3.207 1.528.47.236.784.354.9.55.118.195.118 1.136-.273 2.235z"/>' +
                '</svg>' +
                'Continue on WhatsApp' +
                '</a>' +
                '</div>';
            msgContainer.appendChild(ctaDiv);
            scrollToBottom();
        }, 500);
    }

    function generateSummary() {
        var userMsgs = chatHistory
            .filter(function (m) { return m.role === 'user'; })
            .map(function (m) { return m.text; });

        var tags = Array.from(customerTags);
        var summary = '';

        if (tags.length > 0) {
            summary += 'Interests: ' + tags.join(', ') + '\n';
        }

        if (userMsgs.length > 0) {
            // Include last few user messages as context (skip onboarding answers)
            var relevantMsgs = userMsgs.slice(4, -1); // skip first 4 (onboarding) and last (handoff trigger)
            if (relevantMsgs.length > 0) {
                var lastFew = relevantMsgs.slice(-4);
                summary += 'Key messages: ' + lastFew.map(function (m) { return '"' + m + '"'; }).join(', ');
            }
        }

        if (!summary) {
            summary = 'General enquiry about construction/consultation services';
        }

        return summary;
    }

    // ---- DOM Helpers ----
    function addUserMessage(text) {
        var msgContainer = document.getElementById('cw-messages');
        var time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        var div = document.createElement('div');
        div.className = 'cw-msg cw-msg-user';
        div.innerHTML = '<div class="cw-bubble cw-bubble-user">' + escapeHtml(text) + '<span class="cw-time">' + time + '</span></div>';
        msgContainer.appendChild(div);
        scrollToBottom();
    }

    function addBotMessage(text) {
        var msgContainer = document.getElementById('cw-messages');
        var time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        var div = document.createElement('div');
        div.className = 'cw-msg cw-msg-bot';
        var formatted = escapeHtml(text)
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\n/g, '<br>');
        div.innerHTML = '<div class="cw-bubble cw-bubble-bot">' + formatted + '<span class="cw-time">' + time + '</span></div>';
        msgContainer.appendChild(div);
        scrollToBottom();
    }

    function showTyping() {
        var el = document.getElementById('cw-typing');
        el.classList.add('visible');
        scrollToBottom();
    }

    function hideTyping() {
        var el = document.getElementById('cw-typing');
        el.classList.remove('visible');
    }

    function scrollToBottom() {
        var msgContainer = document.getElementById('cw-messages');
        requestAnimationFrame(function () {
            msgContainer.scrollTop = msgContainer.scrollHeight;
        });
    }

    function escapeHtml(str) {
        var div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    function escapeAttr(str) {
        return str.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    }

    // ---- Init ----
    document.addEventListener('DOMContentLoaded', function () {
        buildWidget();
    });

})();
