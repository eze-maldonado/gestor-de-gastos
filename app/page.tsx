import { ExpenseProvider } from "@/context/ExpenseContext";
import { ExpenseTrackerApp } from "@/components/ExpenseTrackerApp";

export default function Home() {
  return (
    <ExpenseProvider>
      <ExpenseTrackerApp />
    </ExpenseProvider>
  );
}
