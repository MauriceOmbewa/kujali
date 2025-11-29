import { FunctionHandler } from '@ngfi/functions';
import { FunctionContext } from '@ngfi/functions';
import { HandlerTools } from '@iote/cqrs';

import { AddNoteToBudgetCommand } from './add-note.command';

export interface ICommandHandler<TCommand> {
  execute(command: TCommand): Promise<void>;
}

export interface AddNoteToBudgetResult {
  success: boolean;
  noteId?: string;
  error?: string;
}

interface BudgetNote {
  id?: string;
  budgetId: string;
  content: string;
  authorId: string;
  timestamp: Date;
  createdAt: Date;
}

export class AddNoteToBudgetHandler extends FunctionHandler<AddNoteToBudgetCommand, AddNoteToBudgetResult> {
  
  async execute(command: AddNoteToBudgetCommand, context: FunctionContext, tools: HandlerTools): Promise<AddNoteToBudgetResult> {
    try {
      // Basic validation
      if (!command.budgetId || !command.content || !command.authorId) {
        return {
          success: false,
          error: 'Missing required fields: budgetId, content, or authorId'
        };
      }

      if (command.content.trim().length === 0) {
        return {
          success: false,
          error: 'Note content cannot be empty'
        };
      }

      // Get repository using proper path pattern
      const notesPath = `budgets/${command.budgetId}/notes`;
      const repository = tools.getRepository<BudgetNote>(notesPath);
      
      // Create note object
      const note: BudgetNote = {
        budgetId: command.budgetId,
        content: command.content.trim(),
        authorId: command.authorId,
        timestamp: command.timestamp || new Date(),
        createdAt: new Date()
      };

      // Save to repository using create method
      const result = await repository.create(note);
      const noteId = result.id || Date.now().toString();

      return {
        success: true,
        noteId: noteId
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to add note: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
}