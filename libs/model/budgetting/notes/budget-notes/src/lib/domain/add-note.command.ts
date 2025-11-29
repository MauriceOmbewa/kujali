export interface AddNoteToBudgetCommand {
  budgetId: string;
  content: string;
  authorId: string;
  timestamp?: Date;
}