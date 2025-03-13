import { cn } from "@/lib/utils";
import type { Message } from "ai/react";
import Image from "next/image";
import { useState } from "react";
import { CustomerFormMessage } from "./CustomerFormMessage";

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

  // Check if this is a form message
  const isFormMessage = props.message.formType && props.message.formType === 'customer-form';
  
  // Handle customer form submission
  const handleCustomerFormSuccess = (customer: any) => {
    setCreatedCustomer(customer);
    setFormSubmitted(true);
    setShowForm(false);
    
    if (props.onFormSubmit) {
      props.onFormSubmit('customer-form', customer);
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
        {/* Always show the message content */}
        <span>{props.message.content}</span>
        
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
        
        {/* Show success message after form submission */}
        {isFormMessage && formSubmitted && createdCustomer && (
          <div className="mt-2 p-3 bg-green-900/30 border border-green-700/50 rounded-md text-green-200">
            ✅ Customer created successfully: {createdCustomer.customer_name}
          </div>
        )}
      </div>
    </div>
  );
}