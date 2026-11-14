export type QueryResult = { data: unknown[] | null; error: Error | null };
export type QueryBuilder = {
  select(columns: string): QueryBuilder;
  order(column: string): QueryBuilder;
  eq(column: string, value: string): QueryBuilder;
  then<TResult1 = QueryResult, TResult2 = never>(
    onfulfilled?: ((value: QueryResult) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): PromiseLike<TResult1 | TResult2>;
};
export type SupabaseQueryClient = { from(table: string): QueryBuilder };
