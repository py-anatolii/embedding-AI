import type { Metadata } from "next";
import ChatAI from "@/ui/ChatAI";

export const metadata: Metadata = {
  title: "Model: ",
  description: "chat with personal ai",
};

export default function RegisterKey() {
  return <ChatAI />;
}
