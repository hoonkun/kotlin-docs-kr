export type FunctionComponent<ComponentProps> = (
  props: ComponentProps
) => JSX.Element | string | null | undefined

export type ClassComponent<ComponentProps> = new (
  props: ComponentProps
) => JSX.ElementClass

export type Component<ComponentProps> =
  | ClassComponent<ComponentProps>
  | FunctionComponent<ComponentProps>