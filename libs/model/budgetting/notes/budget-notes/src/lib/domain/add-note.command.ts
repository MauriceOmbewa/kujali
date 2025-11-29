export class AddNoteToBudgetCommand {
  constructor(
    public budgetId: string,
    public content: string,
    public authorId: string,
    public timestamp?: Date
  ) {}
}