export interface ICommandHandler<TCommand> {
  execute(command: TCommand): Promise<void>;
}

export interface AddNoteToBudgetResult {
  success: boolean;
  noteId?: string;
  error?: string;
}