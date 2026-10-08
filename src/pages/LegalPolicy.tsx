import PageLayout from '@/components/atelier/PageLayout';

type PolicySection = {
  title: string;
  content: string[];
};

const policies: Record<string, { title: string; sections: PolicySection[] }> = {
  'privacy-policy': {
    title: 'Privacy Policy',
    sections: [
      {
        title: 'Overview',
        content: [
          'ATELIER 2901 respects your privacy and is committed to protecting the personal information you share with us. This policy explains how we collect, use, store, and protect information when you visit our website, contact us, or place an order.',
        ],
      },
      {
        title: 'Information We Collect',
        content: [
          'We may collect information such as your name, email address, phone number, billing and shipping address, order details, payment status, and any customization details or messages you provide while placing an enquiry or order.',
          'We may also collect basic website usage information, including device, browser, and interaction data, to help us maintain and improve the website.',
        ],
      },
      {
        title: 'How We Use Your Information',
        content: [
          'We use your information to respond to enquiries, process orders, coordinate personalization, arrange shipping, provide customer support, improve our services, and maintain records related to purchases and communications.',
          'We may use your contact details to send order updates or respond to requests. Marketing messages, if any, will only be sent where permitted and may be opted out of where applicable.',
        ],
      },
      {
        title: 'Sharing Of Information',
        content: [
          'We do not sell your personal information. We may share limited information with trusted service providers who help us operate the website, process payments, fulfil orders, deliver packages, or provide customer support.',
          'We may disclose information when required by law, regulation, legal process, or to protect our rights, customers, or business operations.',
        ],
      },
      {
        title: 'Payments And Security',
        content: [
          'Payments may be processed by third-party payment providers. We do not intentionally store full card or sensitive payment details on our website. Payment providers process payment information according to their own security and privacy practices.',
          'We use reasonable administrative, technical, and organizational measures to protect personal information, but no online system can be guaranteed to be completely secure.',
        ],
      },
      {
        title: 'Data Retention',
        content: [
          'We retain personal information only for as long as needed for order fulfilment, customer support, legal, accounting, recordkeeping, and legitimate business purposes.',
        ],
      },
      {
        title: 'Your Choices',
        content: [
          'You may contact us to request access, correction, or deletion of your personal information, subject to legal and operational requirements. For privacy-related requests, please email orders@atelier2901.com.',
        ],
      },
      {
        title: 'Policy Updates',
        content: [
          'We may update this Privacy Policy from time to time. Any changes will be posted on this page.',
        ],
      },
    ],
  },
  'return-and-refund-policy': {
    title: 'Return & Refund Policy',
    sections: [
      {
        title: 'All Orders Are Final',
        content: [
          'We do not accept returns, exchanges, or refunds.',
        ],
      },
    ],
  },
  'shipping-and-delivery-policy': {
    title: 'Shipping & Delivery Policy',
    sections: [
      {
        title: 'Dispatch Timelines',
        content: [
          'Orders are usually dispatched within 4-5 business days. Personalised orders may take 7-10 business days or longer, depending on the order. Delivery timelines may vary.',
        ],
      },
      {
        title: 'Delivery',
        content: [
          'Once dispatched, delivery timelines depend on the shipping destination, courier availability, and other factors outside our direct control. We will share available shipping or delivery updates where applicable.',
        ],
      },
    ],
  },
  'terms-and-conditions': {
    title: 'Terms & Conditions',
    sections: [
      {
        title: 'Welcome to ATELIER 2901',
        content: [
          'These Terms & Conditions govern your access to and use of the ATELIER 2901 website, atelier2901.com, and your purchase of products and services offered through the website.',
          'The website and its content are operated by ATELIER 2901, founded by Payal Shah. In these Terms & Conditions, "ATELIER 2901", "we", "us" or "our" refers to ATELIER 2901, and "you", "your" or "customer" refers to any person accessing the website or purchasing our products or services.',
          'By accessing, browsing or using our website, or placing an order with us, you acknowledge that you have read, understood and agreed to these Terms & Conditions. If you do not agree with any part of these Terms & Conditions, please refrain from using the website or placing an order.',
        ],
      },
      {
        title: '1. Our Products & Services',
        content: [
          'ATELIER 2901 specialises in thoughtfully designed stationery, gifting, invitations, coffee table books and other bespoke design creations.',
          'Many of our products are personalised, customised or created specifically for individual clients. Accordingly, the final product may vary slightly from images, colours, finishes or representations shown on the website.',
          'We reserve the right to modify, discontinue or introduce products, designs, finishes, materials or services at any time without prior notice.',
        ],
      },
      {
        title: '2. Product Images & Descriptions',
        content: [
          'We make every effort to ensure that product descriptions, photographs, colours, dimensions and other details displayed on the website are accurate.',
          'However, colours may appear differently depending on your screen, device or display settings. Minor variations in colour, texture, printing, paper, material and finish are inherent to the nature of handcrafted and printed products and shall not be considered defects.',
        ],
      },
      {
        title: '3. Orders & Personalisation',
        content: [
          'Orders are subject to acceptance and availability.',
          'For personalised or bespoke orders, you are responsible for providing accurate names, dates, spellings, wording, addresses and other information required to complete your order.',
          "Once artwork or personalised details have been approved by you, any errors arising from incorrect information provided or approved by you will be the customer's responsibility.",
          'For bespoke projects, the scope, specifications, pricing and timelines will be mutually agreed upon before production begins.',
          'ATELIER 2901 reserves the right to decline or cancel an order where the requested design, content or specifications cannot reasonably be fulfilled.',
        ],
      },
      {
        title: '4. Pricing & Payment',
        content: [
          'All prices displayed on the website are in Indian Rupees (INR) unless otherwise stated.',
          'Prices may be changed at any time without prior notice. The applicable price at the time an order is placed will apply to that order.',
          'Orders will be processed only after successful receipt of the applicable payment.',
          'Additional charges, including delivery, customisation or other applicable charges, will be communicated where relevant before the order is confirmed.',
        ],
      },
      {
        title: '5. Order Cancellation',
        content: [
          'As many of our products are personalised or made to order, orders may not be cancelled once production or customisation has commenced.',
          'If you wish to request a cancellation, please contact us as soon as possible. Cancellation requests will be considered at our discretion depending on the stage of production.',
        ],
      },
      {
        title: '6. Shipping & Delivery',
        content: [
          'Once an order has been handed over to the delivery partner, delays caused by the courier, weather, public holidays, strikes, incorrect delivery information or other circumstances beyond our reasonable control shall not be considered a failure by ATELIER 2901 to fulfil the order.',
          'Customers are responsible for providing complete and accurate delivery information.',
        ],
      },
      {
        title: '7. Returns, Exchanges & Refunds',
        content: [
          'As our products are often personalised and made especially for you, all orders are final.',
        ],
      },
      {
        title: '8. Bespoke & Custom Designs',
        content: [
          'Bespoke designs are created in collaboration with the client and may involve multiple stages of concept development, design, personalisation and approval.',
          'The creative direction, specifications and inclusions agreed upon for a bespoke project will form the basis of the final deliverable.',
          'Additional revisions, changes in scope or requirements introduced after approval may incur additional charges and may affect the agreed timeline.',
        ],
      },
      {
        title: '9. Intellectual Property',
        content: [
          'All content appearing on the ATELIER 2901 website, including but not limited to logos, brand identity, photographs, graphics, illustrations, artwork, designs, text, layouts and other creative material, is the property of ATELIER 2901 or is used with appropriate permission.',
          'Such content may not be copied, reproduced, modified, distributed, published, sold or commercially used without prior written permission.',
        ],
      },
      {
        title: '10. Use Of The Website',
        content: [
          'You agree to use this website only for lawful purposes and in a manner that does not infringe the rights of ATELIER 2901 or any third party.',
          'You must not attempt to interfere with the operation or security of the website, introduce malicious software, gain unauthorised access to any part of the website, or use its content for unauthorised commercial purposes.',
          'We reserve the right to restrict or terminate access to the website where we reasonably believe these Terms & Conditions have been violated.',
        ],
      },
      {
        title: '11. Website Content & Availability',
        content: [
          'We reserve the right to update, modify, suspend or discontinue any part of the website without prior notice.',
        ],
      },
      {
        title: '12. Limitation Of Liability',
        content: [
          'To the extent permitted by applicable law, ATELIER 2901 shall not be liable for any indirect, incidental or consequential loss arising from the use of the website, purchase of products or inability to access or use the website.',
          'Our liability, where applicable, shall be limited to the amount paid by the customer for the specific product or service giving rise to the claim.',
          'Nothing in these Terms & Conditions shall limit any liability that cannot lawfully be excluded under applicable law.',
        ],
      },
      {
        title: '13. Third-Party Services',
        content: [
          'We may use third-party service providers, including payment gateways, courier and delivery partners, hosting providers and other service providers, to facilitate our operations.',
          'While we work with trusted service providers, ATELIER 2901 is not responsible for delays, interruptions or failures attributable solely to such third parties.',
        ],
      },
      {
        title: '14. Privacy',
        content: [
          'Your use of the website and any personal information provided to us is subject to our Privacy Policy, which forms part of these Terms & Conditions.',
        ],
      },
      {
        title: '15. Changes To These Terms',
        content: [
          'ATELIER 2901 reserves the right to update or modify these Terms & Conditions from time to time.',
          'Any revised Terms & Conditions will be published on this website. Your continued use of the website following any changes constitutes your acceptance of the revised Terms & Conditions.',
        ],
      },
      {
        title: '16. Contact Us',
        content: [
          'For any questions regarding these Terms & Conditions, your order, a bespoke project or any other matter relating to ATELIER 2901, please contact us at info@atelier2901.com.',
          'Last Updated: September 11, 2026',
        ],
      },
    ],
  },
};

interface LegalPolicyProps {
  policy: keyof typeof policies;
}

export default function LegalPolicy({ policy }: LegalPolicyProps) {
  const content = policies[policy];

  return (
    <PageLayout>
      <section className="max-w-3xl mx-auto px-6 lg:px-12 py-16 lg:py-24 min-h-[70vh]">
        <div className="mb-10 animate-fade-in opacity-0" style={{ animationDelay: '100ms' }}>
          <p className="text-xs uppercase tracking-widest text-muted-foreground mb-4 font-light">
            Policies
          </p>
          <h1 className="font-sans md:text-2xl lg:text-3xl animate-fade-in opacity-0">
            {content.title}
          </h1>
        </div>

        <div className="space-y-10 animate-fade-in opacity-0" style={{ animationDelay: '200ms' }}>
          {content.sections.map((section) => (
            <section key={section.title} className="space-y-4">
              <h2 className="font-sans text-sm animate-fade-in opacity-0">
                {section.title}
              </h2>
              {section.content.map((paragraph) => (
                <p key={paragraph} className="font-light leading-relaxed text-muted-foreground">
                  {paragraph}
                </p>
              ))}
            </section>
          ))}
        </div>
      </section>
    </PageLayout>
  );
}
