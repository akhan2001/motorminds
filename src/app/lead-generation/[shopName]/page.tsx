'use client'

import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export default function ContactShop() {
  const router = useRouter();
  const params = useParams<{ shopName: string }>();

  useEffect(() => {
    if (!params?.shopName) {
      router.push('/lead-generation'); // Redirect if no shop name is provided
    }
  }, [params, router]);

  const decodedShopName = decodeURIComponent(params?.shopName || "");

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    toast.success(`Message sent to ${decodedShopName}`);
    setFormData({ name: "", email: "", message: "" });
  };

  return (
    <div className="max-w-md mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Contact {decodedShopName}</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          type="text"
          name="name"
          placeholder="Your Name"
          value={formData.name}
          onChange={handleChange}
          required
        />
        <Input
          type="email"
          name="email"
          placeholder="Your Email"
          value={formData.email}
          onChange={handleChange}
          required
        />
        <Textarea
          name="message"
          placeholder="Your Message"
          value={formData.message}
          onChange={handleChange}
          required
        />
        <Button type="submit" variant="default">Send Message</Button>
      </form>
    </div>
  );
}
