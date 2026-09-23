# Pulse Local Intelligence

Build PULSE — Real-Time Local Intelligence PWA



Build a polished, production-quality Progressive Web App (PWA) called PULSE.



Tagline:



«Know what's happening around you.»



Core Concept



Pulse is a real-time, location-aware information intelligence platform that helps people understand what is happening around them while separating early reports, rumors, corroborated information, and confirmed events.



The core principle is:



«Don't make people wait for verification. Show information immediately, clearly label uncertainty, and continuously update its truth state as evidence arrives.»



Pulse is NOT a traditional news app and NOT simply an "AI fact checker."



---



1. Location-First Experience



During onboarding ask for:



- Name

- Current city/region

- Location permission



Use the device's GPS when permission is granted.



The user's feed should automatically prioritize events based on:



Location + Distance + Recency + Relevance + Evidence



Allow users to manually select a location if GPS is unavailable.



Add Simulate Travel for demonstrations so a user can switch:



Abuja → Kaduna → Kano → Lagos



The feed should immediately update when the location changes.



Never tell users that a location is guaranteed "safe."



---



2. Home Feed



Create a clean mobile-first dashboard.



Header:



PULSE

"📍 Abuja"

"Live • Updated 8 seconds ago"



Display nearby events as live cards.



Each card contains:



- Event title

- Location

- Distance

- Time first reported

- Last update

- Number of independent reports

- Current status

- Short AI-generated summary



Statuses:



🟡 EARLY SIGNAL

A report exists, but there is insufficient independent evidence.



🟠 CORROBORATED

Multiple independent reports support the event.



🔴 CONFIRMED

Strong evidence or a credible source confirms the event.



⚪ DISPUTED

Credible reports conflict.



⚫ FALSE

Available evidence strongly indicates the claim is false.



🔵 EXPIRED

The information is no longer considered current.



---



3. The Core Innovation — Event Intelligence



Do not treat every post as separate news.



When users submit reports, extract the underlying claim/event.



Example:



«"Something happened near Central Market."»



Then:



«"People are running near Central Market."»



Then:



«"There was an explosion at Central Market."»



Pulse should recognize that these may describe the same event.



Create an internal Event Graph connecting:



- Reports

- Sources

- Location

- Time

- Images

- Videos

- Supporting evidence

- Contradicting evidence



Important rule:



«Virality does not equal corroboration.»



If 100 users copy the same WhatsApp message, treat it as potentially one source rather than 100 independent confirmations.



---



4. AI Verification Pipeline



When a report is submitted:



REPORT → CLAIM EXTRACTION → LOCATION EXTRACTION → EVENT MATCHING → EVIDENCE ANALYSIS → TRUTH STATE



AI should analyze:



Text



Identify:



- unsupported claims

- contradictions

- copied/repeated wording

- sensational language

- missing context

- suspicious certainty



Images



Perform an AI Visual Review for:



- visual inconsistencies

- suspicious cropping

- mismatched lighting/shadows

- warped objects

- reused imagery

- inconsistent resolution

- visible contextual inconsistencies



Do NOT claim definitive forensic deepfake detection.



Display:



«AI Visual Review: This analysis identifies possible visual inconsistencies or manipulation. It is not a forensic deepfake determination.»



---



5. Evidence Transparency



Every event must have a "Why am I seeing this?" section.



Show:



- Distance from user

- First reported

- Last updated

- Independent reports

- Supporting evidence

- Contradicting evidence

- Credible sources

- Media analyzed

- Media excluded and why

- Current status



Example:



«Why is this Corroborated?



4 independent reports were received from within 2.5 km.

2 reports contain matching location details.

1 image supports the reported location.

5 repeated messages were identified as originating from the same source.»



Do not simply display an "AI Verified" badge with no explanation.



---



6. Rumor Detection



Detect claims that are spreading rapidly without independent evidence.



Display:



«High circulation, low corroboration



This claim has been widely shared, but the reports appear to originate from the same source. Independent confirmation has not yet been established.»



Make the distinction between:



Shares: 147

Independent sources: 2



---



7. Truth Decay



Information becomes less reliable as it becomes old.



A confirmed event from 6:30 PM should not appear as current at 10 PM without new evidence.



Implement freshness tracking based on:



- Event type

- Time since confirmation

- Last supporting report

- Contradicting reports

- New evidence



Allow:



CONFIRMED → AGING → EXPIRED



unless the event receives new supporting evidence.



---



8. Report Something



Create a prominent REPORT button.



Users can submit:



- Text

- Image

- Video

- Voice

- Current location



Example:



«"I just heard loud explosions near Central Market."»



Immediately create an EARLY SIGNAL.



Do not make the user wait for AI processing.



While processing, show:



«Analyzing this report…»



Then update the event status in real time.



---



9. Voice Reporting



Support voice reports.



Pipeline:



Voice → Speech-to-Text → Language Detection → Claim Extraction → Location → Evidence Analysis



Prepare the architecture for:



- English

- Nigerian Pidgin

- Hausa

- Yoruba

- Igbo



---



10. Ask Pulse



Add an AI assistant called Ask Pulse.



Users can ask:



- "What's happening around me?"

- "What changed in the last 10 minutes?"

- "Anything happening on my way home?"

- "I heard there was an attack near the market. Is it true?"

- "Why is this report unverified?"



Answers must be generated from the current event/evidence data.



Never invent events.



Always communicate uncertainty.



---



11. Event Details



Clicking an event opens a detailed timeline.



Example:



Central Market Incident



🔴 CONFIRMED



6:34 PM

First report received.



6:37 PM

5 additional reports detected.



6:39 PM

AI identifies 4 reports as copies of the same source.



6:42 PM

Two independent eyewitness reports received.



6:45 PM

Credible local source confirms the incident.



6:47 PM

Previously published video identified and excluded from supporting evidence.



Show this as a visual evidence timeline.



---



12. Map



Create a live map showing nearby events.



Use visual indicators for:



- Early Signal

- Corroborated

- Confirmed

- Disputed

- False

- Expired



Selecting an event opens its details.



Do not create misleading "safe zones."



---



13. Live Updates



Use WebSockets or Server-Sent Events.



When a report changes an event's status, update all relevant users in real time.



Example:



EARLY SIGNAL



↓



new independent reports



↓



CORROBORATED



↓



credible evidence



↓



CONFIRMED



The event card should update without requiring a page refresh.



---



14. Notifications



Send push notifications for highly relevant nearby events.



Example:



«Pulse Alert



A new confirmed incident has been reported 2.3 km from your current location.



Tap to view evidence.»



Only notify users when relevance and evidence thresholds justify it.



Avoid alarmist notifications.



---



15. PWA



Build as a true installable PWA.



Include:



- Web App Manifest

- Service Worker

- Offline app shell

- Push notifications

- Background sync where supported

- Network reconnect handling

- Responsive mobile-first design

- Install prompt

- Fast loading



Navigation:



Home | Map | Report | Alerts | Profile



---



16. Recommended Stack



Frontend



- Next.js

- JavaScript

- Tailwind CSS

- shadcn/ui

- PWA support



Backend



- Node.js

- Express.js

- PostgreSQL

- WebSockets/SSE



AI



- Gemini API

- Speech-to-text

- Vision analysis



Location



- Browser Geolocation API

- Mapbox or OpenStreetMap



Storage



- PostgreSQL

- Object storage for images, videos and audio



---



17. Database



Create:



Users



- id

- name

- location

- latitude

- longitude

- createdAt



Reports



- id

- userId

- content

- media

- location

- timestamp

- extractedClaim

- aiAnalysis

- status



Events



- id

- title

- description

- location

- latitude

- longitude

- firstReportedAt

- lastUpdatedAt

- truthState

- freshnessScore



Evidence



- id

- eventId

- reportId

- type

- source

- supportsClaim

- contradictsClaim

- independenceSignals

- analysis



Sources



- id

- type

- verificationSignals

- history



---



18. Demo Mode



Include a realistic built-in demo scenario.



6:40 PM



Normal activity.



6:41 PM



First report:



«"I heard something happened near Central Market."»



Status:



🟡 EARLY SIGNAL



6:42 PM



Seven reports arrive.



Pulse identifies six as copies of the same message.



Status remains:



🟡 EARLY SIGNAL



6:43 PM



An old video is submitted.



Pulse identifies contextual inconsistencies and excludes it from supporting evidence.



6:45 PM



Two independent eyewitness reports arrive.



Status:



🟠 CORROBORATED



6:47 PM



A credible local source confirms the event.



Status:



🔴 CONFIRMED



6:50 PM



A contradictory report arrives.



Pulse displays the contradiction instead of hiding it.



This demo should clearly communicate how Pulse works.



---



19. Design



Make Pulse feel like a serious real-time intelligence product, not a social network.



Use:



- Clean typography

- High information density

- Strong accessibility contrast

- Clear status indicators

- Subtle animations

- Evidence timelines

- Interactive maps

- Mobile-first layouts

- Clear hierarchy



Avoid:



- Excessive gradients

- Flashy animations

- 3D effects

- Likes/followers

- Social-media engagement mechanics

- Fake "100% verified" claims



The UI should feel calm even when the information is urgent.



---



Core Product Loop



Everything should revolve around this:



USER REPORT



↓



AI CLAIM EXTRACTION



↓



LOCATION + TIME



↓



EVENT MATCHING



↓



EVIDENCE GRAPH



↓



INDEPENDENT CORROBORATION



↓



TRUTH STATE



↓



LOCATION-AWARE FEED



↓



CONTINUOUS UPDATES



↓



TRUTH DECAY



The final product should make information travel quickly without pretending that AI has perfect knowledge of the truth.



Build the MVP end-to-end, including the frontend, backend, database schema, AI integration structure, real-time updates, location handling, PWA functionality, and demo simulation.  NB: do not use emojis, use reacticons and Shadcn UI

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/fad8d9f4-6cf7-400f-ac8d-d7e9b614f5c8).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
