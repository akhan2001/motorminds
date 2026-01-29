/**
 * Data Layer Exports
 * 
 * Following Supabase Studio patterns for data layer organization
 * Works directly with the expenses table
 */

export { expenseKeys, expenseInvalidations } from './keys'
export { useExpensesQuery } from './expenses-query'
export type { ExpenseFilters, ExpensesQueryResponse } from './expenses-query'
export type { ExpenseItem } from '../types/expenses'
