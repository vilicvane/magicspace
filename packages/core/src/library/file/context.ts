/**
 * Context is shared per destination file.
 */
export class Context<TMetadata extends object> {
  // eslint-disable-next-line no-null/no-null
  readonly metadata = Object.create(null) as TMetadata;

  constructor(readonly path: string) {}
}
