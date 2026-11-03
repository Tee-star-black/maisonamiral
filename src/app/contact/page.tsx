import type { Metadata } from "next";
import { EditorialPage } from "@/components/editorial-page";
export const metadata: Metadata = {title:"Contact",description:"Contact Maison Amiral for orders, support and general enquiries."};
export default function ContactPage() {
  return <EditorialPage eyebrow="Maison Amiral / Johannesburg" title="Contact."
    intro="For orders, returns, shipping or general enquiries, email support@maisonamiral.co.za. Please include your order reference when contacting us about a purchase." >
      <p style={{fontSize:15,lineHeight:1.8}}>
        <a href="mailto:support@maisonamiral.co.za" style={{textDecoration:"underline",textUnderlineOffset:4}}>
          support@maisonamiral.co.za
        </a>
      </p>
    </EditorialPage>;
}