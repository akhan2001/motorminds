import { cn } from "@/lib/utils";
import type { Message } from "ai/react";
import Image from "next/image";
import { useState } from "react";
import { CustomerFormMessage } from "./CustomerFormMessage";
import { ChatEmailFormMessage } from "./ChatEmailFormMessage";

// Extended Message type to include form data
interface ExtendedMessage extends Message {
  formType?: string;
  formData?: any;
}

export function ChatMessageBubble(props: {
  message: ExtendedMessage;
  aiEmoji?: string;
  sources: any[];
  shopId?: string;
  onFormSubmit?: (formType: string, data: any) => void;
}) {
  const [showForm, setShowForm] = useState(true);
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [createdCustomer, setCreatedCustomer] = useState<any>(null);
  const [emailSent, setEmailSent] = useState(false);
  const [emailData, setEmailData] = useState<any>(null);

  // Check if this is a form message
  const isFormMessage = props.message.formType && 
    (props.message.formType === 'customer-form' || props.message.formType === 'email-form');
  
  // Clean message content by removing form tags
  const cleanMessageContent = () => {
    if (!props.message.content) return "";
    
    // Remove the form tags
    return props.message.content
      .replace(/\[CUSTOMER_FORM\]/g, '')
      .replace(/\[EMAIL_FORM\]/g, '')
      .trim();
  };
  
  // Handle customer form submission
  const handleCustomerFormSuccess = (customer: any) => {
    setCreatedCustomer(customer);
    setFormSubmitted(true);
    setShowForm(false);
    
    if (props.onFormSubmit) {
      props.onFormSubmit('customer-form', customer);
    }
  };
  
  // Handle email form submission
  const handleEmailFormSuccess = (data: any) => {
    setEmailData(data);
    setEmailSent(true);
    setShowForm(false);
    
    if (props.onFormSubmit) {
      props.onFormSubmit('email-form', data);
    }
  };
  
  // Handle form cancellation
  const handleFormCancel = () => {
    setShowForm(false);
  };

  return (
    <div
      className={cn(
        `rounded-[24px] max-w-[75%] mb-8 flex text-primaryWhite`,
        props.message.role === "user"
          ? "bg-[#222222] px-4 py-2"
          : null,
        props.message.role === "user" ? "ml-auto" : "mr-auto",
        // Make form messages wider
        isFormMessage ? "max-w-[90%]" : null
      )}
    >
      {props.message.role !== "user" && (
        <div className="mr-4 bg-secondary -mt-2 rounded-full w-10 h-10 flex-shrink-0 flex items-center justify-center overflow-hidden">
          <Image
            src="/motorminds-logo-black (1).png"
            alt="Mia Logo"
            width={40}
            height={40}
            className="object-cover w-full h-full"
          />
        </div>
      )}

      <div className="whitespace-pre-wrap flex flex-col w-full">
        {/* Show the cleaned message content without form tags */}
        <span>{cleanMessageContent()}</span>
        
        {/* Customer form */}
        {isFormMessage && showForm && props.message.formType === 'customer-form' && props.shopId && (
          <div className="mt-4 pt-4 border-t border-gray-700 flex justify-start w-full">
            <CustomerFormMessage 
              initialName={props.message.formData?.name} 
              shopId={props.shopId}
              onSuccess={handleCustomerFormSuccess}
              onCancel={handleFormCancel}
            />
          </div>
        )}
        
        {/* Email form */}
        {isFormMessage && showForm && props.message.formType === 'email-form' && (
          <div className="mt-4 pt-4 border-t border-gray-700 flex justify-start w-full">
            <ChatEmailFormMessage 
              recipient_name={props.message.formData?.recipient_name || ""}
              recipient_email={props.message.formData?.recipient_email || ""}
              subject={props.message.formData?.subject || ""}
              message={props.message.formData?.message || ""}
              onSuccess={handleEmailFormSuccess}
              onCancel={handleFormCancel}
            />
          </div>
        )}
        
        {/* Show success message after customer form submission */}
        {isFormMessage && formSubmitted && createdCustomer && props.message.formType === 'customer-form' && (
          <div className="mt-2 p-3 bg-green-900/30 border border-green-700/50 rounded-md text-green-200">
            ✅ Customer created successfully: {createdCustomer.customer_name}
          </div>
        )}
        
        {/* Show success message after email form submission */}
        {isFormMessage && emailSent && emailData && props.message.formType === 'email-form' && (
          <div className="mt-2 p-3 bg-green-900/30 border border-green-700/50 rounded-md text-green-200">
            ✅ Email sent successfully to {emailData.recipient_name} ({emailData.recipient_email})
          </div>
        )}
      </div>
    </div>
  );
}