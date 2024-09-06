import type { Metadata } from "next";
import CreateModel from "@/ui/CreateModel";

export const metadata: Metadata = {
  title: "Register OpenAI Key",
  description: "register openai key of user",
};

export default function CreateModelPage() {
  return <CreateModel />;
}
