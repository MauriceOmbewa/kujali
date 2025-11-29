import { Component, OnInit, ViewChild, inject, signal, computed, effect, ChangeDetectionStrategy } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { toSignal } from '@angular/core/rxjs-interop';

import { cloneDeep as ___cloneDeep, flatMap as __flatMap } from 'lodash';
import { Observable, combineLatest, map, tap } from 'rxjs';

import { Logger } from '@iote/bricks-angular';

import { Budget, BudgetRecord, BudgetStatus, OrgBudgetsOverview } from '@app/model/finance/planning/budgets';

import { BudgetsStore, OrgBudgetsStore } from '@app/state/finance/budgetting/budgets';

import { CreateBudgetModalComponent } from '../../components/create-budget-modal/create-budget-modal.component';


@Component({
  selector: 'app-select-budget',
  templateUrl: './select-budget.component.html',
  styleUrls: ['./select-budget.component.scss', 
              '../../components/budget-view-styles.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
/** List of all active budgets on the system. */
export class SelectBudgetPageComponent implements OnInit
{
  // Inject dependencies using inject()
  private _orgBudgets$$ = inject(OrgBudgetsStore);
  private _budgets$$ = inject(BudgetsStore);
  private _dialog = inject(MatDialog);
  private _logger = inject(Logger);

  // Convert observables to signals
  overview = toSignal(this._orgBudgets$$.get(), { initialValue: null });
  sharedBudgets = toSignal(this._budgets$$.get(), { initialValue: [] });

  showFilter = signal(false);

  // Computed signal for combined budgets data
  allBudgets = computed(() => {
    const overview = this.overview();
    const budgets = this.sharedBudgets();
    
    if (!overview || !budgets) {
      return { overview: [], budgets: [] };
    }
    
    const flatOverview = __flatMap(overview);
    const flatBudgets = __flatMap(budgets);
    const transformedBudgets = flatBudgets.map((budget: any) => {
      budget['endYear'] = budget.startYear + budget.duration - 1;
      return budget;
    });
    
    return { overview: flatOverview, budgets: transformedBudgets };
  });

  constructor() {
    // Effect for side effects (logging, etc.)
    effect(() => {
      const budgets = this.allBudgets();
      if (budgets.budgets.length > 0) {
        this._logger.log(() => `Loaded ${budgets.budgets.length} budgets`);
      }
    });
  }

  ngOnInit() {
    // Initialization logic moved to constructor with signals
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    // this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  fieldsFilter(value: (Invoice) => boolean) {    
    // this.filter$$.next(value);
  }

  toogleFilter(value: boolean) {
    this.showFilter.set(value);
  }

  openDialog(parent : Budget | false): void 
  {
    const dialog = this._dialog.open(CreateBudgetModalComponent, {
      height: 'fit-content',
      width: '600px',
      data: parent != null ? parent : false
    });

    dialog.afterClosed().subscribe(() => {
      // Dialog after action
    })
  }

  /** 
   * @TODO - Review and fix
   * Returns true if the budget can be activated */
  canPromote(record: BudgetRecord) {
    // Get's set on Budget Read from user privileges and budget status.
    return (record.budget as any).canBeActivated;
  }

  /** Activate budget -> Promote to be used in  */
  setActive(record: BudgetRecord) 
  {
    const toSave = ___cloneDeep(record.budget);

    // Clean up budget record values.
    delete (toSave as any).canBeActivated;
    delete (toSave as any).access;

    // Set Active
    toSave.status = BudgetStatus.InUse;

    (<any> record).updating = true;
    // Fire update
    this._budgets$$.update(toSave)
      .subscribe(() => {
        (<any> record).updating = false;
        this._logger.log(() => `Updated Budget with id ${toSave.id}. Set as an active budget for this org.`) 
      });
  }
}