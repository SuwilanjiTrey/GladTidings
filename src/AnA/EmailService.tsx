import emailjs from '@emailjs/browser';

// Note: You'll need to replace these with your actual EmailJS credentials
const SERVICE_ID = 'service_br9unbx';
const TEMPLATE_ID = 'template_56ry9wc';
const PUBLIC_KEY = 'wYdsHALm8--H-Js0J';



type User = {
  email: string;
  name?: string;
};

type EmailParams = {
  message: string;
  subject: string;
  recipients: User | User[];
  onSuccess?: () => void;
  onError?: (error: string) => void;
};

const EmailService = () => {
  const validateCredentials = () => {
    if (!SERVICE_ID || !TEMPLATE_ID || !PUBLIC_KEY) {
      throw new Error('EmailJS credentials are not properly configured');
    }
  };

  const sendEmail = async ({
    message,
    subject,
    recipients,
    onSuccess,
    onError
  }: EmailParams) => {
    try {
      // Validate credentials first
      validateCredentials();

      // Convert single user to array for consistent handling
      const recipientsList = Array.isArray(recipients) ? recipients : [recipients];
      
      //console.log('Attempting to send emails to:', recipientsList.map(r => r.email));
      //console.log('Using template:', TEMPLATE_ID);
      
      // Send emails in parallel using Promise.all
      const results = await Promise.all(
        recipientsList.map(async (recipient) => {
          const templateParams = {
            to_email: recipient.email,
            to_name: recipient.name || recipient.email,
            message: message,
            subject: subject,
          };

          //console.log('Sending email with params:', {
          //  ...templateParams,
          //  serviceId: SERVICE_ID,
          //  templateId: TEMPLATE_ID
          //});

          const result = await emailjs.send(
            SERVICE_ID,
            TEMPLATE_ID,
            templateParams,
            PUBLIC_KEY
          );

          //console.log('Email sent result:', result);
          return result;
        })
      );

      //console.log(`Successfully sent emails to ${recipientsList.length} recipient(s)`, results);
      onSuccess?.();
      return results;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('Error sending email:', {
        error: errorMessage,
        stack: error instanceof Error ? error.stack : undefined
      });
      onError?.(errorMessage);
      throw error;
    }
  };

  return { sendEmail };
};

export default EmailService;