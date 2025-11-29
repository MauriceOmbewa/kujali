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

export class AddNoteToBudgetHandler extends FunctionHandler<AddNoteToBudgetCommand, AddNoteToBudgetResult> 
  implements ICommandHandler<AddNoteToBudgetCommand> {
  
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

      // Get repository from tools
      const repository = tools.getRepository('notes');
      
      // Create note object
      const note = {
        id: tools.generateId(),
        budgetId: command.budgetId,
        content: command.content.trim(),
        authorId: command.authorId,
        timestamp: command.timestamp || new Date(),
        createdAt: new Date()
      };

      // Save to repository
      await repository.addNote(note);

      return {
        success: true,
        noteId: note.id
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to add note: ${error.message}`
      };
    }
  }
}