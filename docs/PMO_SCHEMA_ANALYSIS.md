# PMO Spreadsheet Schema Analysis

## Original PMO Columns (46 columns)

| # | Column Name | Sample Values | Notes |
|---|-------------|---------------|-------|
| 1 | Q | Q1, Q2 | Fiscal Quarter |
| 2 | Status | 🥳 Completed, ✔️ All assigned!, 🤯 Confirming Dates, 😫 Cancelled, 🔝 Needs Staffing, ⭐NEW, SA-Led, 😎 FYI | Emoji-prefixed statuses |
| 3 | Start Date | "Tue, Feb 3" | Day, Mon DD format |
| 4 | End Date | "Tue, Feb 3" | Day, Mon DD format |
| 5 | Location | "Tampa, FL", "Virtual (EST)", "Virtual", "Bangalore" | Physical or Virtual + timezone |
| 6 | Event Type | 1:1 Dev Day, Workshop/Webinar, Build & Learn, Regional Dev Day, Office Hours, Hackathon, Architect Day, Virtual Primer, Other | |
| 7 | Account | JPMorgan Chase & Co. (US), n/a (regional), Other | Company or n/a |
| 8 | if other (Account name) | Maya Philippines Inc. | Used when Account = "Other" |
| 9 | Event Region | AMER, EMEA, APAC, LATAM | Geographic region |
| 10 | Account Segment | AMER POD, AMER All, AMER Anchor, EMEA POD, LATAM Anchor, APAC Key Growth, etc. | Account tier/segment |
| 11 | Calendar Invite Title | [Confirmed] Developer Day JPMC, Tampa, FL | Full event title |
| 12 | Event ID | 3p8ikfuaih1bpoucmiu6bb2coo@google.com | Google Calendar event ID |
| 13 | Notes | Free text with context | Event details, attendee counts |
| 14 | Marketer | Rocio Safe, Zoe Shimberg | Marketing owner |
| 15 | Champion / Sponsor Name | Name(s) | Customer champion |
| 16 | Champion Job Title | Title | Champion's role |
| 17 | Champion's Motivation for Engagement | General Developer L&D, Up Skilling... | Why they want event |
| 18 | Event Page Link | URL | Splash/registration page |
| 19 | Agenda Details | Free text or URL | Session details |
| 20 | Wrike Planning Ticket (DevRel) | URL | Wrike ticket |
| 21 | SFDC Link | URL | Salesforce campaign |
| 22 | Project Plan Tracker Link | Google Sheets URL | Planning spreadsheet |
| 23 | Badge Assessment Ticket (Jira links) | LMSOPS-XXXX | Jira ticket(s) |
| 24 | Badge Assessment Links | URLs | LMS course links |
| 25 | Event Language | English, Spanish, French, Korean, Portuguese | Primary language |
| 26 | Event Slack Channel | Channel name | Internal coordination |
| 27 | Customer programming languages | Java, Python, C++, C | Tech stack |
| 28 | Travel | Ready to book, Virtual confirmed, Don't book yet, Not needed, Cancelled | Travel booking status |
| 29 | # of DAs Needed | 1, 2 | Headcount |
| 30-51 | DA Name Columns | ✅ On-site, ✅ Remote, Volunteer Travel, (empty) | Per-advocate assignment |

## DA Assignment Columns (22 advocates)
- Afi Gbadago
- Anant Srivastava
- Andrew Morgan
- Bohyun Jung
- Daniel Coupal
- Diana Esteves
- Diego Freniche Brito
- Franck Pachot
- Erik Hatcher
- Graeme Robinson
- Hubert Nguyen
- Justin LaBreck
- Lauren Schaefer
- Luce Carter
- Mike LaSpina
- Michael Lynn
- Nestor Daza
- Nic Raboy
- Ricardo Silva de Mello
- Stanimira Vlaeva
- Steffan Mejia
- Tim Kelly
- Wen Jie Teo

## Status Normalization

| PMO Status | Normalized | Description |
|------------|------------|-------------|
| 🥳 Completed | `COMPLETED` | Event finished |
| ✔️ All assigned! | `ASSIGNED` | Fully staffed |
| 🤯 Confirming Dates | `CONFIRMING` | Dates TBD |
| 😫 Cancelled | `CANCELLED` | Won't happen |
| 🔝 Needs Staffing | `NEEDS_STAFFING` | Need DAs |
| ⭐NEW | `NEW` | Just added |
| SA-Led | `SA_LED` | SA leading, not DevRel |
| 😎 FYI - No assignment needed | `FYI` | Info only |

## Event Type Normalization

| PMO Value | Normalized |
|-----------|------------|
| 1:1 Dev Day | `DEV_DAY_1_1` |
| Regional Dev Day | `DEV_DAY_REGIONAL` |
| Workshop/Webinar | `WEBINAR` |
| Build & Learn | `BUILD_LEARN` |
| Office Hours | `OFFICE_HOURS` |
| Hackathon | `HACKATHON` |
| Architect Day | `ARCHITECT_DAY` |
| Virtual Primer | `VIRTUAL_PRIMER` |
| Other | `OTHER` |

## Account Segment Parsing

Format: `{REGION} {TYPE}`

**Regions:** AMER, EMEA, APAC, LATAM

**Types:**
- `POD` - Pod accounts (top tier)
- `Anchor` - Anchor accounts
- `Aspire POD` - Aspiring to POD
- `Key Growth` - Growth accounts
- `All` - Regional (no specific account)

## Normalized Database Schema

```typescript
interface Event {
  _id: string;
  
  // Core
  name: string;                    // Calendar Invite Title
  quarter: string;                 // Q1, Q2, Q3, Q4
  status: EventStatus;
  
  // Dates
  startDate: Date;
  endDate: Date;
  
  // Location
  location: string;                // City or "Virtual"
  isVirtual: boolean;
  timezone?: string;               // EST, PST, CET, SGT, etc.
  
  // Type & Format
  eventType: EventType;
  
  // Account
  account?: {
    name: string;                  // Company name
    segment: AccountSegment;       // POD, Anchor, etc.
    region: Region;                // AMER, EMEA, APAC, LATAM
  };
  isRegional: boolean;             // n/a (regional)
  
  // Contacts
  marketer?: string;
  champion?: {
    name: string;
    title?: string;
    motivation?: string;
  };
  
  // Planning
  calendarEventId?: string;        // Google Calendar ID
  eventPageUrl?: string;
  agendaDetails?: string;
  wrikeTicket?: string;
  sfdcLink?: string;
  projectTrackerUrl?: string;
  
  // Badges/Learning
  badgeJiraTickets?: string[];
  badgeLinks?: string[];
  
  // Logistics
  language: string;
  slackChannel?: string;
  customerTechStack?: string[];
  travelStatus: TravelStatus;
  dasNeeded: number;
  
  // Assignments
  assignments: Assignment[];
  
  // Notes
  notes?: string;
  
  // Insights (from mobile app)
  insightCount: number;
  
  // Meta
  createdAt: Date;
  updatedAt: Date;
  importedFrom?: string;           // 'pmo-csv'
}

interface Assignment {
  advocateId: string;
  advocateName: string;
  assignmentType: 'ON_SITE' | 'REMOTE' | 'VOLUNTEER_TRAVEL';
}

type EventStatus = 
  | 'COMPLETED'
  | 'ASSIGNED'
  | 'CONFIRMING'
  | 'CANCELLED'
  | 'NEEDS_STAFFING'
  | 'NEW'
  | 'SA_LED'
  | 'FYI';

type EventType =
  | 'DEV_DAY_1_1'
  | 'DEV_DAY_REGIONAL'
  | 'WEBINAR'
  | 'BUILD_LEARN'
  | 'OFFICE_HOURS'
  | 'HACKATHON'
  | 'ARCHITECT_DAY'
  | 'VIRTUAL_PRIMER'
  | 'OTHER';

type Region = 'AMER' | 'EMEA' | 'APAC' | 'LATAM';

type AccountSegment =
  | 'POD'
  | 'ANCHOR'
  | 'ASPIRE_POD'
  | 'KEY_GROWTH'
  | 'ALL';

type TravelStatus =
  | 'READY_TO_BOOK'
  | 'VIRTUAL_CONFIRMED'
  | 'DONT_BOOK_YET'
  | 'NOT_NEEDED'
  | 'CANCELLED';
```

## Import Mapping

| CSV Column | DB Field | Transform |
|------------|----------|-----------|
| Q | quarter | Direct |
| Status | status | normalizeStatus() |
| Start Date | startDate | parseDate("Tue, Feb 3") |
| End Date | endDate | parseDate() |
| Location | location, isVirtual, timezone | parseLocation() |
| Event Type | eventType | normalizeEventType() |
| Account | account.name, isRegional | parseAccount() |
| if other | account.name | Merge if Account="Other" |
| Event Region | account.region | Direct |
| Account Segment | account.segment | parseSegment() |
| Calendar Invite Title | name | Direct |
| Event ID | calendarEventId | Direct |
| Notes | notes | Direct |
| Marketer | marketer | Direct |
| Champion / Sponsor Name | champion.name | Direct |
| Champion Job Title | champion.title | Direct |
| Champion's Motivation | champion.motivation | Direct |
| Event Page Link | eventPageUrl | Direct |
| Agenda Details | agendaDetails | Direct |
| Wrike Planning Ticket | wrikeTicket | Direct |
| SFDC Link | sfdcLink | Direct |
| Project Plan Tracker Link | projectTrackerUrl | Direct |
| Badge Assessment Ticket | badgeJiraTickets | Split by newline |
| Badge Assessment Links | badgeLinks | Split by newline |
| Event Language | language | Direct |
| Event Slack Channel | slackChannel | Direct |
| Customer programming languages | customerTechStack | Split by comma |
| Travel | travelStatus | normalizeTravelStatus() |
| # of DAs Needed | dasNeeded | parseInt() |
| [DA Name] | assignments[] | parseAssignment() |
