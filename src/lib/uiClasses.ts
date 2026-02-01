export const ui = {
  /* Layout */
  page: "container-app",
  headerRow: "flex items-center justify-between",
  pageTitle: "title",

  /* Surfaces */
  section: "card card-pad",
  sectionTitle: "section-title",
  sectionHelp: "meta",

  /* Controls */
  fieldRow: "stack-xs",
  input: "input",
  select: "input",
  textarea: "textarea",

  /* Buttons */
  buttonPrimary: "btn btn-primary",
  buttonSecondary: "btn btn-ghost",
  miniButton: "btn btn-ghost",
  iconButton: "btn btn-ghost",

  /* Lists */
  list: "card",
  listItem: "row",
  listItemText: "body",

  /* Text states */
  errorText: "meta text-[hsl(var(--danger))]",
  emptyText: "meta",

  /* App chrome (legacy – no longer used directly) */
  appShell: "app",
  header: "",
  headerBrand: "body",

  /* Tab bar */
  tabBar: "",
  tabBarInner: "",
  tabItem: "meta",
  tabItemActive: "body",
} as const;
