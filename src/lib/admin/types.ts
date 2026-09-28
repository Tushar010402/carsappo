/** Result returned by every admin server action (safe to import from client components). */
export type ActionState = {
  ok?: boolean;
  message?: string;
  errors?: Record<string, string>;
  /** Client navigates here after a successful action (e.g. to the edit page of a new record). */
  redirectTo?: string;
};

/** Server action used with `<AdminForm>` (useActionState signature). */
export type FormAction = (prev: ActionState, formData: FormData) => Promise<ActionState>;

/** Server action with its arguments pre-bound on the server (`action.bind(null, id)`). */
export type BoundAction = () => Promise<ActionState>;
