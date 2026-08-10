// FILE: src/components/EulaModal.jsx

import { X } from "lucide-react";

export default function EulaModal({ open, onClose, modalType }) {
  if (!open) return null;

  const getModalContent = () => {
    switch (modalType) {
      case "terms":
        return {
          title: "Terms of Service",
          sections: [
            {
              heading: "1. Introduction",
              content:
                "Welcome to TierHome. By creating an account and using this platform, you agree to comply with all platform policies, guidelines, and applicable laws. TierHome is an online housing platform that connects tenants and property owners in Angeles City.",
            },
            {
              heading: "2. User Responsibilities",
              content:
                "Users must provide accurate and truthful information during registration. You are responsible for maintaining the confidentiality of your account credentials. You agree not to engage in fraudulent activities, misrepresentation, or any illegal conduct on the platform. Any violation may result in account suspension or termination.",
            },
            {
              heading: "3. Listings & Transactions",
              content:
                "TierHome acts as a platform connecting tenants and property owners. We are not responsible for agreements, disputes, or transactions made between users. Both parties are solely responsible for verifying property details, pricing, and lease terms. Users should always conduct due diligence before committing to any housing agreement.",
            },
            {
              heading: "4. Identity Verification",
              content:
                "Users may be required to undergo identity verification to access full platform features. This includes submitting a government-issued ID and a real-time selfie. Verification is mandatory and failure to complete it may restrict access to certain features.",
            },
            {
              heading: "5. Content & Conduct",
              content:
                "You agree not to post offensive, abusive, discriminatory, or illegal content. You must not harass, threaten, or defame other users. TierHome reserves the right to remove any content or user accounts that violate these terms.",
            },
            {
              heading: "6. Termination",
              content:
                "TierHome reserves the right to suspend or terminate accounts that violate these terms of service. Upon termination, your access to the platform will be immediately revoked. No refunds will be issued for fees paid prior to termination.",
            },
            {
              heading: "7. Limitation of Liability",
              content:
                "TierHome is provided on an 'as-is' basis. We are not liable for any direct, indirect, incidental, or consequential damages arising from the use of this platform. Users use TierHome at their own risk.",
            },
            {
              heading: "8. Acceptance",
              content:
                "By proceeding with account creation, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.",
            },
          ],
        };

      case "privacy":
        return {
          title: "Privacy Policy",
          sections: [
            {
              heading: "1. Information We Collect",
              content:
                "We collect personal information you provide during registration, including your name, email address, phone number, and address. We also collect identity verification documents (government-issued ID and selfie) for security and fraud prevention purposes.",
            },
            {
              heading: "2. How We Use Your Information",
              content:
                "Your personal information is used to create and maintain your account, verify your identity, facilitate transactions between tenants and property owners, improve our platform, and communicate with you about updates or important notices.",
            },
            {
              heading: "3. Data Security",
              content:
                "We implement industry-standard security measures to protect your personal data from unauthorized access, alteration, or disclosure. This includes encryption, secure servers, and access controls. However, no system is completely secure, and we cannot guarantee absolute security.",
            },
            {
              heading: "4. Third-Party Service Providers",
              content:
                "We may share your information with trusted third-party service providers such as Amazon Rekognition for identity verification, email service providers, and payment processors. These providers are contractually bound to protect your data and use it only for the purposes we specify.",
            },
            {
              heading: "5. User Data Rights",
              content:
                "You have the right to access, correct, or request deletion of your personal data. To exercise these rights, please contact our support team. We will respond to your request within 30 days.",
            },
            {
              heading: "6. Retention Period",
              content:
                "We retain your personal data for as long as your account is active. If you request account deletion, we will remove your data within 60 days, except where required by law to retain records.",
            },
            {
              heading: "7. Cookies & Tracking",
              content:
                "Our platform uses cookies to enhance user experience, analyze site traffic, and remember your preferences. You can manage cookie preferences through your browser settings.",
            },
            {
              heading: "8. Policy Updates",
              content:
                "We may update this Privacy Policy from time to time. We will notify you of significant changes via email. Your continued use of TierHome following such updates constitutes your acceptance of the revised policy.",
            },
          ],
        };

      case "dataPrivacy":
        return {
          title: "Data Privacy Act Consent (RA 10173)",
          sections: [
            {
              heading: "Republic Act 10173 - Data Privacy Act of 2012",
              content:
                "TierHome complies with the Data Privacy Act of 2012 (Republic Act 10173), the primary data protection law in the Philippines. This consent document explains how we collect, process, and protect your personal data.",
            },
            {
              heading: "1. Explicit Consent Requirement",
              content:
                "By checking this box and proceeding with registration, you provide explicit, informed consent for TierHome to collect and process your personal data. This includes your name, contact information, address, government-issued ID, and biometric information (selfie photograph).",
            },
            {
              heading: "2. Purpose of Data Collection",
              content:
                "Your personal data is collected for the following lawful purposes: (a) Account creation and authentication, (b) Identity verification using facial recognition technology, (c) Fraud prevention and security, (d) Communication regarding platform updates and policies, (e) Compliance with legal and regulatory obligations.",
            },
            {
              heading: "3. Government-Issued ID & Biometric Data",
              content:
                "You consent to the collection of your government-issued identification document (e.g., passport, national ID, driver's license). You also consent to the collection and processing of your biometric data in the form of a selfie photograph. This data is used exclusively for identity verification purposes via Amazon Rekognition CompareFaces API.",
            },
            {
              heading: "4. Data Processing & Storage",
              content:
                "Your personal data will be processed and stored securely on TierHome's servers and trusted third-party service providers (Amazon Web Services). Data is encrypted both in transit and at rest. Access to your data is restricted to authorized personnel only.",
            },
            {
              heading: "5. Third-Party Sharing",
              content:
                "We may share your data with Amazon Web Services (AWS) for identity verification and data storage purposes. We will not sell, trade, or share your personal data with any other third parties without your explicit consent, except as required by law.",
            },
            {
              heading: "6. Data Retention & Deletion",
              content:
                "Your personal data will be retained as long as necessary to fulfill the purposes stated above. Upon request, we will delete your data within 60 days, except where retention is required by law. Deletion requests can be submitted through your account settings or by contacting our support team.",
            },
            {
              heading: "7. Your Rights Under RA 10173",
              content:
                "You have the right to: (a) Access your personal data, (b) Correct inaccurate or incomplete data, (c) Request deletion of your data, (d) Object to processing of your data, (e) Obtain a copy of your data in portable format. Submit requests to our Data Protection Officer.",
            },
            {
              heading: "8. Age Confirmation",
              content:
                "By proceeding with registration, you confirm that you are at least 18 years of age. We do not knowingly collect personal data from individuals under 18. If we discover that we have collected data from a minor, we will immediately delete such data.",
            },
            {
              heading: "9. Policy Changes",
              content:
                "TierHome may update this consent form to comply with changes in RA 10173 or our data practices. We will notify users of material changes and request re-consent if necessary.",
            },
          ],
        };

      default:
        return { title: "Document", sections: [] };
    }
  };

  const { title, sections } = getModalContent();

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl h-[85vh] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200 shrink-0">
          <h2 className="text-lg font-bold text-gray-900">{title}</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 transition ml-4 shrink-0"
            aria-label="Close"
          >
            <X size={20} className="text-gray-600" />
          </button>
        </div>

        {/* CONTENT */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5 text-sm text-gray-700 leading-relaxed">
          {sections.map((section, idx) => (
            <div key={idx} className="space-y-2">
              <h3 className="text-[14px] font-bold text-gray-900">
                {section.heading}
              </h3>
              <p className="text-[13px] text-gray-600">{section.content}</p>
            </div>
          ))}
        </div>

        {/* FOOTER */}
        <div className="border-t border-gray-200 px-6 py-4 shrink-0 bg-gray-50">
          <button
            onClick={onClose}
            className="w-full h-11 rounded-xl bg-[#3d6b35] text-white font-semibold hover:opacity-90 transition"
          >
            Close & Return
          </button>
        </div>
      </div>
    </div>
  );
}