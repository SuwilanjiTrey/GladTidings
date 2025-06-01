import React, { useEffect, useRef } from 'react';
import EmailService from './EmailService.tsx';

type SystemNotificationManagerProps = {
  email: string;
  systemMessage: string;
};

const SystemNotificationManager: React.FC<SystemNotificationManagerProps> = ({ email, systemMessage }) => {
  const { sendEmail } = EmailService();
  const emailSentRef = useRef(false);

  useEffect(() => {
    let isMounted = true;

    const sendVerificationEmail = async () => {
      // Check if email has already been sent
      if (emailSentRef.current) {
        return;
      }

      try {
        const subject = 'Verification Email';
        const message = systemMessage;

        const recipient = {
          email: email,
          name: email.split('@')[0]
        };

        if (isMounted) {
          await sendEmail({
            subject,
            message,
            recipients: recipient,
            onSuccess: () => {
              if (isMounted) {
                // Mark email as sent
                emailSentRef.current = true;
              }
            },
            onError: (error) => {
              if (isMounted) {
                console.error('Failed to send verification email:', error);
                // Reset the flag if sending fails, allowing for retry
                emailSentRef.current = false;
              }
            }
          });
        }
      } catch (error) {
        if (isMounted) {
          console.error('Error in sendVerificationEmail:', error);
          // Reset the flag if sending fails, allowing for retry
          emailSentRef.current = false;
        }
      }
    };

    // Only send if we have required data and haven't sent yet
    if (email && systemMessage && !emailSentRef.current) {
      sendVerificationEmail();
    }

    return () => {
      isMounted = false;
    };
  }, [email, systemMessage, sendEmail]);

  return null;
};

export default SystemNotificationManager;