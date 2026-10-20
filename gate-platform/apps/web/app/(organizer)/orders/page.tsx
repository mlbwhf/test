import { redirect } from "next/navigation";

// Orders now live in Money → Orders.
export default function OrdersPage() {
  redirect("/money");
}
