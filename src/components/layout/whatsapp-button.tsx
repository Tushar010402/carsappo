import { WhatsappIcon } from "@/components/icons/brand";
import { whatsappLink } from "@/lib/utils";

export function WhatsAppButton({ number }: { number: string }) {
  if (!number) return null;
  return (
    <a
      href={whatsappLink(number, "Hi Carsappo! I need help with")}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with us on WhatsApp"
      className="whatsapp-fab no-print fixed right-4 bottom-4 z-30 grid size-14 place-items-center rounded-full bg-[#25D366] text-white shadow-lift transition-all hover:scale-105 sm:right-6 sm:bottom-6"
    >
      <WhatsappIcon className="size-7" />
    </a>
  );
}
