// The integrations, one record per platform: the menu, the /integrations hub, each platform's own
// page, the sitemap and llms.txt all read this list, so they cannot disagree.

export interface Integration {
  slug: string;
  name: string;
  /** Menu and hub grouping. */
  group: "Work trackers" | "Whiteboards" | "Work management and files";
  /** "Two-way sync" writes back to the platform; "Import" brings boards in once. */
  kind: "Two-way sync" | "Import";
  /** One line for the menu and the hub card. */
  line: string;
  /** Page title (search engines) and the sentence under it. */
  title: string;
  lede: string;
  /** What comes over or stays in step. */
  what: string[];
  /** How to set it up, in order. */
  steps: string[];
  /** What it does not do, said plainly. */
  limits: string[];
  bg: string;
}

export const INTEGRATION_LIST: Integration[] = [
  {
    slug: "jira",
    name: "Jira",
    group: "Work trackers",
    kind: "Two-way sync",
    line: "Plan in the room; the plan lands in Jira.",
    title: "Jira integration for PI planning: two-way sync of epics, features and stories",
    lede: "Trainyard reads your epics, features and stories from Jira, lets the teams plan them on the PI planning board, and writes the plan back: iteration, team and dates.",
    what: ["Epics, features and stories come in with their status, estimate and team.", "Moving a card to an iteration or a team on the PI planning board is written back to Jira.", "Dependencies and risks raised in planning stay linked to the issues they concern.", "Every change waits in a queue you can inspect before and after it is sent."],
    steps: ["An administrator connects the Jira site once for the workspace.", "Choose the projects and the issue types that stand for epics, features and stories.", "Open the PI planning board: the backlog is already there. Plan, and the changes sync back."],
    limits: ["The Jira app for the Atlassian Marketplace is built on Atlassian Forge and its listing is in preparation; until it is listed, the connection is set up by an administrator.", "Cards on the Kanban and team boards are not live Jira issues yet; that link exists for Azure DevOps today."],
    bg: "#b9c6ff",
  },
  {
    slug: "azure-devops",
    name: "Azure DevOps",
    group: "Work trackers",
    kind: "Two-way sync",
    line: "Board cards are live work items.",
    title: "Azure DevOps integration: Kanban and PI planning boards on live work items",
    lede: "Link a Kanban or team board to a work item type and its cards are the work items. Add a card and a work item is created; move it and the state you mapped is written.",
    what: ["Epics on the Portfolio Kanban, features on the ART Kanban, user stories on the team board: each board links to the work item type you choose.", "You decide which Azure DevOps state each board state writes; the board suggests a mapping to start from.", "Title, state, size, business value, time criticality and, for a team, the iteration path are written back.", "The planning workspace also reads epics, features and stories and writes the plan back: iteration, team and dates."],
    steps: ["An administrator connects the organization and project once, with a personal access token that has Work Items (Read & write).", "On a Kanban or team board, choose Link to Azure DevOps, pick the work item type and confirm the state mapping.", "The work items arrive as cards. From then on, changes on the board are written to Azure DevOps, and Refresh brings in changes made there."],
    limits: ["Azure DevOps Services (dev.azure.com); Azure DevOps Server on your own machines is not supported yet.", "Changes made in Azure DevOps arrive when someone refreshes the board, not instantly.", "Removing a card does not delete the work item.", "The extension for the Visual Studio Marketplace is in preparation."],
    bg: "#5ff0e0",
  },
  {
    slug: "miro",
    name: "Miro",
    group: "Whiteboards",
    kind: "Import",
    line: "Bring a Miro board in as it is.",
    title: "Import Miro boards: PI planning and class boards from Miro to Trainyard",
    lede: "Connect Miro or upload a board's CSV export, and the board arrives as it is. Keep using it, save it as a template, or map its cards onto the plan.",
    what: ["Frames, sticky notes, cards and text arrive in place when you connect.", "A class board arrives as its lessons and exercises.", "Any imported board can be saved as a template or added to another board."],
    steps: ["Under Templates, Bring your own boards, choose Miro.", "Connect with a Miro access token and pick the board, or upload the CSV from Miro's board menu (Export, CSV).", "Open the imported board; map its cards onto the plan when you are ready."],
    limits: ["An import, not a live sync: later changes in Miro do not follow.", "A CSV upload carries the texts in reading order without positions.", "Miro's .rtb backups are encrypted by Miro and cannot be read."],
    bg: "#ffe27a",
  },
  {
    slug: "lucid",
    name: "Lucid",
    group: "Whiteboards",
    kind: "Import",
    line: "Lucidchart and Lucidspark documents.",
    title: "Import Lucidchart and Lucidspark boards into Trainyard",
    lede: "Connect Lucid or upload a document's shape CSV, and its pages come in as boards you can plan on.",
    what: ["Lucidspark boards and Lucidchart documents, with their shapes, notes and text.", "Imported boards can be saved as templates or mapped onto the plan."],
    steps: ["Under Templates, Bring your own boards, choose Lucid.", "Connect with a Lucid token and pick the document, or upload its shape CSV.", "Open the imported board."],
    limits: ["An import, not a live sync.", "A CSV upload carries shapes and text, not every style."],
    bg: "#ff9fc6",
  },
  {
    slug: "mural",
    name: "Mural",
    group: "Whiteboards",
    kind: "Import",
    line: "Murals, with their areas and notes.",
    title: "Import Mural boards into Trainyard",
    lede: "Connect Mural, pick a mural, and it arrives with its areas and sticky notes.",
    what: ["Areas, sticky notes and text arrive in place.", "Imported boards can be saved as templates or mapped onto the plan."],
    steps: ["Under Templates, Bring your own boards, choose Mural.", "Connect with a Mural token and pick the mural.", "Open the imported board."],
    limits: ["An import, not a live sync."],
    bg: "#b9c6ff",
  },
  {
    slug: "iobeya",
    name: "iObeya",
    group: "Whiteboards",
    kind: "Import",
    line: "Program, team and Kanban boards from an export.",
    title: "Move from iObeya: import program boards, team boards and Kanban",
    lede: "Upload an iObeya board export and the board comes over with its teams, iterations, cards and dependencies.",
    what: ["Program boards, team boards, Kanban boards, roadmaps and free boards.", "Teams, iterations, stages, cards, notes, charts, images and dependencies."],
    steps: ["In iObeya, open the board menu and choose Export.", "Under Templates, Bring your own boards, choose iObeya and upload the .zip, or the .csv inside it.", "Open the imported board."],
    limits: ["An import from a file, not a connection to your iObeya server."],
    bg: "#5ff0e0",
  },
  {
    slug: "trello",
    name: "Trello",
    group: "Work management and files",
    kind: "Import",
    line: "Lists become columns, cards stay cards.",
    title: "Import Trello boards into Trainyard",
    lede: "Connect Trello, pick a board, and its lists and cards come over ready to plan.",
    what: ["Lists arrive as columns and cards as cards.", "Imported boards can be saved as templates or mapped onto the plan."],
    steps: ["Under Templates, Bring your own boards, choose Trello.", "Connect with a Trello key and token and pick the board.", "Open the imported board."],
    limits: ["An import, not a live sync."],
    bg: "#ffe27a",
  },
  {
    slug: "monday",
    name: "monday.com",
    group: "Work management and files",
    kind: "Import",
    line: "Groups and items from a monday.com board.",
    title: "Import monday.com boards into Trainyard",
    lede: "Connect monday.com, pick a board, and its groups and items come over as a board.",
    what: ["Groups and their items.", "Imported boards can be saved as templates or mapped onto the plan."],
    steps: ["Under Templates, Bring your own boards, choose monday.com.", "Connect with a monday.com token and pick the board.", "Open the imported board."],
    limits: ["An import, not a live sync."],
    bg: "#ff9fc6",
  },
  {
    slug: "csv",
    name: "Spreadsheets (CSV)",
    group: "Work management and files",
    kind: "Import",
    line: "Excel, Google Sheets, Airtable or any export.",
    title: "Import a spreadsheet as a board: CSV from Excel, Google Sheets, Airtable or Jira",
    lede: "Any system that exports a table can become a board: upload or paste a CSV, name the column to group by, and each row becomes a card.",
    what: ["Each row becomes a card; the column you choose becomes the lanes.", "Works with CSV from Excel, Google Sheets, Airtable, Jira and most other tools.", "The same route feeds OKR and KPI dashboards with data from a CRM, finance or survey tool."],
    steps: ["Export the table as CSV.", "Under Templates, Bring your own boards, choose Any spreadsheet, then upload or paste it.", "Name the board and the column to group by."],
    limits: ["An import, not a live sync; upload again to refresh."],
    bg: "#b9c6ff",
  },
];

export const INTEGRATION_GROUPS = ["Work trackers", "Whiteboards", "Work management and files"] as const;
export const integration = (slug: string) => INTEGRATION_LIST.find((i) => i.slug === slug);
