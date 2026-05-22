export const SITE = Object.freeze({
    brand: 'KISO',
    contact: {
        email: process.env.CONTACT_EMAIL?.trim() || process.env.EMAIL_USER?.trim() || '',
        phone: process.env.CONTACT_PHONE?.trim() || ''
    },
    social: {
        instagram: process.env.SOCIAL_INSTAGRAM?.trim() || '',
        facebook: process.env.SOCIAL_FACEBOOK?.trim() || '',
        pinterest: process.env.SOCIAL_PINTEREST?.trim() || ''
    },
    footerLinks: [
        { label: 'About Us', href: '/user/page/about' },
        { label: 'Contact', href: '/user/page/contact' },
        { label: 'FAQ', href: '/user/page/faq' },
        { label: 'Terms of Service', href: '/user/page/terms' },
        { label: 'Privacy Policy', href: '/user/page/privacy' }
    ]
});

export const STATIC_PAGES = Object.freeze({
    about: { title: 'About Us' },
    contact: { title: 'Contact' },
    faq: { title: 'FAQ' },
    terms: { title: 'Terms of Service' },
    privacy: { title: 'Privacy Policy' }
});
